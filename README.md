# gulp-rev-rewrite [![Build Status](https://travis-ci.org/TheDancingCode/gulp-rev-rewrite.svg?branch=master)](https://travis-ci.org/TheDancingCode/gulp-rev-rewrite) [![npm](https://img.shields.io/npm/v/gulp-rev-rewrite.svg)](https://www.npmjs.com/package/gulp-rev-rewrite) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release) [![Greenkeeper badge](https://badges.greenkeeper.io/TheDancingCode/gulp-rev-rewrite.svg)](https://greenkeeper.io/)

> Rewrite occurrences of filenames which have been renamed by gulp-rev

**This plugin is an improved and maintained fork of [gulp-rev-replace](https://github.com/jamesknelson/gulp-rev-replace).**

## Install

```
npm install gulp-rev-rewrite --save-dev
```

Only [LTS and current releases](https://github.com/nodejs/Release#release-schedule) of Node are supported.

## Usage

Pipe through a stream with both the revved files and the files containing references to them.

```js
const gulp = require('gulp');
const filter = require('gulp-filter');
const rev = require('gulp-rev');
const revRewrite = require('gulp-rev-rewrite');

gulp.task('rev', () => {
  const assetFilter = filter(['**/*', '!**/index.html'], { restore: true });

  return gulp.src('src/**')
    .pipe(assetFilter)
    .pipe(rev()) // Rename all files except index.html
    .pipe(assetFilter.restore)
    .pipe(revRewrite()) // Substitute in new filenames
    .pipe(gulp.dest('dist'));
});
```

It is also possible to collect the revisioned filenames from JSON manifests written out by `gulp-rev`. This allows for replacing filenames that were revved prior to the current task.

```js
const rev = require('gulp-rev');
const revRewrite = require('gulp-rev-rewrite');
const revDelete = require('gulp-rev-delete-original');

gulp.task('revision', ['dist:css', 'dist:js'], () => {
  return gulp.src('dist/**/*.{css,js}')
    .pipe(rev())
    .pipe(revDelete()) // Remove the unrevved files
    .pipe(gulp.dest('dist'))
    .pipe(rev.manifest())
    .pipe(gulp.dest('dist'));
});

gulp.task('revRewrite', ['revision'], function() {
  const manifest = gulp.src('dist/rev-manifest.json');

  return gulp.src('dist/index.html')
    .pipe(revRewrite({ manifest }))
    .pipe(gulp.dest('dist'));
});
```

## API

### revRewrite([options])

#### options

Type: `Object`

##### canonicalUris

Type: `Boolean`<br>
Default: `true`

Use canonical URIs when replacing filePaths, i.e. use a forward slash (`/`) as the path segment seperator.

##### replaceInExtensions

Type: `Array`<br>
Default: `['.js', '.css', '.html', '.hbs']`

Only substitute in new filenames in files of these types.

##### prefix

Type: `String`

Add a prefix to each replacement.

##### manifest

Type: `Stream` (e.g., `gulp.src()`)

Read JSON manifests written out by `rev`. Allows replacing filenames that were
revved prior to the current task.

##### modifyUnreved, modifyReved

Type: `Function`

Modify the name of the unreved/reved files before using them. The function receives the unreved/reved filename as the first argument, and the [Vinyl](https://github.com/gulpjs/vinyl#instance-properties) object of the current file as the optional second argument.

For example, if in your manifest you have:

```js
{"js/app.js.map": "js/app-98adc164.js.map"}
```

If you wanted to get rid of the `js/` path just for `.map` files (because they
are sourcemaps and the references to them are relative, not absolute) you could
do the following:

```js
function replaceJsIfMap(filename) {
  if (filename.includes('.map')) {
    return filename.replace('js/', '');
  }
  return filename;
}

return gulp.src('dist/**/*.js')
  .pipe(revRewrite({
      manifest: manifest,
      modifyUnreved: replaceJsIfMap,
      modifyReved: replaceJsIfMap
    }))
  .pipe(gulp.dest('dist'));
```

## License

MIT © [James K Nelson](http://jamesknelson.com), [Thomas Vantuycom](https://github.com/TheDancingCode)
