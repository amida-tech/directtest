/**
 * Library for sending e-mail
 */

var simplesmtp = require("simplesmtp");
var mailcomposer = require("mailcomposer");
var events = require("events");
var nodepoplib = require("poplib");
var mailparser = require("mailparser");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
	
var emitter = new events.EventEmitter();
exports.emitter = emitter;

exports.send = function(server, mail, attachment) {
	var mailComposer = new mailcomposer.MailComposer();
	var client = simplesmtp.connect(server.port, server.ip, {
		secureConnection: true,
		auth: server.auth
	});
	var hasError = false;

	client.once('idle', function() {
		mailComposer.addHeader("x-mailer", "Nodemailer 1.0");
		mailComposer.setMessageOption(mail);
		mailComposer.addAttachment({filePath : attachment});
		
		var envelope = mailComposer.getEnvelope();
		client.useEnvelope(envelope);
	});

	client.on('message', function() {
		mailComposer.streamMessage();
		mailComposer.pipe(client);
	});

	client.on('ready', function(success, response) {
		hasError = ! success;
		if (hasError) {
			emitter.emit('error', new Error("Unable to send email"));
		} else {
			console.log(response);
		}
		client.close();
	});

	client.on('rcptFailed', function(addresses) {
		emitter.emit('rcptFailed', addresses);
	});

	client.on('error', function(err, stage) {
		hasError = true;
		emitter.emit('error', err);
	});

	client.on('end', function() {
		if (! hasError) {
			emitter.emit('end');
		}
	});
};

exports.receive = function (server) {
	var client = new nodepoplib(995, server.ip, {
		tlserrs: true,
		enabletls: true,
		debug: false,
	});
	var mailParser = new mailparser.MailParser();
	var totalmsgcount = 0;
	var currentmsg = 0;
	
	client.on("error", function(err) {
		emitter.emit('error', err);
	});
	
	client.on("connect", function() {
		client.login('catchall', 'password');
	});
	
	client.on("invalid-state", function(cmd) {
		emitter.emit('error', "receive invalid-state error: " + cmd);
	});
	
	client.on("locked", function(cmd) {
		emitter.emit('error', "receieve locked error: " + cmd);
	});
	
	client.on("login", function(status, rawdata) {
		if (status) {
			client.list();
		} else {
			emitter.emit('error', "receieve error on login: " + rawdata);
			client.quit();
		}
	});
	
	client.on("list", function(status, msgcount, msgnumber, data, rawdata) {
		if (! status) {
			emitter.emit('error', "receieve error on list: " + rawdata);
			client.quit();
		} else {
			if (msgcount > 0) {
				totalmsgcount = msgcount;
				currentmsg = 1;
				client.retr(1);
			} else {
				client.quit();
			}
		}
	});
	
	client.on("retr", function(status, msgnumber, data, rawdata) {
		if (status) {
			mailParser.write(data);
			mailParser.end();
			client.dele(msgnumber);
		} else {
			emitter.emit('error', "receive error on retr:" + rawdata);
			client.quit();
		}
	});
	
	client.on("dele", function(status, msgnumber, data, rawdata) {
		if (! status) {
			emitter.emit('error', "receive error on delete: " + rawdata);
			client.quit();
		} else {
			if (currentmsg < totalmsgcount) {
				currentmsg += 1;
				client.retr(currentmsg);
			} else {
				client.quit();
			}
		}
	});
	
	client.on("quit", function(status, rawdata) {
		if (! status) {
			emitter.emit('error', "receive error on quit: " + rawdata);
		}
	});
	
	mailParser.on("end", function(mail) {
		emitter.emit('received', mail);
	});
};