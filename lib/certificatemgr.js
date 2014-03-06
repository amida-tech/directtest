/**
 * This push/pull certificates to direct servers.  It assumes 
 * certificateserver is running on the host machine.
 */

var request = require('request');
var fs = require('fs');

var errorHandler = function errorHandler(err) {
	console.log(err);
};

var getPublicCertificate = function getPublicCertificate(hostname, port) {
	var options = {
		uri: 'http://localhost:3000/certificate',
		encoding: null
	};
	
	
	var r = request.get(options);
	
	r.on('error', function(err) {
		console.error(err);
	});
	
	var s = fs.createWriteStream('/Work/sandbox/clientin/provider.der');
	
	r.pipe(s);
};

var pushPublicCertificate = function pushPublicCertificate(hostname, port) {
	var s = fs.createReadStream('/Work/sandbox/clientout/patient.der');
	var r = request.put('http://localhost:3000/certificate');
	s.pipe(r);
};

getPublicCertificate('localhost', 3000);
//pushPublicCertificate('localhost', 3000);