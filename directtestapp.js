var simplesmtp = require("simplesmtp");
var nimble = require("nimble");
var fs = require("fs");
var MailComposer = require("mailcomposer").MailComposer;

var mailComposer = new MailComposer();

var message = {
		status: 'initial',
		error: null,
		failedAddresses: []
	};

var client = simplesmtp.connect(465, "smtp.mail.yahoo.com", {
	secureConnection: true,
    auth: {user: "xxxxxxx", pass: "xxxxxx"}
});

client.once('idle', function() {
	console.log('On Idle');
	message.status = 'idle';
	
	mailComposer.addHeader("x-mailer", "Nodemailer 1.0");
	mailComposer.setMessageOption({
		from: "xxxxxxxxx",
		to: "xxxxxx",
		body: "Hello World"
	});
	mailComposer.addAttachment({filePath : "/Work/nodespace/directtest/resource/sample.txt"});
	
	var envelope = mailComposer.getEnvelope();
	client.useEnvelope(envelope);
});

client.on('message', function() {
	console.log('On Message');
	message.status = 'readytbsent';

	this.on("end", function(mail) {
		console.log("mailcomposer end");
    });
	
	mailComposer.streamMessage();
	mailComposer.pipe(client);
	//client.end();
});

client.on('ready', function(success) {
	console.log('On Ready');
	console.log(success);
	client.close();
	message.status = 'sent';
	if (! success) {
		message.error = 'Unknown error';
	}
});

client.on('rcptFailed', function (addresses) {
	console.log('On Recipent');
	console.log(addresses);
	message.failedAddresses = addresses;
});

client.on('error', function(err, stage) {
	console.log('On Error');
	console.log(err);
	message.status = 'sent';
	message.error = "Known error";
});

client.on('end', function() {
	console.log('On End');
});
