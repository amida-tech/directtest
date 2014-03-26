/**
 * Represents a Direct server
 */

var url = require('url');
var request = require('request');
var nimble = require('nimble');
var path = require('path');

var fileutil = require('./fileutil');

var DirectServer = function(hostname) {
    this.ip = hostname;
    this.inPort = 465;
    this.inAuth = {
        user : "user",
        pass : "user"
    };
    this.outPort = 995;
    this.outAuth = {
        user : "catchall",
        pass : "password"
    };
    this.configPort = 3000;
};
exports.DirectServer = DirectServer;

DirectServer.prototype.getConfigURL = function(route) {
    var r = url.format({hostname: this.ip, port: this.configPort, protocol: 'http', pathname: route});
    return r;
};

var requestCall = function(callback, url, method, successCode, urlDetail) {
    var options = Object.create(null);
    options.uri = url;
    options.method = method;
    if (urlDetail) {
        options.json = urlDetail;
    }
    request(options, function(err, res, body) {
        if (err) {
            callback(err);
        } else {
            var code = res.statusCode;
            if (code === successCode) {
                callback();
            } else {
                console.log("...failed:");
                console.log(body);
                callback(new Error("Failed: " + url));
            }
        }
    });
};

DirectServer.prototype.reset = function(callback) {
    var url = this.getConfigURL('/reset');
    console.log("...resetting server configuration " + url);
    requestCall(callback, url, 'DELETE', 200);
};

DirectServer.prototype.loadPKCS12 = function(callback, certificateBaseName) {
    var url = this.getConfigURL('/loadPKCS12/' + certificateBaseName);
    console.log("...loading pkcs12 file " + url);
    requestCall(callback, url, 'POST', 200);
};

DirectServer.prototype.generateX509 = function(callback, certificateInfo) {
    var url = this.getConfigURL('/genX509');
    console.log("...generating X.509 certificate " + url);
    requestCall(callback, url, 'POST', 201, certificateInfo);
};

DirectServer.prototype.generatePKCS12 = function(callback, certificateBaseName) {
    var url = this.getConfigURL('/genPKCS12/' + certificateBaseName);
    console.log("...generating pkcs12 file " + url);
    requestCall(callback, url, 'POST', 201);
};

DirectServer.prototype.initSelfSigned = function(callback, x509Info) {
    var that = this;
    nimble.series([
        function(cb) {that.reset(cb);},
        function(cb) {that.generateX509(cb, x509Info);},
        function(cb) {that.generatePKCS12(cb, x509Info.filename);},
        function(cb) {that.loadPKCS12(cb, x509Info.filename);}
    ], function(err) {callback(err);});
};

DirectServer.prototype.transferFile = function(callback, toServer, filename, tmpDirectory) {
    console.log("...transfering file " + filename);
    var that = this;
    var tmpFilePath = path.join(tmpDirectory, filename);
    nimble.series([
        function(cb) {fileutil.downloadFile(that, filename, tmpDirectory, cb);},
        function(cb) {fileutil.sendFile(toServer.ip, toServer.configPort, tmpFilePath, cb);}
    ], function(err) {callback(err);});
};

DirectServer.prototype.loadAnchor = function(callback, filename, owner) {
    var url = this.getConfigURL('/loadAnchor');
    console.log("...loading anchor file " + url);
    requestCall(callback, url, 'POST', 200, {filename: filename, owner: owner});
};