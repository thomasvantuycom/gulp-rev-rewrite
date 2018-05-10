'use strict';

const assert = require('assert');
const replace = require('../lib/replace');

const renames = [
  {
    unreved: 'images/icon.svg',
    reved: 'images/icon-d41d8cd98f.svg'
  },
  {
    unreved: 'style.css.map',
    reved: 'style-98adc164tm.css.map'
  },
];

describe('should work with different delimiters', () => {
  it('single quotes', () => {
    const input = "body { background: url('images/icon.svg'); }";
    const expected = "body { background: url('images/icon-d41d8cd98f.svg'); }";
    const output = replace(input, renames);

    assert.equal(output, expected);
  });

  it('double quotes', () => {
    const input = 'body { background: url("images/icon.svg"); }';
    const expected = 'body { background: url("images/icon-d41d8cd98f.svg"); }';
    const output = replace(input, renames);

    assert.equal(output, expected);
  });

  it('brackets', () => {
    const input = 'body { background: url(images/icon.svg); }';
    const expected = 'body { background: url(images/icon-d41d8cd98f.svg); }';
    const output = replace(input, renames);

    assert.equal(output, expected);
  });

  it('spaces', () => {
    const input = 'body { background: url( images/icon.svg ); }';
    const expected = 'body { background: url( images/icon-d41d8cd98f.svg ); }';
    const output = replace(input, renames);

    assert.equal(output, expected);
  });

  it('slashes', () => {
    const input = 'body { background: url("path/images/icon.svg"); }';
    const expected = 'body { background: url("path/images/icon-d41d8cd98f.svg"); }';
    const output = replace(input, renames);

    assert.equal(output, expected);
  });

  it('backslashes', () => {
    const input = 'document.querySelector("*[style*=\'background-image: url(\\"images/icon.svg\\")\']");';
    const expected = 'document.querySelector("*[style*=\'background-image: url(\\"images/icon-d41d8cd98f.svg\\")\']");';
    const output = replace(input, renames);

    assert.equal(output, expected);
  });

  it('query strings', () => {
    const input = 'body { background: url("images/icon.svg?query=string"); }';
    const expected = 'body { background: url("images/icon-d41d8cd98f.svg?query=string"); }';
    const output = replace(input, renames);

    assert.equal(output, expected);
  });

  it('fragment identifiers', () => {
    const input = 'body { background: url("images/icon.svg#fragment"); }';
    const expected = 'body { background: url("images/icon-d41d8cd98f.svg#fragment"); }';
    const output = replace(input, renames);

    assert.equal(output, expected);
  });

  it('equality signs', () => {
    const input = '/*# sourceMappingURL=style.css.map */';
    const expected = '/*# sourceMappingURL=style-98adc164tm.css.map */';
    const output = replace(input, renames);

    assert.equal(output, expected);
  });

  it('file beginning and end', () => {
    const input = 'images/icon.svg';
    const expected = 'images/icon-d41d8cd98f.svg';
    const output = replace(input, renames);

    assert.equal(output, expected);
  });
});
