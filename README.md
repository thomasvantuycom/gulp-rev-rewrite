# gulp-rev-rewrite [![Build Status](https://travis-ci.org/TheDancingCode/gulp-rev-rewrite.svg?branch=master)](https://travis-ci.org/TheDancingCode/gulp-rev-rewrite) [![npm](https://img.shields.io/npm/v/gulp-rev-rewrite.svg)](https://www.npmjs.com/package/gulp-rev-rewrite) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

> Rewrite references to assets revisioned by `gulp-rev`

**This plugin is an improved and maintained fork of [gulp-rev-replace](https://github.com/jamesknelson/gulp-rev-replace).**

## Install

```
npm install gulp-rev-rewrite --save-dev
```

Only [LTS and current releases](https://github.com/nodejs/Release#release-schedule) of Node are supported.

## Usage

```js
const { src, dest } = require('gulp');
const rev = require('gulp-rev');
const revRewrite = require('gulp-rev-rewrite');

function revision() {
  return src('dist/**/*.{css,js}')
    .pipe(rev())
    .pipe(src('dist/**/*.html'))
    .pipe(revRewrite())
    .pipe(dest('dist'));
}

exports.default = revision;
```

Alternatively:

1. Revision your assets and create an asset manifest.
2. Collect the revisioned paths from the manifest and rewrite references to them

```js
const { readFileSync } = require('fs');
const { src, dest, series } = require('gulp');
const rev = require('gulp-rev');
const revRewrite = require('gulp-rev-rewrite');

// Step 1
function revision() {
  return src('dist/assets/**/*.{css,js}')
    .pipe(rev())
    .pipe(dest('dist/assets'))
    .pipe(rev.manifest())
    .pipe(dest('dist/assets'));
}

// Step 2
function rewrite() {
  const manifest = readFileSync('dist/assets/rev-manifest.json');

  return src('dist/**/*.html')
    .pipe(revRewrite({ manifest }))
    .pipe(dest('dist'));
}

exports.default = series(revision, rewrite);
```

## API

### revRewrite([options])

#### options

Type: `Object`

##### manifest

Type: `Buffer` (e.g., `fs.readFileSync()`)

Read JSON manifests written out by `rev`. Allows replacing filenames that were revisioned prior to the current task.

##### prefix

Type: `String`

Add a prefix to each replacement.

##### modifyUnreved, modifyReved

Type: `Function`

Modify the name of the unreved/reved files before using them. The function receives the unreved/reved filename as the first argument, and the [Vinyl](https://github.com/gulpjs/vinyl#instance-properties) object of the current file as the optional second argument.

## License

MIT © [James K Nelson](http://jamesknelson.com), [Thomas Vantuycom](https://github.com/TheDancingCode)
