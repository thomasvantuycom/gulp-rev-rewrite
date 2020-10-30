'use strict';

const {relative} = require('path');
const PluginError = require('plugin-error');
const through = require('through2');

const replace = require('./lib/replace');

function relativePath(from, to) {
	return relative(from, to).replace(/\\/g, '/');
}

function prefixPath(path, prefix) {
	if (path.startsWith('/') && prefix.endsWith('/')) {
		return `${prefix}${path.slice(1)}`;
	}

	if (!path.startsWith('/') && !prefix.endsWith('/')) {
		return `${prefix}/${path}`;
	}

	return `${prefix}${path}`;
}

module.exports = function (options = {}) {
	let renames = [];
	const cache = [];

	return through.obj((file, encoding, callback) => {
		if (file.isNull()) {
			return callback(null, file);
		}

		if (file.isStream()) {
			return callback(new PluginError('gulp-rev-rewrite', 'Streaming not supported'));
		}

		// Collect renames from reved files.
		if (file.revOrigPath) {
			renames.push({
				unreved: relativePath(file.revOrigBase, file.revOrigPath),
				reved: relativePath(file.base, file.path)
			});
		}

		cache.push(file);

		callback();
	}, function (callback) {
		const stream = this;

		if (options.manifest) {
			const manifest = JSON.parse(options.manifest.toString());

			for (const [unreved, reved] of Object.entries(manifest)) {
				renames.push({unreved, reved});
			}
		}

		replaceContents();

		function replaceContents() {
			if (options.prefix) {
				renames = renames.map(entry => {
					entry.reved = prefixPath(entry.reved, options.prefix);
					return entry;
				});
			}

			// Once we have a full list of renames, search/replace in the cached
			// files and push them through.
			cache.forEach(file => {
				const modifiedRenames = renames.map(entry => {
					const {unreved, reved} = entry;
					const modifiedUnreved = options.modifyUnreved ? options.modifyUnreved(unreved, file) : unreved;
					const modifiedReved = options.modifyReved ? options.modifyReved(reved, file) : reved;
					return {unreved: modifiedUnreved, reved: modifiedReved};
				});

				const contents = file.contents.toString();
				let newContents = replace(contents, modifiedRenames);

				if (options.prefix) {
					newContents = newContents.split('/' + options.prefix).join(options.prefix);
				}

				if (newContents !== contents) {
					file.contents = Buffer.from(newContents);
				}

				stream.push(file);
			});

			callback();
		}
	});
};
