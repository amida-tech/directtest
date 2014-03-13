var mh = require("./lib/mailbbtestcase");
var certificatemgr = require('./lib/certificatemgr');
var request = require('request');

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

mh.emitter.on('error', function(result) {
	console.error(">>>>> Error");
	console.error(result);
});

mh.emitter.on('end', function(result) {
	console.log('>>>>> Success');
	console.log(result);
});

//mh.execute(sendingServer, receivingServer, email);
//mh.execute(sendingServer, sendingServer, email2);

//mh.showAllEmails(receivingServer);


//getCertificate('localhost', 3000);
//certificatemgr.putCertificate('/Work/sandbox/clientout/patient.der', 'localhost', 3000);
//certificatemgr.reset('expl-provider.amida-demo.com', 3000);
//certificatemgr.getCertificate('/Work/sandbox/serverin/patient.der', 'localhost', 3000);

var info = {
	domain: "expl-provider.amida-demo.com",
	country: "US",
	city: "Rockville",
	organization: "Amida Provider Services",
	x509: "dcertificate",
	pkcs12: "dprivcert",
	request: "dreq.pem",
	trustUrl: "https://secure.bluebuttontrust.org/p7b.ashx?id=cb300117-3a4a-e211-8bc3-78e3b5114607",
	trustName: "test",
	owner: "expl-provider.amida-demo.com",
	filename: "patient.der"
};
//certificatemgr.createPKCS10('localhost', 3000, info);
//certificatemgr.createX509('localhost', 3000, info);
//certificatemgr.createPKCS12('localhost', 3000, info);
//certificatemgr.postTrustBundle('expl-provider.amida-demo.com', 3000, info);
//certificatemgr.postAnchor('expl-provider.amida-demo.com', 3000, info);
//certificatemgr.postCertificate('expl-provider.amida-demo.com', 3000, info);
request.del("http://expl-provider.amida-demo.com:3000/reset");

var address = "http://54.201.106.201:3000/bundle";
//var address = "https://secure.bluebuttontrust.org/p7b.ashx?id=cb300117-3a4a-e211-8bc3-78e3b5114607";
//request.get(address, function(error, response, body) {
//	console.log(error);
//	console.log(response);
//});

