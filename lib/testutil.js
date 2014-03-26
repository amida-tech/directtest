/**
 * Contains utility functions common to tests
 */

exports.sleep = function(callback, duration) {
    console.log("...sleeping for 5 seconds.");
    setTimeout(function() {callback();}, 5000);
};