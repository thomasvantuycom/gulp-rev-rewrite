'use strict';

const path = require('path');
const escapeRegExp = require('lodash.escaperegexp');

module.exports = function (string, manifest, filePath) {
	let newString = string;

	manifest.forEach(entry => {
		const {unreved, reved} = entry;

		const FRONT_DELIMITERS = ['"', '\'', '\\s', ',', '(', '/', '='];
		const BACK_DELIMITERS = ['"', '\'', '\\s', ',', ')', '\\\\', '?', '#'];

		const regexp = new RegExp(
			`([${FRONT_DELIMITERS.join('')}]|^)(${escapeRegExp(
				unreved
			)})([${BACK_DELIMITERS.join('')}]|$)`,
			'g'
		);

		newString = newString.replace(
			regexp,
			(match, frontDelimiter, unreved, backDelimiter) =>
				`${frontDelimiter}${reved}${backDelimiter}`
		);

		if (filePath) {
			const fileDir = path.dirname(filePath);
			const relativeUnreved = path.relative(fileDir, unreved);
			const relativeReved = path.relative(fileDir, reved);

			const relativeRegexp = new RegExp(
				`([${FRONT_DELIMITERS.join('')}]|^)(${escapeRegExp(
					relativeUnreved
				)})([${BACK_DELIMITERS.join('')}]|$)`,
				'g'
			);

			newString = newString.replace(
				relativeRegexp,
				(match, frontDelimiter, relativeUnreved, backDelimiter) =>
					`${frontDelimiter}${relativeReved}${backDelimiter}`
			);
		}
	});
	return newString;
};
