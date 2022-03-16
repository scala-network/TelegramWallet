# Usages

## NodeJS and Redis

* Nodejs v16.0+
	* For Ubuntu: 
 ```
	sudo apt-get update
	sudo apt-get install build-essential libssl-dev
	curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.39.1/install.sh | bash
	source ~/.profile
	nvm install 16
	nvm alias default 16
	nvm use default
```
* [Redis](http://redis.io/) key-value store v5.0+ 

## Installation

Clone the repository and run `npm install` for all the dependencies to be installed:

```bash
	git clone https://github.com/scala-network/TelegramWallet.git stw
	cd stw
	npm install
```

## Configurations

Copy the `config.default.json` to `config.json` then view each options and change to match your preferred setup. Refer [config document](doc/config.md)

## Bot

You must have a bot created. To create a bot message [@BotFather](https://t.me/botfather)

## RPC
RPC is how we communicate with the wallet. Must have a wallet rpc setup (find the coin's repo and build latest version from source). Below is an eg. for scala.

* Download latest [release](https://github.com/scala-network/Scala/releases)
* Run daemon via 

```bash
./scalad
```

* Create a wallet if you don't have one by using 

```bash
./scala-wallet-cli
```

* Run RPC as below

```bash
./scala-wallet-rpc --disable-rpc-login --rpc-bind-port 18081 --wallet-file wallet --prompt-for-password
```

*Currently we haven't tested on rpc with logins*

* To test you RPC is avaliable you can use netstat, curl or any other methods you find ease. Here is a way to test via curl

```bash
curl http://127.0.0.1:18081/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"get_address","params":{"account_index":0,"address_index":[]}}' -H 'Content-Type: application/json'
```

## Running

Once everything is setup run
```bash
node app.js
```
