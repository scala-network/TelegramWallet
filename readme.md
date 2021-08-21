# Scala Telegram Wallet

![Screenshot 2021-08-14 at 10 04 42 PM](https://user-images.githubusercontent.com/630603/129448879-48c8b551-21e6-4a8a-89ed-77c84eae4de5.png)

## Commands
Below are the commands available

* /help - Show all commands
* /create - Create a new account
* /balance - Check current wallet balance
* /address - Reveal you coin wallet address
* /withdraw - Withdraw coin from wallet to another coin address
* /transfer - Transfer you coin from wallet to another telegram user
* /tip - Sends coin base on your setup tip amount
* /info - Display information about wallet and account
* /submit - Once withdraw and transfer is done you need to reply submit with id to confirm payment
* /version - Display current server's version
* /height - Display wallet's height
* /set - Configure settings. Amongst settings avaliable
    * tip - Set tip amount
* /rain - Airdrop coin to users in group who have registered with coin

### Commands Development

To create a new command, you must follow these rules.

1. Your command name must be unique
2. Let say your command name is hello, then your command file name should be helloCommand.js
3. Your command should be in /src/commands folder
4. The command class should have these getter
	a. description - returns what your command does in string
	b. name - returns the name of your command in string
5. Must extend BaseCommand
6. Must have run method which accepts [telegraf context](https://github.com/telegraf/telegraf/blob/develop/README.md#context-class)
7. Set `enable` class variable @ property to true allowing the command to be executed

eg.

```nodejs
const BaseCommand = requires('./BaseCommand');

class HelloCommand extends BaseCommand {
	enabled = true;

	get description() {
		return "Prints hello";
	}

	get name() {
		return "hello";
	}

	async run(ctx) {
		ctx.reply("hello");
	}
}

```

### Optional class methods

1. auth - Limits by return either true or false. Accepts a [telegraf context](https://github.com/telegraf/telegraf/blob/develop/README.md#context-class) object.
2. beforeRun - Executed before the run method is called. Accepts [telegraf context](https://github.com/telegraf/telegraf/blob/develop/README.md#context-class) and next callback to continue.


```nodejs
	/* Allowing only groups to execute */
	auth(ctx) {
		return ctx.appRequest.is.group;
	}

	/* Modify context before running it */
	beforeRun(ctx, next) {
		ctx.modifiedContext = () => { return "Hello };
		next(ctx);
	}
}

```

### Telegraf context extensions (appRequest)

appRequest allows to gain about request information from user.

1. is - object allows to identify either admin, a group or the message is personally to user
2. action - can see what the actual command is called
3. query - can see the actual query being made
4. args - the queries in array

eg. of a chat transpose to appRequest

```/transfer username 1000```

`action` - `transfer`
`query` - `username 1000`
`args` - [`username`,`1000`]


### Calling models into commands

You can load a model by calling `this.loadModel(<model name>);`. This will return model inside the models directory.


## Models

There are 2 layers for the model
1. The main model - Main interface class
2. The query layer - The abstraction class base on which engine is use

### Calling RPC Calls for Coin

All rpc requests is base on coin class located at /src/coins. Currently we have XLA only.

To call coin spesific methods or properties use this.Coin inside command

