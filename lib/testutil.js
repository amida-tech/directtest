/**
 * Contains utility functions common to tests
 */

exports.sleep = function(callback, duration) {
    console.log("...sleeping for " + duration/1000 + "seconds.");
    setTimeout(function() {callback();}, duration);
};