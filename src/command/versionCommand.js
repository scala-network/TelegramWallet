
const Command = require('../base/command');
const logSystem = "command/height";
const path = require('path');
const fs = require('fs');

class VersionCommand extends Command {
	enabled = true;
	static CurrentVersion = null;

	get description() {
		return "Returns server's version";
	}

	get name() {
		return "version";
	}

	async run(ctx) {
        if(ctx.test)  return;
        if(!VersionCommand.CurrentVersion) {
        	const git = require('git-rev-sync');
			const short = git.short();
			try{
				const pjson = path.join(process.cwd(),'package.json');
				const rfs = fs.readFileSync(pjson);
      			VersionCommand.CurrentVersion = `Version : ${JSON.parse(rfs).version}-${short}`;
			} catch(e){
			    return await ctx.appResponse.reply("Unable to display version");
			}
        }
        
		ctx.appResponse.reply(VersionCommand.CurrentVersion);

	}

}

module.exports = VersionCommand;
