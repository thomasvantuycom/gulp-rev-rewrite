import {Buffer} from 'node:buffer';
import Vinyl from 'vinyl';

export function createFile({
	path,
	contents = '',
	encoding = 'utf8',
	revOrigPath,
}) {
	const file = new Vinyl({
		path,
		contents: Buffer.from(contents, encoding),
	});

	if (revOrigPath) {
		file.revOrigPath = revOrigPath;
		file.revOrigBase = file.base;
	}

	return file;
}

export function createManifest() {
	const manifest = {
		'css/style.css': 'css/style-f2b804d3e3.css',
	};
	return Buffer.from(JSON.stringify(manifest, null, 4));
}
