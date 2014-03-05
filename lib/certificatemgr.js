/**
 * This push/pull certificates to direct servers.  It assumes 
 * certificateserver is running on the host machine.
 */

var http = require('http');

var getPublicCertificate = function getPublicCertificate(hostname, port) {
	var options = {
			hostname: hostname,
			port: port,
			path: '/certificate',
			method: 'GET'
	};
	
	var req = http.request(options, function(res) {
		console.log('STATUS: ' + res.statusCode);
		console.log('HEADERS: ' + JSON.stringify(res.headers));
		res.setEncoding('utf8');
		res.on('data', function(chunk) {
			console.log('BODY: ' + chunk);
		});
	});
	
	req.write('data\n');
	req.write('data\n');
	req.end();
};

exports.pushPublicCertificate = function(hostname, port) {
	var options = {
			hostname: hostname,
			port: port,
			path: '/certificate',
			method: 'POST'
	};
	
	var req = http.request(options, function(res) {
		console.log('STATUS: ' + res.statusCode);
		console.log('HEADERS: ' + JSON.stringify(res.headers));
		res.setEncoding('utf8');
		res.on('data', function(chunk) {
			console.log('BODY: ' + chunk);
		});
	});
	
	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});
	
	req.write('data p\n');
	req.write('data p\n');
	req.end();
};

getPublicCertificate('localhost', 3000);