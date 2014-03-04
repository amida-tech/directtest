var mh = require("./lib/mailbbtestcase");

var sendingServer = {
		ip : "expl-provider.amida-demo.com",
		inPort: 465,
		inAuth : {
			user: "provider",
			pass: "provider"
		},
		outPort: 995,
		outAuth: {
			user: "catchall",
			pass: "password"
		}
};

var receivingServer = {
		ip : "expl-patient.amida-demo.com",
		outPort: 995,
		outAuth: {
			user: "catchall",
			pass: "password"
		}
};

var email = {
		actual: {
			from : "provider@expl-provider.amida-demo.com",
			to : "patient@expl-patient.amida-demo.com",
			subject: "Test Message " + Date.now(),
			body: "Here goes the message body"
		},
		attachment: "/Work/nodespace/directtest/resource/sample.txt"
};

var email2 = {
		actual: {
			from : "provider@expl-provider.amida-demo.com",
			to : "provider2@expl-provider.amida-demo.com",
			subject: "Test Message " + Date.now(),
			body: "Here goes the message body"
		},
		attachment: "/Work/nodespace/directtest/resource/sample.txt"
};

//mh.execute(sendingServer, receivingServer, email);
mh.execute(sendingServer, sendingServer, email2);

//mh.showAllEmails(receivingServer);

mh.emitter.on('error', function(result) {
	console.error(">>>>> Error");
	console.error(result);
});

mh.emitter.on('end', function(result) {
	console.log('>>>>> Success');
	console.log(result);
});
