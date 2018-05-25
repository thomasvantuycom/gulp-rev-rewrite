import test from 'ava';
import replace from '../lib/replace';

const renames = [
	{
		unreved: 'images/icon.svg',
		reved: 'images/icon-d41d8cd98f.svg'
	},
	{
		unreved: 'style.css.map',
		reved: 'style-98adc164tm.css.map'
	}
];

test('single quotes', t => {
	const input = 'body { background: url(\'images/icon.svg\'); }';
	const expected = 'body { background: url(\'images/icon-d41d8cd98f.svg\'); }';
	const output = replace(input, renames);

	t.is(output, expected);
});

test('double quotes', t => {
	const input = 'body { background: url("images/icon.svg"); }';
	const expected = 'body { background: url("images/icon-d41d8cd98f.svg"); }';
	const output = replace(input, renames);

	t.is(output, expected);
});

test('brackets', t => {
	const input = 'body { background: url(images/icon.svg); }';
	const expected = 'body { background: url(images/icon-d41d8cd98f.svg); }';
	const output = replace(input, renames);

	t.is(output, expected);
});

test('spaces', t => {
	const input = 'body { background: url( images/icon.svg ); }';
	const expected = 'body { background: url( images/icon-d41d8cd98f.svg ); }';
	const output = replace(input, renames);

	t.is(output, expected);
});

test('slashes', t => {
	const input = 'body { background: url("path/images/icon.svg"); }';
	const expected =
    'body { background: url("path/images/icon-d41d8cd98f.svg"); }';
	const output = replace(input, renames);

	t.is(output, expected);
});

test('backslashes', t => {
	const input =
    'document.querySelector("*[style*=\'background-image: url(\\"images/icon.svg\\")\']");';
	const expected =
    'document.querySelector("*[style*=\'background-image: url(\\"images/icon-d41d8cd98f.svg\\")\']");';
	const output = replace(input, renames);

	t.is(output, expected);
});

test('query strings', t => {
	const input = 'body { background: url("images/icon.svg?query=string"); }';
	const expected =
    'body { background: url("images/icon-d41d8cd98f.svg?query=string"); }';
	const output = replace(input, renames);

	t.is(output, expected);
});

test('fragment identifiers', t => {
	const input = 'body { background: url("images/icon.svg#fragment"); }';
	const expected =
    'body { background: url("images/icon-d41d8cd98f.svg#fragment"); }';
	const output = replace(input, renames);

	t.is(output, expected);
});

test('relative paths', t => {
	const input = 'body { background: url("../images/icon.svg#fragment"); }';
	const expected =
    'body { background: url("../images/icon-d41d8cd98f.svg#fragment"); }';
	const output = replace(input, renames, 'css/test.css');

	t.is(output, expected);
});

test('equality signs', t => {
	const input = '/*# sourceMappingURL=style.css.map */';
	const expected = '/*# sourceMappingURL=style-98adc164tm.css.map */';
	const output = replace(input, renames);

	t.is(output, expected);
});

test('file beginning and end', t => {
	const input = 'images/icon.svg';
	const expected = 'images/icon-d41d8cd98f.svg';
	const output = replace(input, renames);

	t.is(output, expected);
});

test('commas', t => {
	const input = '<img srcset="images/icon.svg, images/icon-HD.svg 2x"><img srcset="images/icon-HD.svg 2x ,images/icon.svg">';
	const expected = '<img srcset="images/icon-d41d8cd98f.svg, images/icon-HD.svg 2x"><img srcset="images/icon-HD.svg 2x ,images/icon-d41d8cd98f.svg">';
	const output = replace(input, renames);

	t.is(output, expected);
});
