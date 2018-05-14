import test from 'ava';
import Vinyl from 'vinyl';
import pEvent from 'p-event';
import rev from 'gulp-rev';
import {readArray} from 'event-stream';
import revRewrite from '..';

const htmlFileBody =
  '<link rel="stylesheet" href="/css/style.css"><img src="image.png">';
const cssFileBody = 'body { background: url("image.png"); }';
const jsFileBody = 'var path = \'image.png\';';
const hbsFileBody = '<img src="image.png" alt="{{image.alt}}">';
const jsonFileBody = JSON.stringify({path: 'image.png'});

const createFile = (path, contents) =>
	new Vinyl({
		path,
		contents: Buffer.from(contents)
	});

const createManifest = () => {
	return readArray([
		createFile(
			'rev-manifest.json',
			JSON.stringify({
				'image.png': 'image-d41d8cd98f.png',
				'css\\style.css': 'css\\style-81a53f7d04.css'
			})
		)
	]);
};

test('identifies and replaces reved filenames in the stream', async t => {
	t.plan(1);

	const revStream = rev();
	const revRewriteStream = revRewrite();
	const data = pEvent(revRewriteStream, 'data');

	revStream.pipe(revRewriteStream);

	revStream.write(createFile('index.html', htmlFileBody));
	revStream.end(createFile('style.css', cssFileBody));

	const file = await data;
	const contents = file.contents.toString();
	t.true(/css\/style-[a-z0-9]{10}\.css/.test(contents));
});

test('reads and replaces reved filenames from a manifest', async t => {
	t.plan(1);

	const stream = revRewrite({manifest: createManifest()});
	const data = pEvent(stream, 'data');

	stream.end(createFile('index.html', htmlFileBody));

	const file = await data;
	const contents = file.contents.toString();
	t.true(contents.includes('image-d41d8cd98f.png'));
});

test.cb('by default replaces in .css, .html, .js and .hbs files', t => {
	t.plan(5);

	const stream = revRewrite({manifest: createManifest()});

	stream.on('data', file => {
		const contents = file.contents.toString();
		if (file.extname === '.json') {
			t.false(contents.includes('image-d41d8cd98f.png'));
		} else {
			t.true(contents.includes('image-d41d8cd98f.png'));
		}
	});

	stream.on('end', t.end);

	stream.write(createFile('index.html', htmlFileBody));
	stream.write(createFile('style.css', cssFileBody));
	stream.write(createFile('script.js', jsFileBody));
	stream.write(createFile('partial.hbs', hbsFileBody));
	stream.end(createFile('data.json', jsonFileBody));
});

test.cb('allows overriding extensions to be searched', t => {
	t.plan(5);

	const replaceInExtensions = ['.json'];
	const stream = revRewrite({
		replaceInExtensions,
		manifest: createManifest()
	});

	stream.on('data', file => {
		const contents = file.contents.toString();
		if (file.extname === '.json') {
			t.true(contents.includes('image-d41d8cd98f.png'));
		} else {
			t.false(contents.includes('image-d41d8cd98f.png'));
		}
	});

	stream.on('end', t.end);

	stream.write(createFile('index.html', htmlFileBody));
	stream.write(createFile('style.css', cssFileBody));
	stream.write(createFile('script.js', jsFileBody));
	stream.write(createFile('partial.hbs', hbsFileBody));
	stream.end(createFile('data.json', jsonFileBody));
});

test('by default canonicalizes URIs', async t => {
	t.plan(1);

	const stream = revRewrite({manifest: createManifest()});
	const data = pEvent(stream, 'data');

	stream.end(createFile('index.html', htmlFileBody));

	const file = await data;
	const contents = file.contents.toString();
	t.true(contents.includes('css/style-81a53f7d04.css'));
});

test('allows overriding URI canonicalization', async t => {
	t.plan(1);

	const stream = revRewrite({
		canonicalUris: false,
		manifest: createManifest()
	});
	const data = pEvent(stream, 'data');

	stream.end(createFile('index.html', htmlFileBody));

	const file = await data;
	const contents = file.contents.toString();
	t.false(contents.includes('css/style-81a53f7d04.css'));
});

test('allows prefixing reved filenames', async t => {
	t.plan(2);

	const stream = revRewrite({
		prefix: 'https://www.example.com/',
		manifest: createManifest()
	});
	const data = pEvent(stream, 'data');

	stream.end(createFile('index.html', htmlFileBody));

	const file = await data;
	const contents = file.contents.toString();
	t.true(contents.includes('https://www.example.com/css/style-81a53f7d04.css'));
	t.true(contents.includes('https://www.example.com/image-d41d8cd98f.png'));
});

test('allows modifying unreved filenames', async t => {
	t.plan(2);

	const modifyUnreved = filename => `/${filename}`;

	const stream = revRewrite({
		modifyUnreved,
		manifest: createManifest()
	});
	const data = pEvent(stream, 'data');

	stream.end(createFile('index.html', htmlFileBody));

	const file = await data;
	const contents = file.contents.toString();
	t.true(contents.includes('css/style-81a53f7d04.css'));
	t.false(contents.includes('image-d41d8cd98f.png'));
});

test('allows modifying reved filenames', async t => {
	t.plan(2);

	const modifyReved = filename => `folder/${filename}`;

	const stream = revRewrite({
		modifyReved,
		manifest: createManifest()
	});
	const data = pEvent(stream, 'data');

	stream.end(createFile('index.html', htmlFileBody));

	const file = await data;
	const contents = file.contents.toString();
	t.true(contents.includes('folder/css/style-81a53f7d04.css'));
	t.true(contents.includes('folder/image-d41d8cd98f.png'));
});

test('does not replace false positives', async t => {
	t.plan(1);

	const stream = revRewrite({
		manifest: createManifest()
	});
	const data = pEvent(stream, 'data');

	const falsePositives = [
		'<img src="not-image.png">',
		'<img src="not_image.png">',
		'<img src="notimage.png">',
		'<img src="image.png.not">',
		'<img src="image.pngnot">'
	];
	stream.end(createFile('index.html', falsePositives.join('')));

	const file = await data;
	const contents = file.contents.toString();
	t.false(contents.includes('image-d41d8cd98f.png'));
});
