import test from 'ava';
import replace from '../lib/replace.js';

const macro = test.macro((t, input, expected) => {
	const manifest = {'image.jpg': 'image-d41d8cd98f.jpg'};
	const output = replace(input, manifest);

	t.is(output, expected);
});

// E.g. <img src='image.jpg'> or url('image.jpg')
test('surrounded by single quotes', macro, '\'image.jpg\'', '\'image-d41d8cd98f.jpg\'');

// E.g. <img src="image.jpg"> or url("image.jpg")
test('surrounded by double quotes', macro, '"image.jpg"', '"image-d41d8cd98f.jpg"');

// E.g. <img src=" image.jpg "> or url(" image.jpg ")
test('surrounded by spaces', macro, ' image.jpg ', ' image-d41d8cd98f.jpg ');

// E.g. url(image.jpg)
test('surrounded by brackets', macro, '(image.jpg)', '(image-d41d8cd98f.jpg)');

// E.g. <img src=image.jpg> or [src=image.jpg]
test('preceded by an equality sign', macro, '=image.jpg', '=image-d41d8cd98f.jpg');

// E.g. <img src="/image.jpg"> or url("/image.jpg")
test('preceded by a forward slash', macro, '/image.jpg', '/image-d41d8cd98f.jpg');

// E.g. <img srcset="image-640w.jpg ,image.jpg 2x">
test('preceded by a comma', macro, ',image.jpg', ',image-d41d8cd98f.jpg');

// E.g. <img src=image.jpg>
test('followed by a closing angle bracket', macro, 'image.jpg>', 'image-d41d8cd98f.jpg>');

// E.g. <img src=image.jpg/>
test('followed by a forward slash', macro, 'image.jpg/', 'image-d41d8cd98f.jpg/');

// E.g. <div style="background-image: url(\"image.jpg\")">
test('followed by a backslash', macro, 'image.jpg\\', 'image-d41d8cd98f.jpg\\');

// E.g. <img src="image.jpg?query=string"> or url("image.jpg?query=string")
test('followed by a question mark', macro, 'image.jpg?', 'image-d41d8cd98f.jpg?');

// E.g. <img src="image.jpg#fragment"> or url("image.jpg#fragment")
test('followed by a hash', macro, 'image.jpg#', 'image-d41d8cd98f.jpg#');

// E.g. <img src="https://cdn.com?asset=image.jpg&w=500">
test('followed by an ampersand', macro, 'image.jpg&', 'image-d41d8cd98f.jpg&');

// E.g. <img srcset="image.jpg, image-1280w.jpg 2x">
test('followed by a comma', macro, 'image.jpg,', 'image-d41d8cd98f.jpg,');

test('at the beginning of a string', macro, 'image.jpg', 'image-d41d8cd98f.jpg');

test('at the end of a string', macro, 'image.jpg', 'image-d41d8cd98f.jpg');

test('multiple occurrences', macro, 'image.jpg image.jpg', 'image-d41d8cd98f.jpg image-d41d8cd98f.jpg');

for (const input of [
	'notimage.jpg',
	'not-image.jpg',
	'not_image.jpg',
	'image.jpgnot',
	'image.jpg.not',
]) {
	test(`ignore false positive: ${input}`, macro, input, input);
}
