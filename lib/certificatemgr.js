/**
 * This push/pull certificates to direct servers.  It assumes 
 * certificateserver is running on the host machine.
 */

var request = require('request');
var fs = require('fs');
var path = require('path');

var errorHandler = function errorHandler(err) {
	console.log(err);
};

exports.getCertificate = function getCertificate(filepath, hostname, port) {
	var filename = path.basename(filepath);
	var address = "http://" + hostname + ":" + port + "/cert/" + filename;
	var options = {
		uri: address,
		encoding: null
	};
	
	
	var r = request.get(options);
	
	r.on('error', function(err) {
		console.error(err);
	});
	
	var s = fs.createWriteStream(filepath);
	
	r.pipe(s);
};

exports.putCertificate = function putCertificate(filepath, hostname, port) {
	var s = fs.createReadStream(filepath);
	var filename = path.basename(filepath);
	var address = "http://" + hostname + ":" + port + "/cert/" + filename;
	var r = request.put(address);
	s.pipe(r);
};

exports.reset = function reset(hostname, port) {
	var address = "http://" + hostname + ":" + port + "/reset";
	request.del(address);
};
