import escapeStringRegexp from 'escape-string-regexp';

export default function replace(contents, manifest) {
	let newContents = contents;
	for (const [originalPath, revisionedPath] of Object.entries(manifest)) {
		const FRONT_DELIMITERS = ['"', '\'', '\\s', ',', '\\(', '\\/', '=', '^', '%2F'];
		const BACK_DELIMITERS = ['"', '\'', '\\s', ',', '\\)', '\\\\', '\\?', '#', '$', '&', '>'];

		const regexp = new RegExp(
			`(?<=${FRONT_DELIMITERS.join('|')})${escapeStringRegexp(
				originalPath,
			)}(?=${BACK_DELIMITERS.join('|')})`,
			'g',
		);

		newContents = newContents.replace(regexp, revisionedPath);
	}

	return newContents;
}
