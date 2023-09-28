# [6.0.0](https://github.com/thomasvantuycom/gulp-rev-rewrite/compare/v5.0.0...v6.0.0) (2023-09-28)


### Code Refactoring

* move to ESM and require Node 18 ([ce3b418](https://github.com/thomasvantuycom/gulp-rev-rewrite/commit/ce3b418db40ea2e275f326c68dea65edded5d853))
* remove unnecessary plugin options ([3cc22fc](https://github.com/thomasvantuycom/gulp-rev-rewrite/commit/3cc22fc37b158259670c77395a635ea08eb8cc65))


### Performance Improvements

* speed up RegExp with character classes ([35e2943](https://github.com/thomasvantuycom/gulp-rev-rewrite/commit/35e29432f6fd1e367aaecafea56a717a6abb1c1c))


### BREAKING CHANGES

* The plugin is now pure ESM
* Requires Node 18
* The `prefix`, `modifyUnreved`, and modifyReved options
have been removed.
