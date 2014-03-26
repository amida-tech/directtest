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

exports.getFile = function(filepath, hostname, port) {
	var filename = path.basename(filepath);
	var address = "http://" + hostname + ":" + port + "/file/" + filename;
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

exports.putFile = function(filepath, hostname, port) {
	var s = fs.createReadStream(filepath);
	var filename = path.basename(filepath);
	var address = "http://" + hostname + ":" + port + "/file/" + filename;
	var r = request.post(address);
	s.pipe(r);
};

exports.createPKCS10 = function createPKCS10(hostname, port, info) {
	var address = "http://" + hostname + ":" + port + "/pkcs10";
	var options = {
		uri: address,
		json: info
	};
	request.post(options);
};

exports.createX509 = function createX509(hostname, port, info) {
	var address = "http://" + hostname + ":" + port + "/x509";
	var options = {
		uri: address,
		json: info
	};
	request.post(options);
};

exports.createPKCS12 = function(hostname, port, info) {
	var address = "http://" + hostname + ":" + port + "/pkcs12";
	var options = {
		uri: address,
		json: info
	};
	request.post(options);
};

exports.postTrustBundle = function(hostname, port, info) {
	var address = "http://" + hostname + ":" + port + "/trustbundle";
	var options = {
		uri: address,
		json: info
	};
	var r = request.post(options);
	r.on('error', function(err) {
		console.error(err);
	});
};

exports.postCertificate = function(hostname, port, info) {
	var address = "http://" + hostname + ":" + port + "/cert";
	var options = {
		uri: address,
		json: info
	};
	var r = request.post(options);
	r.on('error', function(err) {
		console.error(err);
	});
};


