/**
 * .Positive test:
 *      1) All certificates and trust bundles are removed.
 *      2) Added to provider:
 *          a) Provider PCKS12 as certificate.
 *          b) Patient self signed X.509 as trust anchor.
 *      3) Added to patient:
 *          a) Patient PKCS12 as certificate.
 *          b) Provider self signed X.509 as trust anchor.
 *       4) Provider can send message to patient.
 */

var nimble = require('nimble');

var directserver = require('./lib/directserver');
var mh = require("./lib/mailbbtestcase");
var util = require("./lib/testutil");

var providerServer = new directserver.DirectServer("expl-provider.amida-demo.com");
var patientServer = new directserver.DirectServer("expl-patient.amida-demo.com");

var provX509Info = Object.create(null);
provX509Info.filename = "provider";
provX509Info.domain = providerServer.ip;
provX509Info.country = "US";
provX509Info.city = "Rockville";
provX509Info.organization = "Amida Provider Services";

var patX509Info = Object.create(null);
patX509Info.filename = "patient";
patX509Info.domain = patientServer.ip;
patX509Info.country = "US";
patX509Info.city = "Rockville";
patX509Info.organization = "Amida Patient Services";

var email = {
    actual: {
    from : "user@expl-provider.amida-demo.com",
    to : "user@expl-patient.amida-demo.com",
    subject: "Test Message " + Date.now(),
    body: "Here goes the message body"
},
    attachment: "/Work/nodespace/directtest/resource/sample.txt"
};

nimble.series([
    function(callback) {providerServer.initSelfSigned(callback, provX509Info);},
    function(callback) {patientServer.initSelfSigned(callback, patX509Info);},
    function(callback) {providerServer.transferFile(callback, patientServer, provX509Info.filename + ".der", "/Work/sandbox/files");},
    function(callback) {patientServer.transferFile(callback, providerServer, patX509Info.filename + ".der", "/Work/sandbox/files");},
    function(callback) {providerServer.loadAnchor(callback, patX509Info.filename + ".der", providerServer.ip);},
    function(callback) {patientServer.loadAnchor(callback, provX509Info.filename + ".der", patientServer.ip);},
    function(callback) {util.sleep(callback, 5000);},
    function(callback) {mh.run(callback, providerServer, patientServer, email, 'complete');}
], function(err) {
    if (err) {
        console.log("...failure:");
        console.log(err);
    } else {
        console.log("...success");
    }
});

