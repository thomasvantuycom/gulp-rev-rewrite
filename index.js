import path from 'node:path';
import {Buffer} from 'node:buffer';
import {Transform} from 'node:stream';
import PluginError from 'plugin-error';
import replace from './lib/replace.js';

function relativePath(from, to) {
	return path.relative(from, to).replaceAll('\\', '/');
}

export default function plugin({manifest} = {}) {
	return new Transform({
		objectMode: true,

		construct(callback) {
			this.revisions = {};
			this.files = [];

			callback();
		},

		transform(file, _, callback) {
			if (file.isNull()) {
				callback(null, file);

				return;
			}

			if (file.isStream()) {
				callback(new PluginError('gulp-rev-rewrite', 'Streaming not supported'));

				return;
			}

			// Collect original and revisioned paths directly from the vinyl files in the stream
			if (file.revOrigPath) {
				const originalPath = relativePath(file.revOrigBase, file.revOrigPath);
				const revisionedPath = relativePath(file.base, file.path);

				this.revisions[originalPath] = revisionedPath;
			}

			this.files.push(file);

			callback();
		},

		flush(callback) {
			// Collect original and revisioned paths from a manifest
			if (manifest) {
				Object.assign(this.revisions, JSON.parse(manifest.toString()));
			}

			// Rewrite paths
			for (const file of this.files) {
				const contents = file.contents.toString();
				const newContents = replace(contents, this.revisions);

				// Update contents only if they changed
				if (newContents !== contents) {
					file.contents = Buffer.from(newContents);
				}

				this.push(file);
			}

			callback();
		},
	});
}
