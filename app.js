var input = "";

process.argv.forEach(function (val, index, array) {
	if (index > 2) {
		input = input + " " + val;
	}
});
var inputJSON = JSON.parse(input);

var mh = require("./lib/mailhandler");

var server = {
		port: inputJSON.port,
		ip : inputJSON.ip,
		auth : {
			user: inputJSON.user,
			pass: inputJSON.pass
		}
};

var mail = {
		from : inputJSON.from,
		to : inputJSON.to,
		subject: inputJSON.subject,
		body: inputJSON.body
};

var attachment = inputJSON.attachment;

//mh.send(server, mail, attachment);

mh.receive(server);

mh.emitter.on('error', function(err) {
	console.log("Error");
	console.log(err);
});

mh.emitter.on('end', function() {
	console.log('Succesful');
});
