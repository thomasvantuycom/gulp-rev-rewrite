export default function replace(contents, manifest) {
	let newContents = contents;
	for (const [originalPath, revisionedPath] of Object.entries(manifest)) {
		const regexp = new RegExp(String.raw`(?<![\w\-])${RegExp.escape(originalPath)}(?![\w.])`, 'gv');

		newContents = newContents.replace(regexp, () => revisionedPath);
	}

	return newContents;
}
