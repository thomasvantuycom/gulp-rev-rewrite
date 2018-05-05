gulp-rev-rewrite [![Build Status](https://travis-ci.org/TheDancingCode/gulp-rev-rewrite.svg?branch=master)](https://travis-ci.org/TheDancingCode/gulp-rev-rewrite)
================

Rewrite occurrences of filenames which have been renamed by gulp-rev

## Install

```
npm install gulp-rev-rewrite --save-dev
```


## Usage

Pipe through a stream which has both the files you want to be updated, as well as the files which have been renamed.

For example, we can use [gulp-useref](https://github.com/jonkemp/gulp-useref) to concatenate assets in an index.html,
and then use [gulp-rev](https://github.com/sindresorhus/gulp-rev) and gulp-rev-rewrite to cache-bust them.

```js
var gulp = require('gulp');
var rev = require('gulp-rev');
var revRewrite = require('gulp-rev-rewrite');
var useref = require('gulp-useref');
var filter = require('gulp-filter');
var uglify = require('gulp-uglify');
var csso = require('gulp-csso');

gulp.task("index", function() {
  var jsFilter = filter("**/*.js", { restore: true });
  var cssFilter = filter("**/*.css", { restore: true });
  var indexHtmlFilter = filter(['**/*', '!**/index.html'], { restore: true });

  return gulp.src("src/index.html")
    .pipe(useref())      // Concatenate with gulp-useref
    .pipe(jsFilter)
    .pipe(uglify())             // Minify any javascript sources
    .pipe(jsFilter.restore)
    .pipe(cssFilter)
    .pipe(csso())               // Minify any CSS sources
    .pipe(cssFilter.restore)
    .pipe(indexHtmlFilter)
    .pipe(rev())                // Rename the concatenated files (but not index.html)
    .pipe(indexHtmlFilter.restore)
    .pipe(revRewrite())         // Substitute in new filenames
    .pipe(gulp.dest('public'));
});
```

It is also possible to use gulp-rev-rewrite without gulp-useref:

```js
var rev = require("gulp-rev");
var revRewrite = require("gulp-rev-rewrite");
gulp.task("revision", ["dist:css", "dist:js"], function(){
  return gulp.src(["dist/**/*.css", "dist/**/*.js"])
    .pipe(rev())
    .pipe(gulp.dest(opt.distFolder))
    .pipe(rev.manifest())
    .pipe(gulp.dest(opt.distFolder))
})

gulp.task("revRewrite", ["revision"], function(){
  var manifest = gulp.src("./" + opt.distFolder + "/rev-manifest.json");

  return gulp.src(opt.srcFolder + "/index.html")
    .pipe(revRewrite({manifest: manifest}))
    .pipe(gulp.dest(opt.distFolder));
});
```


## API

### revRewrite(options)

#### options.canonicalUris
Type: `boolean`

Default: `true`

Use canonical Uris when replacing filePaths, i.e. when working with filepaths
with non forward slash (`/`) path separators we replace them with forward slash.

#### options.replaceInExtensions
Type: `Array`

Default: `['.js', '.css', '.html', '.hbs']`

Only substitute in new filenames in files of these types.

#### options.prefix
Type: `string`

Default: ``

Add the prefix string to each replacement.

#### options.manifest
Type: `Stream` (e.g., `gulp.src()`)

Read JSON manifests written out by `rev`. Allows replacing filenames that were
`rev`ed prior to the current task.

#### options.modifyUnreved, options.modifyReved
Type: `Function`

Modify the name of the unreved/reved files before using them. The filename is
passed to the function as the first argument.

For example, if in your manifest you have:

```js
{"js/app.js.map": "js/app-98adc164.js.map"}
```

If you wanted to get rid of the `js/` path just for `.map` files (because they
are sourcemaps and the references to them are relative, not absolute) you could
do the following:

```js
function replaceJsIfMap(filename) {
    if (filename.indexOf('.map') > -1) {
        return filename.replace('js/', '');
    }
    return filename;
}

return gulp.src(opt.distFolder + '**/*.js')
    .pipe(revRewrite({
        manifest: manifest,
        modifyUnreved: replaceJsIfMap,
        modifyReved: replaceJsIfMap
    }))
    .pipe(gulp.dest(opt.distFolder));
```

## Contributors

- Chad Jablonski
- Denis Parchenko
- Evgeniy Vasilev
- George Song
- Håkon K. Eide
- Juan Lasheras
- Majid Burney
- Simon Ihmig
- Vincent Voyer
- Bradley Abrahams


## License

[MIT](http://opensource.org/licenses/MIT) © [James K Nelson](http://jamesknelson.com), [Thomas Vantuycom](https://github.com/TheDancingCode)
