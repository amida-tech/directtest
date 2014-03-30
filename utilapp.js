/**
 * Utility applications for testing
 */

var directserver = require("./lib/directserver");
var mh = require("./lib/mailbbtestcase");

var deleteAll = function() {
    if (process.argv.length < 4) {
        console.log("No server is specified.");
    } else {
        var serverName = process.argv[3];
        var server = new directserver.DirectServer(serverName);
        mh.deleteAllEmails(server);
    }
};

var utils = Object(null);
utils.deleteAll = deleteAll;

if (process.argv.length < 3) {
    console.log("No utility is specified.");
} else {
    var util = process.argv[2];
    console.log(util + " is selected.");
    utils[util]();
}
