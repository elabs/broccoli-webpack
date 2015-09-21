var fs = require("fs.extra");
var path = require("path");
var crypto = require("crypto");
var empty = {};

function copySync(src, dest) {
  var contents = fs.readFileSync(src)
  fs.writeFileSync(dest, contents, { flag: 'wx' })
}

function hash(src) {
  var contents = fs.readFileSync(src);
  if(contents.length) {
    var shasum = crypto.createHash("sha256");
    shasum.update(contents);
    return shasum.digest("hex");
  } else {
    return empty;
  }
}

function syncDir (src, dest) {
  var srcStats = fs.statSync(src);

  try {
    var destStats = fs.statSync(dest);
  } catch(e) {
  }

  if (srcStats.isDirectory()) {
    if(destStats && !destStats.isDirectory()) {
      fs.unlinkSync(dest);
    } else if(!destStats) {
      fs.mkdirSync(dest);
    }

    var entries = fs.readdirSync(src).sort()
    for (var i = 0; i < entries.length; i++) {
      syncDir(src + path.sep + entries[i], dest + path.sep + entries[i])
    }
  } else if (srcStats.isFile()) {
    if(destStats && destStats.isDirectory()) {
      fs.rmrfSync(dest);
      copySync(src, dest);
    } else if(!destStats) {
      copySync(src, dest);
    } else {
      if (hash(src) !== hash(dest)) {
        fs.unlinkSync(dest);
        copySync(src, dest);
      }
    }
  } else {
    throw new Error('Unexpected file type for ' + src)
  }
}

module.exports = syncDir;
