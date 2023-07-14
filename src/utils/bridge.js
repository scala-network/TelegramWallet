module.exports.telegram2Discord = (text, entities) => {
	let convert;
	let start_format;
	let end_format;
	let section_offset = 0
	let section_end;
	let section_start;

	entities.forEach(({type, offset, length, url}) => {
		convert = true;
		if (type == 'bold') {
			start_format = '\*\*';
			end_format = '\*\*';
		} else if(type == 'italic') {
			start_format = '\_';
			end_format = '\_';
		} else if(type == 'text_link') {
			start_format = '\*\*';
			end_format = '\*\* (<' + url + '>)';
		} else {
			// Don't convert other entities
			convert = false;
		}

		if (convert) {
			section_start = offset + section_offset;
			section_end = offset + length + section_offset;
			// First add end_format, so it won't mess up the string indexes for start_format
			text = text.slice(0, section_end) + end_format + text.slice(section_end);
			text = text.slice(0, section_start) + start_format + text.slice(section_start);
			section_offset += start_format.length + end_format.length;
		}
	});

	return text

}