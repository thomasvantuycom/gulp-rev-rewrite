'use strict';

const escapeRegExp = require('lodash.escaperegexp');
const path = require('path');
const PluginError = require('plugin-error');
const through = require('through2');

const replace = require('./lib/replace');
const utils = require('./lib/utils');

module.exports = function(options) {
  let renames = [];
  const cache = [];

  options = Object.assign({ canonicalUris: true, prefix: '', replaceInExtensions: ['.js', '.css', '.html', '.hbs'] }, options);

  return through.obj(function collectRevs(file, enc, cb) {
    if (file.isNull()) {
      this.push(file);
      return cb();
    }

    if (file.isStream()) {
      this.emit('error', new PluginError('gulp-rev-rewrite', 'Streaming not supported'));
      return cb();
    }

    // Collect renames from reved files.
    if (file.revOrigPath) {
      renames.push({
        unreved: fmtPath(file.revOrigBase, file.revOrigPath),
        reved: options.prefix + fmtPath(file.base, file.path)
      });
    }

    if (options.replaceInExtensions.includes(path.extname(file.path))) {
      // file should be searched for replaces
      cache.push(file);
    } else {
      // nothing to do with this file
      this.push(file);
    }

    cb();
  }, function replaceInFiles(cb) {
    const stream = this;

    if (options.manifest) {
      // Read manifest file for the list of renames.
      options.manifest.on('data', function (file) {
        const manifest = JSON.parse(file.contents.toString());
        Object.keys(manifest).forEach(function (srcFile) {
          renames.push({
            unreved: canonicalizeUri(srcFile),
            reved: options.prefix + canonicalizeUri(manifest[srcFile])
          });
        });
      });
      options.manifest.on('end', replaceContents);
    }
    else {
      replaceContents();
    }

    function replaceContents() {
      renames = renames.map(entry => {
        const unreved = options.modifyUnreved ? options.modifyUnreved(entry.unreved) : entry.unreved;
        const reved = options.modifyReved ? options.modifyReved(entry.reved) : entry.reved;
        return {unreved, reved};
      }).sort(utils.byLongestUnreved);

      // Once we have a full list of renames, search/replace in the cached
      // files and push them through.
      cache.forEach(function replaceInFile(file) {
        const contents = file.contents.toString();
        let newContents = replace(contents, renames);
        
        if (options.prefix) {
          newContents = newContents.split('/' + options.prefix).join(options.prefix + '/');
        }
        file.contents = Buffer.from(newContents);
        stream.push(file);
      });

      cb();
    }
  });

  function fmtPath(base, filePath) {
    const newPath = path.relative(base, filePath);

    return canonicalizeUri(newPath);
  }

  function canonicalizeUri(filePath) {
    if (options.canonicalUris) {
      filePath = filePath.replace(/\\/g, '/');
    }

    return filePath;
  }
}
