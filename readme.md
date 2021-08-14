# Scala Telegram Wallet

![image](https://user-images.githubusercontent.com/630603/129296852-b4aefc21-8aa9-47fd-b135-7111db42bee0.png)

## Commands

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


