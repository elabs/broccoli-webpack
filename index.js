'use strict';

var RSVP = require('rsvp');
var webpack = require('webpack');
var syncDir = require("./sync_dir");
var path = require("path");
var fs = require("fs.extra");

function WebpackWriter(inputTree, options) {
	if (!(this instanceof WebpackWriter)) return new WebpackWriter(inputTree, options);
	this.inputTree = inputTree;
	this.options = options;
  this.inPath = path.join(process.cwd(), "./tmp/webpack-in");
  this.outPath = path.join(process.cwd(), "./tmp/webpack-out");
}

WebpackWriter.prototype.read = function(readTree) {
  var that = this

  return readTree(this.inputTree).then(function(tmpPath) {
    syncDir(tmpPath, that.inPath);

    var compiler;

    that.options['context'] = that.inPath;
    that.options['output'] = that.options['output'] || {};
    that.options['output']['path'] = that.outPath;

    if (that.compiler) {
      compiler = that.compiler;
    } else {
      compiler = webpack(that.options);
      that.compiler = compiler;
    }

    return new RSVP.Promise(function(resolve, reject) {
      compiler.run(function(err, stats) {
        var jsonStats = stats.toJson();
        if (jsonStats.errors.length > 0) jsonStats.errors.forEach(console.error);
        if (jsonStats.warnings.length > 0) jsonStats.warnings.forEach(console.warn);
        if (err || jsonStats.errors.length > 0) {
          reject(err);
        } else {
          resolve(that.outPath);
        }
      });
    });
  });
}

WebpackWriter.prototype.cleanup = function() {
  fs.rmrfSync(this.inPath);
  fs.rmrfSync(this.outPath);
}

module.exports = WebpackWriter;
