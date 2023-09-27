import escapeStringRegexp from 'escape-string-regexp';

export default function replace(string, manifest) {
	let newString = string;
	for (const entry of manifest) {
		const {unreved, reved} = entry;

		const FRONT_DELIMITERS = ['"', '\'', '\\s', ',', '\\(', '\\/', '=', '^', '%2F'];
		const BACK_DELIMITERS = ['"', '\'', '\\s', ',', '\\)', '\\\\', '\\?', '#', '$', '&', '>'];

		const regexp = new RegExp(
			`(?<=${FRONT_DELIMITERS.join('|')})${escapeStringRegexp(
				unreved,
			)}(?=${BACK_DELIMITERS.join('|')})`,
			'g',
		);

		newString = newString.replace(regexp, reved);
	}

	return newString;
}
