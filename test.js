/* global it describe */

'use strict';

const assert = require('assert');
const filter = require('gulp-filter');
const Vinyl = require('vinyl');
const path = require('path');
const rev = require('gulp-rev');
const es = require('event-stream');

const revRewrite = require('./index');
const utils = require('./utils');

const svgFileBody   = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg xmlns="http://www.w3.org/2000/svg"></svg>';
const cssFileBody   = '@font-face { font-family: \'test\'; src: url(\'/fonts/font.svg\'); }\nbody { color: red; }';
const jsFileBody   = 'console.log("Hello world"); //# sourceMappingURL=app.js.map';
const htmlFileBody  = '<html><head><link rel="stylesheet" href="/css/style.css" /></head><body><img src="images/image.png" /><img src="images/image.png" /></body></html>';

it('should by default replace filenames in .css and .html files', function (cb) {
  const filesToRevFilter = filter(['**/*.css', '**/*.svg', '**/*.png'], {restore: true});

  const stream = filesToRevFilter
    .pipe(rev())
    .pipe(filesToRevFilter.restore)
    .pipe(revRewrite());

  let fileCount = 0;
  const unreplacedCSSFilePattern = /style\.css/;
  const unreplacedSVGFilePattern = /font\.svg/;
  const unreplacedPNGFilePattern = /image\.png/;
  stream.on('data', function(file) {
    const contents = file.contents.toString();
    const extension = path.extname(file.path);

    if (extension === '.html') {
      assert(
        !unreplacedCSSFilePattern.test(contents),
        'The renamed CSS file\'s name should be replaced'
      );
      assert(
        !unreplacedPNGFilePattern.test(contents),
        'The renamed PNG file\'s name should be globally replaced'
      );
    } else if (extension === '.css') {
      assert(
        !unreplacedSVGFilePattern.test(contents),
        'The renamed SVG file\'s name should be replaced'
      );
    } else if (extension === '.svg') {
      assert(
        contents === svgFileBody,
        'The SVG file should not be modified'
      );
    }

    fileCount++;
  });
  stream.on('end', function() {
    assert.equal(fileCount, 4, 'Only four files should pass through the stream');
    cb();
  });

  filesToRevFilter.write(new Vinyl({
    path: path.join('css', 'style.css'),
    contents: Buffer.from(cssFileBody)
  }));
  filesToRevFilter.write(new Vinyl({
    path: path.join('fonts', 'font.svg'),
    contents: Buffer.from(svgFileBody)
  }));
  filesToRevFilter.write(new Vinyl({
    path: 'images/image.png',
    contents: Buffer.from('PNG')
  }));
  filesToRevFilter.write(new Vinyl({
    path: 'index.html',
    contents: Buffer.from(htmlFileBody)
  }));

  filesToRevFilter.end();
});

it('should not replace filenames in extensions not in replaceInExtensions', function (cb) {
  const filesToRevFilter = filter(['**/*.css'], {restore: true});

  const stream = filesToRevFilter
    .pipe(rev())
    .pipe(filesToRevFilter.restore)
    .pipe(revRewrite({replaceInExtensions: ['.svg']}));

  const unreplacedCSSFilePattern = /style\.css/;
  stream.on('data', function(file) {
    const contents = file.contents.toString();
    const extension = path.extname(file.path);

    if (extension === '.html') {
      assert(
        unreplacedCSSFilePattern.test(contents),
        'The renamed CSS file\'s name should not be replaced'
      );
    }
  });
  stream.on('end', function() {
    cb();
  });

  filesToRevFilter.write(new Vinyl({
    path: 'css\\style.css',
    contents: Buffer.from(cssFileBody)
  }));
  filesToRevFilter.write(new Vinyl({
    path: 'index.html',
    contents: Buffer.from(htmlFileBody)
  }));

  filesToRevFilter.end();
});

it('should not replace filenames contained in longer filenames', function(cb) {
  const css = '@font-face { src:url(\'font.woff2\'), url(\'font.woff\'), url(\'myfont.woff\'); }';

  const manifest = es.readArray([
    new Vinyl({
      path: 'rev-manifest.json',
      contents: Buffer.from(JSON.stringify({
        'font.woff': 'font.woff?v=f56bc5932b',
        'font.woff2': 'font.woff2?v=c6d1b13464',
        'myfont.woff': 'myfont.woff?v=d98ag4566d'
      }))
    })
  ]);

  const stream = revRewrite({ manifest: manifest });

  stream.on('data', function(file) {
    const content = file.contents.toString();

    assert.equal(content, "@font-face { src:url('font.woff2?v=c6d1b13464'), url('font.woff?v=f56bc5932b'), url('myfont.woff?v=d98ag4566d'); }");
  });

  stream.on('end', function() {
    cb();
  });

  stream.write(new Vinyl({
    path: 'index.css',
    contents: Buffer.from(css)
  }));

  stream.end();
});

it('should not canonicalize URIs when option is off', function (cb) {
  const filesToRevFilter = filter(['**/*.css'], {restore: true});

  const stream = filesToRevFilter
    .pipe(rev())
    .pipe(filesToRevFilter.restore)
    .pipe(revRewrite({canonicalUris: false}));

  const unreplacedCSSFilePattern = /style\.css/;
  stream.on('data', function(file) {
    const contents = file.contents.toString();
    const extension = path.extname(file.path);

    if (extension === '.html') {
      assert(
        unreplacedCSSFilePattern.test(contents),
        'The renamed CSS file\'s name should not be replaced'
      );
    }
  });
  stream.on('end', function() {
    cb();
  });

  filesToRevFilter.write(new Vinyl({
    path: 'css\\style.css',
    contents: Buffer.from(cssFileBody)
  }));
  filesToRevFilter.write(new Vinyl({
    path: 'index.html',
    contents: Buffer.from(htmlFileBody)
  }));

  filesToRevFilter.end();
});


it('should add prefix to path', function (cb) {
  const filesToRevFilter = filter(['**/*.css'], {restore: true});

  const stream = filesToRevFilter
    .pipe(rev())
    .pipe(filesToRevFilter.restore)
    .pipe(revRewrite({prefix: 'http://example.com'}));

  const replacedCSSFilePattern = /"http:\/\/example\.com\/css\/style-[^\.]+\.css"/;
  stream.on('data', function(file) {
    const contents = file.contents.toString();
    const extension = path.extname(file.path);
    if (extension === '.html') {
      assert(
        replacedCSSFilePattern.test(contents),
        'The prefix should be added in to the file url'
      );
    }
  });
  stream.on('end', function() {
    cb();
  });

  filesToRevFilter.write(new Vinyl({
    path: 'css/style.css',
    contents: Buffer.from(cssFileBody)
  }));
  filesToRevFilter.write(new Vinyl({
    path: 'index.html',
    contents: Buffer.from(htmlFileBody)
  }));

  filesToRevFilter.end();
});

it('should stop at first longest replace', function(cb) {
  const jsFileBody = 'const loadFile = "nopestyle.css"';
  const replacedJsFileBody = 'const loadFile = "nopestyle-19269897ba.css"';

  const filesToRevFilter = filter(['**/*.css'], {restore: true});

  const stream = filesToRevFilter
    .pipe(rev())
    .pipe(filesToRevFilter.restore)
    .pipe(revRewrite({canonicalUris: false}));

  stream.on('data', function(file) {
    if (file.path === 'script.js') {
      assert.equal(
        file.contents.toString(),
        replacedJsFileBody,
        'It should have replaced using the longest string match (nopestyle)'
      );
    }
  });
  stream.on('end', function() {
    cb();
  });

  filesToRevFilter.write(new Vinyl({
    path: 'style.css',
    contents: Buffer.from(cssFileBody)
  }));
  filesToRevFilter.write(new Vinyl({
    path: 'nopestyle.css',
    contents: Buffer.from('boooooo')
  }));
  filesToRevFilter.write(new Vinyl({
    path: 'script.js',
    contents: Buffer.from(jsFileBody)
  }));

  filesToRevFilter.end();
});

describe('manifest option', function () {
  it('should replace filenames from manifest files', function (cb) {
    const manifest = es.readArray([
      new Vinyl({
        path: '/project/rev-manifest.json',
        contents: Buffer.from(JSON.stringify({
          '/css/style.css': '/css/style-12345.css'
        }))
      }),
      new Vinyl({
        path: '/project/rev-image-manifest.json',
        contents: Buffer.from(JSON.stringify({
          'images/image.png': 'images/image-12345.png',
          '/fonts/font.svg': '/fonts/font-12345.svg'
        }))
      })
    ]);

    const stream = revRewrite({manifest: manifest});

    const replacedCSSFilePattern = /style-12345\.css/;
    const replacedSVGFilePattern = /font-12345\.svg/;
    const replacedPNGFilePattern = /image-12345\.png/;
    stream.on('data', function(file) {
      const contents = file.contents.toString();
      const extension = path.extname(file.path);

      if (extension === '.html') {
        assert(
          replacedCSSFilePattern.test(contents),
          'The renamed CSS file\'s name should be replaced'
        );
        assert(
          replacedPNGFilePattern.test(contents),
          'The renamed PNG file\'s name should be globally replaced'
        );
      } else if (extension === '.css') {
        assert(
          replacedSVGFilePattern.test(contents),
          'The renamed SVG file\'s name should be replaced'
        );
      } else if (extension === '.svg') {
        assert(
          contents === svgFileBody,
          'The SVG file should not be modified'
        );
      }
    });
    stream.on('end', function() {
      cb();
    });

    stream.write(new Vinyl({
      path: path.join('css', 'style.css'),
      contents: Buffer.from(cssFileBody)
    }));
    stream.write(new Vinyl({
      path: path.join('fonts', 'font.svg'),
      contents: Buffer.from(svgFileBody)
    }));
    stream.write(new Vinyl({
      path: 'index.html',
      contents: Buffer.from(htmlFileBody)
    }));

    stream.end();
  });

  it('should add prefix to path', function (cb) {
    const manifest = es.readArray([
      new Vinyl({
        path: '/project/rev-manifest.json',
        contents: Buffer.from(JSON.stringify({
          '/css/style.css': '/css/style-12345.css'
        }))
      })
    ]);

    const stream = revRewrite({prefix: 'http://example.com', manifest: manifest});

    const replacedCSSFilePattern = /"http:\/\/example\.com\/css\/style-12345\.css"/;
    stream.on('data', function(file) {
      const contents = file.contents.toString();
      const extension = path.extname(file.path);
      if (extension === '.html') {
        assert(
          replacedCSSFilePattern.test(contents),
          'The prefix should be added in to the file url'
        );
      }
    });
    stream.on('end', function() {
      cb();
    });

    stream.write(new Vinyl({
      path: 'index.html',
      contents: Buffer.from(htmlFileBody)
    }));

    stream.end();
  });
});

describe('utils.byLongestUnreved', function() {
  it('should arrange renames from longest to shortest', function() {
    const renames = [{
      unreved: 'data/favicon.ico',
      reved: 'data/favicon-15d0f308.ico'
    }, {
      unreved: 'fonts/FontAwesome.otf',
      reved: 'fonts/FontAwesome-0b462f5c.otf'
    }, {
      unreved: 'fonts/fontawesome-webfont.eot',
      reved: 'fonts/fontawesome-webfont-f7c2b4b7.eot'
    }, {
      unreved: 'fonts/fontawesome-webfont.svg',
      reved: 'fonts/fontawesome-webfont-29800836.svg'
    }, {
      unreved: 'fonts/fontawesome-webfont.ttf',
      reved: 'fonts/fontawesome-webfont-706450d7.ttf'
    }, {
      unreved: 'fonts/fontawesome-webfont.woff',
      reved: 'fonts/fontawesome-webfont-d9ee23d5.woff'
    }, {
      unreved: 'fonts/fontawesome-webfont.woff2',
      reved: 'fonts/fontawesome-webfont-97493d3f.woff2'
    }, {
      unreved: 'fonts/glyphicons-halflings-regular.eot',
      reved: 'fonts/glyphicons-halflings-regular-f4769f9b.eot'
    }, {
      unreved: 'fonts/glyphicons-halflings-regular.svg',
      reved: 'fonts/glyphicons-halflings-regular-89889688.svg'
    }, {
      unreved: 'fonts/glyphicons-halflings-regular.ttf',
      reved: 'fonts/glyphicons-halflings-regular-e18bbf61.ttf'
    }, {
      unreved: 'fonts/glyphicons-halflings-regular.woff',
      reved: 'fonts/glyphicons-halflings-regular-fa277232.woff'
    }, {
      unreved: 'fonts/glyphicons-halflings-regular.woff2',
      reved: 'fonts/glyphicons-halflings-regular-448c34a5.woff2'
    }, {
      unreved: 'images/busy-indicator-lg-dark.gif',
      reved: 'images/busy-indicator-lg-dark-8f372b90.gif'
    }, {
      unreved: 'images/busy-indicator-lg-light.gif',
      reved: 'images/busy-indicator-lg-light-25050875.gif'
    }, {
      unreved: 'images/busy-indicator-sm-light.gif',
      reved: 'images/busy-indicator-sm-light-b464283c.gif'
    }, {
      unreved: 'images/footer-logo.png',
      reved: 'images/footer-logo-df3d73ed.png'
    }, {
      unreved: 'images/icon-progress-indicator.png',
      reved: 'images/icon-progress-indicator-b342c570.png'
    }, {
      unreved: 'images/scripps-swirl.png',
      reved: 'images/scripps-swirl-65b0319e.png'
    }, {
      unreved: 'images/sprite.png',
      reved: 'images/sprite-9e275087.png'
    }, {
      unreved: 'images/sprite_2x.png',
      reved: 'images/sprite_2x-c7af344b.png'
    }, {
      unreved: 'scripts/app.js', reved: 'scripts/app-137924b0.js'
    }, {
      unreved: 'styles/app.css', reved: 'styles/app-4858235a.css'
    }, {
      unreved: 'env/deploy/features.json',
      reved: 'env/deploy/features-2a501331.json'
    }];

    const expected = [{
      unreved: 'fonts/glyphicons-halflings-regular.woff2',
      reved: 'fonts/glyphicons-halflings-regular-448c34a5.woff2'
    }, {
      unreved: 'fonts/glyphicons-halflings-regular.woff',
      reved: 'fonts/glyphicons-halflings-regular-fa277232.woff'
    }, {
      unreved: 'fonts/glyphicons-halflings-regular.svg',
      reved: 'fonts/glyphicons-halflings-regular-89889688.svg'
    }, {
      unreved: 'fonts/glyphicons-halflings-regular.ttf',
      reved: 'fonts/glyphicons-halflings-regular-e18bbf61.ttf'
    }, {
      unreved: 'fonts/glyphicons-halflings-regular.eot',
      reved: 'fonts/glyphicons-halflings-regular-f4769f9b.eot'
    }, {
      unreved: 'images/busy-indicator-lg-light.gif',
      reved: 'images/busy-indicator-lg-light-25050875.gif'
    }, {
      unreved: 'images/busy-indicator-sm-light.gif',
      reved: 'images/busy-indicator-sm-light-b464283c.gif'
    }, {
      unreved: 'images/icon-progress-indicator.png',
      reved: 'images/icon-progress-indicator-b342c570.png'
    }, {
      unreved: 'images/busy-indicator-lg-dark.gif',
      reved: 'images/busy-indicator-lg-dark-8f372b90.gif'
    }, {
      unreved: 'fonts/fontawesome-webfont.woff2',
      reved: 'fonts/fontawesome-webfont-97493d3f.woff2'
    }, {
      unreved: 'fonts/fontawesome-webfont.woff',
      reved: 'fonts/fontawesome-webfont-d9ee23d5.woff'
    }, {
      unreved: 'fonts/fontawesome-webfont.eot',
      reved: 'fonts/fontawesome-webfont-f7c2b4b7.eot'
    }, {
      unreved: 'fonts/fontawesome-webfont.ttf',
      reved: 'fonts/fontawesome-webfont-706450d7.ttf'
    }, {
      unreved: 'fonts/fontawesome-webfont.svg',
      reved: 'fonts/fontawesome-webfont-29800836.svg'
    }, {
      unreved: 'env/deploy/features.json',
      reved: 'env/deploy/features-2a501331.json'
    }, {
      unreved: 'images/scripps-swirl.png',
      reved: 'images/scripps-swirl-65b0319e.png'
    }, {
      unreved: 'images/footer-logo.png',
      reved: 'images/footer-logo-df3d73ed.png'
    }, {
      unreved: 'fonts/FontAwesome.otf',
      reved: 'fonts/FontAwesome-0b462f5c.otf'
    }, {
      unreved: 'images/sprite_2x.png',
      reved: 'images/sprite_2x-c7af344b.png'
    }, {
      unreved: 'images/sprite.png',
      reved: 'images/sprite-9e275087.png'
    }, {
      unreved: 'data/favicon.ico',
      reved: 'data/favicon-15d0f308.ico'
    }, {
      unreved: 'scripts/app.js', reved: 'scripts/app-137924b0.js'
    }, {
      unreved: 'styles/app.css', reved: 'styles/app-4858235a.css'
    }];

    assert.deepEqual(renames.sort(utils.byLongestUnreved), expected);
  });
});

describe('modifyUnreved and modifyReved options', function() {
    it('should modify the names of reved and un-reved files', function(cb) {
        const manifest = es.readArray([
            new Vinyl({
                path: '/project/rev-manifest.json',
                contents: Buffer.from(JSON.stringify({
                    'js/app.js.map': 'js/app-12345.js.map',
                    'css/style.css': 'css/style-12345.css'
                }))
            })
        ]);

        function replaceJsIfMap(filename) {
            if (filename.indexOf('.map') > -1) {
                return filename.replace('js/', '');
            }
            return filename;
        }

        const stream = revRewrite({
            manifest: manifest,
            modifyUnreved: replaceJsIfMap,
            modifyReved: replaceJsIfMap
        });

        const replacedJSMapFilePattern = /sourceMappingURL\=app-12345\.js\.map/;
        const replacedCSSFilePattern = /css\/style-12345\.css/;

        stream.on('data', function(file) {
            const contents = file.contents.toString();
            const extension = path.extname(file.path);

            if (extension === '.js') {
                assert(
                    replacedJSMapFilePattern.test(contents),
                    'The source map has been correctly replaced using modifyReved and modifyUnreved'
                );
            } else if (extension === '.html') {
                assert(
                    replacedCSSFilePattern.test(contents),
                    'The renamed CSS file\'s name should be replaced and not affected by modifyReved or modifyUnreved'
                );
            }
        });

        stream.on('end', function() {
            cb();
        });

        stream.write(new Vinyl({
            path: path.join('js', 'app.js'),
            contents: Buffer.from(jsFileBody)
        }));
        stream.write(new Vinyl({
            path: 'index.html',
            contents: Buffer.from(htmlFileBody)
        }));

        stream.end();
    });
});
