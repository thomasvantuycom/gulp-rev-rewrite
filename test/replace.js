import assert from 'node:assert/strict';
import test from 'node:test';
import replace from '../lib/replace.js';

const manifest = {'image.jpg': 'image-d41d8cd98f.jpg'};

const testCases = [
	// E.g. <img src='image.jpg'> or url('image.jpg')
	['surrounded by single quotes', '\'image.jpg\'', '\'image-d41d8cd98f.jpg\''],

	// E.g. <img src="image.jpg"> or url("image.jpg")
	['surrounded by double quotes', '"image.jpg"', '"image-d41d8cd98f.jpg"'],

	// E.g. <img src=" image.jpg "> or url(" image.jpg ")
	['surrounded by spaces', ' image.jpg ', ' image-d41d8cd98f.jpg '],

	// E.g. url(image.jpg)
	['surrounded by brackets', '(image.jpg)', '(image-d41d8cd98f.jpg)'],

	// E.g. <img src=image.jpg> or [src=image.jpg]
	['preceded by an equality sign', '=image.jpg', '=image-d41d8cd98f.jpg'],

	// E.g. <img src="/image.jpg"> or url("/image.jpg")
	['preceded by a forward slash', '/image.jpg', '/image-d41d8cd98f.jpg'],

	// E.g. <img srcset="image-640w.jpg ,image.jpg 2x">
	['preceded by a comma', ',image.jpg', ',image-d41d8cd98f.jpg'],

	// E.g. <img src=image.jpg>
	['followed by a closing angle bracket', 'image.jpg>', 'image-d41d8cd98f.jpg>'],

	// E.g. <img src=image.jpg/>
	['followed by a forward slash', 'image.jpg/', 'image-d41d8cd98f.jpg/'],

	// E.g. <div style="background-image: url(\"image.jpg\")">
	['followed by a backslash', 'image.jpg\\', 'image-d41d8cd98f.jpg\\'],

	// E.g. <img src="image.jpg?query=string"> or url("image.jpg?query=string")
	['followed by a question mark', 'image.jpg?', 'image-d41d8cd98f.jpg?'],

	// E.g. <img src="image.jpg#fragment"> or url("image.jpg#fragment")
	['followed by a hash', 'image.jpg#', 'image-d41d8cd98f.jpg#'],

	// E.g. <img src="https://cdn.com?asset=image.jpg&w=500">
	['followed by an ampersand', 'image.jpg&', 'image-d41d8cd98f.jpg&'],

	// E.g. <img srcset="image.jpg, image-1280w.jpg 2x">
	['followed by a comma', 'image.jpg,', 'image-d41d8cd98f.jpg,'],

	['at the beginning of a string', 'image.jpg', 'image-d41d8cd98f.jpg'],

	['at the end of a string', 'image.jpg', 'image-d41d8cd98f.jpg'],

	['multiple occurrences', 'image.jpg image.jpg', 'image-d41d8cd98f.jpg image-d41d8cd98f.jpg'],

	...[
		'notimage.jpg',
		'not-image.jpg',
		'not_image.jpg',
		'image.jpgnot',
		'image.jpg.not',
	].map(input => [`ignore false positive: ${input}`, input, input]),
];

for (const [name, input, expected] of testCases) {
	test(name, () => {
		assert.equal(replace(input, manifest), expected);
	});
}
