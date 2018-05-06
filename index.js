'use strict';

const escapeRegExp = require('lodash.escaperegexp');
const path = require('path');
const PluginError = require('plugin-error');
const through = require('through2');

const utils = require('./utils');

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
      renames = renames.sort(utils.byLongestUnreved);

      // Once we have a full list of renames, search/replace in the cached
      // files and push them through.
      cache.forEach(function replaceInFile(file) {
        let contents = file.contents.toString();

        renames.forEach(function replaceOnce(rename, index) {
          const unreved = options.modifyUnreved ? options.modifyUnreved(rename.unreved) : rename.unreved;
          const reved = options.modifyReved ? options.modifyReved(rename.reved) : rename.reved;
          const regexp = new RegExp(escapeRegExp(unreved), 'g');
          const containingUnreved = [];
          for (let i = 0; i < index; i+=1){
            const longerUnreved = options.modifyUnreved ? options.modifyUnreved(renames[i].unreved) : renames[i].unreved;
            if(longerUnreved.includes(unreved)){
              containingUnreved.push(longerUnreved);
            }
          }
          contents = contents.replace(regexp, function(match, offset, string){
            for(let i = 0; i < containingUnreved.length; i+=1){
              const element = containingUnreved[i];
              if (string.substr(offset, element.length) === element || string.substr(offset + match.length - element.length, element.length) === element) {
                return match;
              }
            }
            return reved;
          })
          if (options.prefix) {
            contents = contents.split('/' + options.prefix).join(options.prefix + '/');
          }
        });

        file.contents = new Buffer(contents);
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
    if (path.sep !== '/' && options.canonicalUris) {
      filePath = filePath.split(path.sep).join('/');
    }

    return filePath;
  }
}
