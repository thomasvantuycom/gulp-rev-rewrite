import test from 'node:test';
import assert from 'node:assert/strict';
import revRewrite from '../index.js';
import {createFile, createManifest} from './_helper.js';

test('collects and rewrites revisioned paths from the stream', async () => {
	const stream = revRewrite();

	stream.write(createFile({
		path: 'index.html',
		contents: '<link rel="stylesheet" href="/css/style.css">',
	}));

	stream.end(createFile({
		path: 'css/style-f2b804d3e3.css',
		contents: 'body { color: red; }',
		revOrigPath: 'css/style.css',
	}));

	const files = await stream.toArray();
	const htmlFile = files.find(file => file.extname === '.html');

	assert.equal(htmlFile.contents.toString(), '<link rel="stylesheet" href="/css/style-f2b804d3e3.css">');
});

test('collects and rewrites revisioned paths from a manifest', async () => {
	const stream = revRewrite({manifest: createManifest()});

	stream.end(createFile({
		path: 'index.html',
		contents: '<link rel="stylesheet" href="/css/style.css">',
	}));

	const [file] = await stream.toArray();
	assert.equal(file.contents.toString(), '<link rel="stylesheet" href="/css/style-f2b804d3e3.css">');
});

test('works with Windows-style paths', async () => {
	const stream = revRewrite();

	stream.write(createFile({
		path: 'index.html',
		contents: '<link rel="stylesheet" href="/css/style.css">',
	}));

	stream.end(createFile({
		path: String.raw`css\style-f2b804d3e3.css`,
		contents: 'body { color: red; }',
		revOrigPath: 'css/style.css',
	}));

	const files = await stream.toArray();
	const htmlFile = files.find(file => file.extname === '.html');

	assert.equal(htmlFile.contents.toString(), '<link rel="stylesheet" href="/css/style-f2b804d3e3.css">');
});

test('does not corrupt binary files', async () => {
	const stream = revRewrite({manifest: createManifest()});

	const contents = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

	stream.end(createFile({
		path: 'image.png',
		contents,
		encoding: 'base64',
	}));

	const [file] = await stream.toArray();

	assert.equal(file.contents.toString('base64'), contents);
});
