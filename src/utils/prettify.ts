export default function prettify(html: string) {
	const splitted = html.trim().replace(/(^(\s|\t)+|(( |\t)+)$)/gm, '').split('\n');
	const mergedLines = new Array<string>();
	let currentElement = '';
	for (let i = 0; i < splitted.length; ++i) {
		const line = splitted[i];
		if (line.endsWith('/>')) {
			mergedLines.push(`${currentElement}${line.slice(0, -2)} />`);
			currentElement = '';
			continue;
		}
		if (line.endsWith('>')) {
			mergedLines.push(`${currentElement}${line.startsWith('>') || line.startsWith('<') ? '' : ' '}${line}`);
			currentElement = '';
			continue;
		}
		currentElement += (currentElement.length ? ' ' : '') + line;
	}
	let level = 0;
	const opened = new Array<string>();
	return mergedLines.reverse().reduce((prev: string[], curr) => {
		if (opened.length && level && opened[level] && opened[level] === curr.substring(1, opened[level].length + 1)) opened.splice(level--, 1);
		const indentation = (' ').repeat(level ? level * 2 : 0);
		const newIndented = [
			`${indentation}${curr}`,
			...prev,
		];
		if (curr.substring(0, 2) === '</') opened[++level] = curr.substring(2, curr.length - 1);
		return newIndented;
	}, []).join('\n');
}

// code from https://github.com/Dmc0125/html-prettify