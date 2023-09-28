import test from 'ava';
import {pEvent, pEventIterator} from 'p-event';
import revRewrite from '../index.js';
import {createFile, createManifest} from './_helper.js';

test('collects and rewrites revisioned paths from the stream', async t => {
	const stream = revRewrite();
	const data = pEventIterator(stream, 'data', {
		resolutionEvents: ['finish'],
	});

	stream.write(createFile({
		path: 'index.html',
		contents: '<link rel="stylesheet" href="/css/style.css">',
	}));
	stream.end(createFile({
		path: 'css/style-f2b804d3e3.css',
		contents: 'body { color: red; }',
		revOrigPath: 'css/style.css',
	}));

	for await (const file of data) {
		if (file.extname === '.html') {
			t.is(file.contents.toString(), '<link rel="stylesheet" href="/css/style-f2b804d3e3.css">');
		}
	}
});

test('collects and rewrites revisioned paths from a manifest', async t => {
	const stream = revRewrite({manifest: createManifest()});
	const data = pEvent(stream, 'data');

	stream.end(createFile({
		path: 'index.html',
		contents: '<link rel="stylesheet" href="/css/style.css">',
	}));

	const file = await data;
	t.is(file.contents.toString(), '<link rel="stylesheet" href="/css/style-f2b804d3e3.css">');
});

test('works with Windows-style paths', async t => {
	const stream = revRewrite();
	const data = pEventIterator(stream, 'data', {
		resolutionEvents: ['finish'],
	});

	stream.write(createFile({
		path: 'index.html',
		contents: '<link rel="stylesheet" href="/css/style.css">',
	}));
	stream.end(createFile({
		path: 'css\\style-f2b804d3e3.css',
		contents: 'body { color: red; }',
		revOrigPath: 'css/style.css',
	}));

	for await (const file of data) {
		if (file.extname === '.html') {
			t.is(file.contents.toString(), '<link rel="stylesheet" href="/css/style-f2b804d3e3.css">');
		}
	}
});

test('does not corrupt binary files', async t => {
	const stream = revRewrite({manifest: createManifest()});
	const data = pEvent(stream, 'data');

	const contents = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

	stream.end(createFile({
		path: 'image.png',
		contents,
		encoding: 'base64',
	}));

	const file = await data;
	t.is(file.contents.toString('base64'), contents);
});
