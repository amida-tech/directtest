/**
 * Key server generates and provides key files to the 
 */

var restify = require('restify');
var fs = require('fs');

var server = restify.createServer();

var errorHandler = function errorHandler(err) {
	console.log(err);
};

function putFile(req, res, next) {
	console.log('in putfile');

	var data = new Buffer('');
	
	req.on('data', function(chunk) {
		data = Buffer.concat([data, chunk]);
	});
	
	req.on('end', function() {
		fs.writeFile('/Work/sandbox/serverin/patient.der', data, 'binary', errorHandler);
		res.send(200);
	});
}

function getFile(req, res, next) {
	fs.readFile('/Work/sandbox/serverout/provider.der', function(err, data) {
		res.setHeader('content-type', 'application/octet-stream');
		res.send(data);
	});
}

server.put('/certificate', putFile);
server.get('/certificate', getFile);

server.listen(3000);