const fs = require('fs')

module.exports = {
	listChildFiles: ({ folder }) => fs.readdirSync(folder).map(file => `${folder}\\${file}`),
	readFileContent: ({ path }) => fs.readFileSync(path).toString(),
	checkFileExist: ({path}) => fs.existsSync(path)
}