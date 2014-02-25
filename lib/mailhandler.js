/**
 * Library for sending e-mail
 */

var simplesmtp = require("simplesmtp");
var mailcomposer = require("mailcomposer");
var events = require("events");

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

	client.on('ready', function(success) {
		hasError = ! success;
		if (hasError) {
			emitter.emit('error', new Error("Unable to send email"));
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