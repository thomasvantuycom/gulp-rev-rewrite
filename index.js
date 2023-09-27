import path from 'node:path';
import {Buffer} from 'node:buffer';
import {Transform} from 'node:stream';
import PluginError from 'plugin-error';
import replace from './lib/replace.js';

function relativePath(from, to) {
	return path.relative(from, to).replaceAll('\\', '/');
}

export default function plugin(options = {}) {
	const renames = [];
	const cache = [];

	return new Transform({
		objectMode: true,
		transform(file, encoding, callback) {
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
					reved: relativePath(file.base, file.path),
				});
			}

			cache.push(file);

			callback();
		}, flush(callback) {
			if (options.manifest) {
				const manifest = JSON.parse(options.manifest.toString());

				for (const [unreved, reved] of Object.entries(manifest)) {
					renames.push({unreved, reved});
				}
			}

			// Once we have a full list of renames, search/replace in the cached
			// files and push them through.
			for (const file of cache) {
				const contents = file.contents.toString();
				const newContents = replace(contents, renames);

				if (newContents !== contents) {
					file.contents = Buffer.from(newContents);
				}

				this.push(file);
			}

			callback();
		}});
}
