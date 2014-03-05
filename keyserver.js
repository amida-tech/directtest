/**
 * Key server generates and provides key files to the 
 */

var http = require('http');

var server = http.createServer();

var request = require('request');
var fs = require('fs');

server.on('request', function(req, res) {
	switch (req.method) {
	case 'POST':
		console.log("In PUT");
		var item = '';
		req.setEncoding('utf8');
		req.on('data', function(chunk) {
			item += chunk;
		});
		req.on('end', function() {
			console.log(item);
			res.end('OK\n');
		});
		break;
	case 'GET':
		console.log("In GET");
		res.writeHead(200, {'Content-Type': 'text/plain'});
		res.end('Hello World\n');
		break;
	}
});

server.listen(3000);