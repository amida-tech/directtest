/**
 * New node file
 */

var directserver = require("./lib/directserver");
var mh = require("./lib/mailbbtestcase");

var server = new directserver.DirectServer("expl-provider.amida-demo.com");

mh.deleteAllEmails(server);
