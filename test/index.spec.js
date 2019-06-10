import test from 'ava';
import Vinyl from 'vinyl';
import pEvent from 'p-event';
import rev from 'gulp-rev';
import intoStream from 'into-stream';
import revRewrite from '..';

const htmlFileBody =
  '<link rel="stylesheet" href="/css/style.css"><img src="image.png">';
const cssFileBody = 'body { background: url("image.png"); }';

const createFile = (path, contents) =>
	new Vinyl({
		path,
		contents: Buffer.from(contents)
	});

const createManifest = () => {
	return intoStream.object(
		createFile(
			'rev-manifest.json',
			JSON.stringify({
				'image.png': 'image-d41d8cd98f.png',
				'css/style.css': 'css/style-81a53f7d04.css'
			})
		)
	);
};

test('identifies and replaces reved filenames in the stream', async t => {
	t.plan(1);

	const revStream = rev();
	const revRewriteStream = revRewrite();
	const data = pEvent.multiple(revRewriteStream, 'data', {count: 2});

	revStream.pipe(revRewriteStream);

	revStream.write(createFile('index.html', htmlFileBody));
	revStream.end(createFile('style.css', cssFileBody));

	const files = await data;
	files.forEach(file => {
		const contents = file.contents.toString();
		if (file.extname === '.html') {
			t.true(/css\/style-[a-z0-9]{10}\.css/.test(contents));
		}
	});
});

test('works with Windows-style paths', async t => {
	t.plan(1);

	const revStream = rev();
	const revRewriteStream = revRewrite();
	const data = pEvent.multiple(revRewriteStream, 'data', {count: 2});

	revStream.pipe(revRewriteStream);

	revStream.write(createFile('css\\style.css', cssFileBody));
	revStream.end(createFile('index.html', htmlFileBody));

	const files = await data;
	files.forEach(file => {
		const contents = file.contents.toString();
		if (file.extname === '.html') {
			t.true(contents.includes('css/style-81a53f7d04.css'));
		}
	});
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
	t.plan(3);

	const modifyUnreved = (unreved, file) => file.extname === '.html' ? `/${unreved}` : `${unreved}`;

	const stream = revRewrite({
		modifyUnreved,
		manifest: createManifest()
	});
	const data = pEvent.multiple(stream, 'data', {count: 2});

	stream.write(createFile('style.css', cssFileBody));
	stream.end(createFile('index.html', htmlFileBody));

	const files = await data;
	files.forEach(file => {
		const contents = file.contents.toString();
		if (file.extname === '.html') {
			t.true(contents.includes('css/style-81a53f7d04.css'));
			t.false(contents.includes('image-d41d8cd98f.png'));
		} else {
			t.true(contents.includes('image-d41d8cd98f.png'));
		}
	});
});

test('allows modifying reved filenames', async t => {
	t.plan(3);

	const modifyReved = (reved, file) => file.extname === '.html' ? `assets/${reved}` : `../${reved}`;

	const stream = revRewrite({
		modifyReved,
		manifest: createManifest()
	});
	const data = pEvent.multiple(stream, 'data', {count: 2});

	stream.write(createFile('style.css', cssFileBody));
	stream.end(createFile('index.html', htmlFileBody));

	const files = await data;
	files.forEach(file => {
		const contents = file.contents.toString();
		if (file.extname === '.html') {
			t.true(contents.includes('assets/css/style-81a53f7d04.css'));
			t.true(contents.includes('assets/image-d41d8cd98f.png'));
		} else {
			t.true(contents.includes('../image-d41d8cd98f.png'));
		}
	});
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
