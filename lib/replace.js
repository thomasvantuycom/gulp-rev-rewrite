import escapeStringRegexp from 'escape-string-regexp';

export default function replace(contents, manifest) {
	let newContents = contents;
	for (const [originalPath, revisionedPath] of Object.entries(manifest)) {
		const regexp = new RegExp(`(?<![\\w-])${escapeStringRegexp(originalPath)}(?![\\w.])`, 'g');

		newContents = newContents.replace(regexp, revisionedPath);
	}

	return newContents;
}
