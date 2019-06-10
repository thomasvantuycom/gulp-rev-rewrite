'use strict';

const path = require('path');
const PluginError = require('plugin-error');
const through = require('through2');

const replace = require('./lib/replace');

module.exports = function (options = {}) {
	let renames = [];
	const cache = [];

	return through.obj(function (file, enc, cb) {
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
				reved: fmtPath(file.base, file.path)
			});
		}

		cache.push(file);
		cb();
	}, function (cb) {
		const stream = this;

		if (options.manifest) {
			// Read manifest file for the list of renames.
			options.manifest.on('data', file => {
				const manifest = JSON.parse(file.contents.toString());
				Object.keys(manifest).forEach(srcFile => {
					renames.push({
						unreved: srcFile,
						reved: manifest[srcFile]
					});
				});
			});
			options.manifest.on('end', replaceContents);
		} else {
			replaceContents();
		}

		function replaceContents() {
			renames = renames.map(entry => {
				const {unreved} = entry;
				const reved = options.prefix ? prefixPath(entry.reved, options.prefix) : entry.reved;
				return {unreved, reved};
			});

			// Once we have a full list of renames, search/replace in the cached
			// files and push them through.
			cache.forEach(file => {
				const modifiedRenames = renames.map(entry => {
					const unreved = options.modifyUnreved ? options.modifyUnreved(entry.unreved, file) : entry.unreved;
					const reved = options.modifyReved ? options.modifyReved(entry.reved, file) : entry.reved;
					return {unreved, reved};
				});

				const contents = file.contents.toString();
				let newContents = replace(contents, modifiedRenames);

				if (options.prefix) {
					newContents = newContents.split('/' + options.prefix).join(options.prefix);
				}

				file.contents = Buffer.from(newContents);
				stream.push(file);
			});

			cb();
		}
	});

	function fmtPath(base, filePath) {
		const newPath = path.relative(base, filePath).replace(/\\/g, '/');
		return newPath;
	}

	function prefixPath(filePath, prefix) {
		if (filePath.startsWith('/') && prefix.endsWith('/')) {
			return `${prefix}${filePath.substr(1)}`;
		}

		if (!filePath.startsWith('/') && !prefix.endsWith('/')) {
			return `${prefix}/${filePath}`;
		}

		return `${prefix}${filePath}`;
	}
};
