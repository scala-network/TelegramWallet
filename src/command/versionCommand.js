
const Command = require('./BaseCommand');
const logSystem = "command/height";
const path = require('path');
const fs = require('fs');

class VersionCommand extends Command {
	enabled = true;

	get description() {
		return "Returns server's version";
	}

	get name() {
		return "version";
	}

	async run(ctx) {
        if(ctx.test)  return;
        const pjson = path.join(process.cwd(),'package.json');

		try {

		    const rfs = fs.readFileSync(pjson);
      		ctx.reply(`Version : ${JSON.parse(rfs).version}`);

		} catch(e){
		    ctx.reply("Unable to display version");
		}
        
		
	}

}

module.exports = VersionCommand;
