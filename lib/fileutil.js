/**
 * Sends receives files from servers
 */

var request = require('request');
var url = require('url');
var fs = require('fs');
var path = require('path');

var sendFile = function(hostname, port, filepath, callback) {
	var filename = path.basename(filepath);
	var route = '/file/' + filename;
	var address = url.format({hostname: hostname, port: port, protocol: 'http', pathname: route});
	var streamError = false;
    console.log("...uploading file " + address);
	
	var r = request.post(address, function(err, response, body) {
		if (err) {
			callback(err);
		} else {
			var code = response.statusCode;
			if ((code === 201) || streamError) {
				callback();
			} else {
				callback(new Error("Unexpected status code: " + code));
			}
		}
	});
	
	var stream = fs.createReadStream(filepath);
	stream.on('error', function(err) {
		callback(err);
	});
	stream.pipe(r);
};
exports.sendFile = sendFile;

exports.sendFiles = function(hostname, port, filepaths, callback) {
	var n = filepaths.length;
	var callbackCount = 0;
	var alreadyErrored = false;
	var f = function(err) {
		if (! alreadyErrored) {
			if (err) {
				alreadyErrored = true;
				callback(err);
			} else {
				++callbackCount;
				if (callbackCount === n) {
					callback();
				}
			}
		}
	};
	for (var i=0; i<n; ++i) {
		sendFile(hostname, port, filepaths[i], f);
	}
};

var getURLFile = function(url, filepath, callback) {
    var errorSent = false;
	var options = {
		uri: url,
		encoding: null
	};

	var r = request.get(options, function(err, response, body) {
        if (err) {
            errorSent = true;
            callback(err);
        } else {
            var code = response.statusCode;
            if (code !== 200) {
                errorSent = true;
                callback(new Error("Unexpected status code: " + code));
            }
        }
    });
		
	var stream = fs.createWriteStream(filepath);
    stream.on('error', function(err) {
        errorSent = true;
        callback(err);
	});
    stream.on('finish', function() {
        if (! errorSent) {
            callback();
        }
    });
	r.pipe(stream);
};
exports.getURLFile = getURLFile;

exports.downloadFile = function(server, filename, toDirectory, callback) {
    var url = server.getConfigURL("/file/" + filename);
    console.log("...downloading file " + url);
    var toFilepath = path.join(toDirectory, filename);
    getURLFile(url, toFilepath, callback);
};