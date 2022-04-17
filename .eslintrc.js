module.exports = {
	root: true,
	env: {
		node: true
	},
	extends: [
		'semistandard'
	],
	rules: {
		"no-tabs" : 0,
		"indent": ["error", "tab"],
		"allowIndentationTabs": 0,
		"no-case-declarations" : 0
	},
	parser: "@babel/eslint-parser",
	parserOptions: { 
		requireConfigFile : false 
	}
}