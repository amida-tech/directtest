/**
 * This implements the basic infrastructure to sending/receiving e-mails.
 * It is mainly designed to test communication between two HISP's but any 
 * two email servers should do.  It is assumed that the receiving HISP
 * always sends back an MDN/DSN.
 * 
 * Logic:
 *   1) Send email from one server to the other with email client.
 *   2) Using POP3 client poll both servers until
 *     a) Sending server has undelivered message
 *     b) Receiving server has the original message and sending server
 *        has MDN
 *        
 * Emits 'error' or 'end'
 */

var simplesmtp = require("simplesmtp");
var mailcomposer = require("mailcomposer");
var events = require("events");
var nodepoplib = require("poplib");
var mailparser = require("mailparser");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // Dunno this is needed.  Otherwise send email does not work.
	
var emitter = new events.EventEmitter();
exports.emitter = emitter;
var EmitKey = Object.create(null);
EmitKey.ERROR = 'error';
EmitKey.END = 'end';

var Status = Object.create(null);
Status.NEW = 'new';
Status.ERROR = 'error';
Status.SENT = 'sent';
Status.REJECTED = 'rejected';
Status.INCOMPLETE = 'incomplete';
Status.COMPLETE = 'complete';

var TestResult = function(sendingIP, receivingIP, subject) {
	this.sendingIP = sendingIP;
	this.receivingIP = receivingIP;
	this.subject = subject;
	
	this.status = Status.NEW;
	
	this.err = null;
	this.emailFromSending = null;
	this.emailFromReceiving = null;
};

TestResult.prototype.setError = function(err) {
	this.status = Status.ERROR;
	this.err = err;
	emitter.emit(EmitKey.ERROR, err);
};

TestResult.prototype.setEmailSent = function() {
	this.status = Status.SENT;
};

TestResult.prototype._actOnIP = function(ip, sendingAction, receivingAction, noneAction) {
	if (ip === this.sendingIP) {
		return sendingAction();
	} else if (ip === this.receivingIP) {
		return receivingAction();
	} else {
		return noneAction();
	}
};

TestResult.prototype._setReceivedEmailFromSending = function(email) {
	this.emailFromSending = email;
	if (email.subject.indexOf('Undelivered')) {
		this.status = Status.REJECTED;
		emitter.emit('end', this);
	} else {
		if (this.emailFromReceiving !== null) {
			this.status = Status.COMPLETED;
			emitter.emit(EmitKey.END, this);
		} else {
			this.status = Status.INCOMPLETE;
		}
	}
};

TestResult.prototype._setReceivedEmailFromReceiving = function(email) {
	this.mailFromReceiving = email;
	if (this.mailFromSending !== null) {
		this.status = Status.COMPLETED;
		emitter.emit(EmitKey.END, this);
	} else {
		this.status = Status.INCOMPLETE;
	}
};

TestResult.prototype.setReceivedEmail = function(ip, email) {
	var emailSubject = email.subject;
	console.log("subject...compare..." + emailSubject + "..." + this.subject);
	if ((emailSubject !== undefined) && (emailSubject.indexOf(this.subject) > -1)) {
		var that = this;
		return this._actOnIP(ip,
			function() {
				that._setReceivedEmailFromSending(email);
				return true;
			},
			function() {
				that._setReceivedEmailFromReceiving(email);
				return true;
			},
			function () {
				return false;
			});
	} else {
		return false;
	}
};

TestResult.prototype.hasError =  function() {
	return this.status === Status.ERROR;
};

TestResult.prototype.isComplete = function() {
	return this.hasError() || (this.status === Status.REJECTED) || (this.status === Status.COMPLETE);
};

TestResult.prototype.hasEmail = function(ip) {
	var that = this;
	return this._actOnIP(ip,
			function() {
				return that.emailFromSending !== null;
			},
			function() {
				return that.emailFromReceiving !== null;
			},
			function() {
				that.setError(new Error("internal bug assertion: unrecognized server"));
				return false;
			});
};

var receive = function receive(server, result) {
	console.log("receiving" + server.ip);
	var client = new nodepoplib(server.outPort, server.ip, {
		tlserrs: true,
		enabletls: true,
		debug: false,
	});
	var totalmsgcount = 0;
	var currentmsgindex = 0;
	var currentmsgnumber = 0;
	
	client.on("error", function(err) {
		console.log("receive...error..." + server.ip);
		result.setError(err);
	});
	
	client.on("connect", function() {
		console.log("receive...connect..." + server.ip);
		if (! result.hasError()) {
			client.login(server.outAuth.user, server.outAuth.pass);
		} else {
			client.quit();
		}
	});
	
	client.on("invalid-state", function(cmd) {
		result.setError(new Error("receive invalid-state error: " + cmd));
	});
	
	client.on("locked", function(cmd) {
		result.setError(new Error("receieve locked error: " + cmd));
	});
	
	client.on("login", function(status, rawdata) {
		console.log("receive...login..." + server.ip);
		if (! result.hasError()) {
			if (status) {
				client.list();
			} else {
				result.setError(new Error("receieve error on login: " + rawdata));
				client.quit();
			}
		} else {
			client.quit();
		}
	});
	
	client.on("list", function(status, msgcount, msgnumber, data, rawdata) {
		console.log("receive...list..." + server.ip);
		if (! result.hasError()) {
			if (! status) {
				result.setError(new Error('error', "receieve error on list: " + rawdata));
				client.quit();
			} else {
				console.log("receive...list..." + server.ip + "...count..." + msgcount);
				if (msgcount > 0) {
					totalmsgcount = msgcount;
					currentmsgindex = 1;
					client.retr(1);
				} else {
					client.quit();
				}
			}
		} else {
			client.quit();
		}
	});
	
	var handleParsedEmail = function(email) {
		console.log("parser...end..." + server.ip);
		var messageRelatedToSent = result.setReceivedEmail(server.ip, email);
		if (messageRelatedToSent) {
			client.dele(currentmsgnumber);
		} else {
			if (currentmsgindex < totalmsgcount) {
				currentmsgindex += 1;
				console.log("parser...end...retr..." + currentmsgindex + "..." + server.ip);
				client.retr(currentmsgindex);
			} else {
				client.quit();
			}
		}
	};

	client.on("retr", function(status, msgnumber, data, rawdata) {
		console.log("receive...retr..." + msgnumber + "..." + server.ip);
		if (! result.hasError()) {
			if (status) {
				currentmsgnumber = msgnumber;
				var mailParser = new mailparser.MailParser();
				mailParser.on("end", handleParsedEmail);
				mailParser.write(data);
				mailParser.end();
			} else {
				result.setError(new Error("receive error on retr:" + rawdata));
				client.quit();
			}
		} else {
			client.quit();
		}
	});
	
	client.on("dele", function(status, msgnumber, data, rawdata) {
		console.log("receive...dele..." + server.ip);
		if (! result.hasError()) {
			if (! status) {
				result.setError(new Error("receive error on delete: " + rawdata));
				client.quit();
			} else {
				client.quit();
			}
		} else {
			client.quit();
		}
	});
	
	client.on("quit", function(status, rawdata) {
		console.log("receive...quit..." + server.ip);
		if (status) {
			if ((! result.hasEmail(server.ip)) && (! result.isComplete())) {
				setTimeout(function() {receive(server, result);}, 1000);
			}
		} else {
			result.setError(new Error("receive error on quit: " + rawdata));
		}
	});
};

exports.execute = function execute(sendingServer, receivingServer, email) {
	var result = new TestResult(sendingServer.ip, receivingServer.ip, email.actual.subject);
	var mailComposer = new mailcomposer.MailComposer();
	var client = simplesmtp.connect(sendingServer.inPort, sendingServer.ip, {
		secureConnection: true,
		auth: sendingServer.inAuth
	});

	client.once('idle', function() {
		console.log("send...idle..." + sendingServer.ip);
		mailComposer.addHeader("x-mailer", "Nodemailer 1.0");
		mailComposer.setMessageOption(email.actual);
		mailComposer.addAttachment({filePath : email.attachment});
		
		var envelope = mailComposer.getEnvelope();
		client.useEnvelope(envelope);
	});

	client.on('message', function() {
		console.log("send...message..." + sendingServer.ip);
		mailComposer.streamMessage();
		mailComposer.pipe(client);
	});

	client.on('ready', function(success, response) {
		console.log("send...ready..." + sendingServer.ip);
		if (! success) {
			result.setError(new Error("unable to send email"));
		}
		client.close();
	});

	client.on('rcptFailed', function(addresses) {
		result.failedReceipients = addresses;
	});

	client.on('error', function(err, stage) {
		console.log("send...error..." + sendingServer.ip);
		result.setError(err);
	});

	client.on('end', function() {
		console.log("send...end..." + sendingServer.ip);
		if (! result.hasError()) {
			result.setEmailSent();
			receive(sendingServer, result);
			receive(receivingServer, result);
		}
	});
};

exports.deleteAllEmails = function deleteAllEmails(server) {
	console.log("deleting all emails" + server.ip);
	var client = new nodepoplib(server.outPort, server.ip, {
		tlserrs: true,
		enabletls: true,
		debug: false,
	});
	var totalmsgcount = 0;
	var currentmsgindex = 0;
	var currentmsgnumber = 0;
	var hasError = false;
	
	client.on("error", function(err) {
		console.error("receive...error..." + server.ip);
		console.error(err);
		hasError = true;
	});
	
	client.on("connect", function() {
		console.log("receive...connect..." + server.ip);
		if (! hasError) {
			client.login(server.outAuth.user, server.outAuth.pass);
		} else {
			client.quit();
		}
	});
	
	client.on("invalid-state", function(cmd) {
		console.error("receive invalid-state error: " + cmd);
		hasError = true;
	});
	
	client.on("locked", function(cmd) {
		console.error("receieve locked error: " + cmd);
		hasError = true;
	});
	
	client.on("login", function(status, rawdata) {
		console.log("receive...login..." + server.ip);
		if (! hasError) {
			if (status) {
				client.list();
			} else {
				console.error("receieve error on login: " + rawdata);
				hasError = true;
				client.quit();
			}
		} else {
			client.quit();
		}
	});
	
	client.on("list", function(status, msgcount, msgnumber, data, rawdata) {
		console.log("receive...list..." + server.ip);
		if (! hasError) {
			if (! status) {
				console.error('error', "receive error on list: " + rawdata);
				hasError = true;
				client.quit();
			} else {
				console.log("receive...list..." + server.ip + "...count..." + msgcount);
				if (msgcount > 0) {
					totalmsgcount = msgcount;
					currentmsgindex = 1;
					client.retr(1);
				} else {
					client.quit();
				}
			}
		} else {
			client.quit();
		}
	});
	

	client.on("retr", function(status, msgnumber, data, rawdata) {
		console.log("receive...retr..." + msgnumber + "..." + server.ip);
		if (! hasError) {
			if (status) {
				client.dele(msgnumber);
			} else {
				console.error("receive error on retr:" + rawdata);
				hasError = true;
				client.quit();
			}
		} else {
			client.quit();
		}
	});
	
	client.on("dele", function(status, msgnumber, data, rawdata) {
		console.log("receive...dele..." + msgnumber + "..." + server.ip);
		if (! hasError) {
			if (! status) {
				console.error("receive error on delete: " + rawdata);
				hasError = true;
				client.quit();
			} else {
				if (currentmsgindex < totalmsgcount) {
					currentmsgindex += 1;
					client.retr(currentmsgindex);
				} else {
					client.quit();
				}
			}
		} else {
			client.quit();
		}
	});
};