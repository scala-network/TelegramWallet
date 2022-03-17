# Scala Telegram Wallet (STW)

![stw logo](./doc/logo.jpg)

## Table of Contents
* [Usages](doc/usages.md)
* [Commands](doc/commands.md)
* [Development](doc/development.md)


Scala Telegram Wallet (STW) is designed which alloy easy customization for coin developers to be executed via Telegram.

**Notice:**

We use a custodial wallet service in which you do not own your private keys. Have in mind that we might lose all funds due to a bug or get hacked like any other custodial services. As of now, the bot is fully tested at our official group and are considered stable. Use the bot at your own risk!


You can try to add the scala bot https://t.me/scalawalletbot or join our Telegram community to experience it https://t.me/scalaofficial


**Features:**

* Transactions are directly with chain we don't store them
* Syncronized wallet as the rpc backend will always run 24/7
* Notifications will be send with explorer link to verify completion of transaction
* Allow tip to a telegram username (be assure that the receiver have been communicating with telegram bot personally or say something in group before you send to them if they have change their username)
* Withdraw coin to regular addresses.
* Receive coin on regular addresses.
* Send giveaways to active users only
* Allow to set giveaways amount per user and quantity of users to recieve
* Bot requires no group admin rights
* Clean coding and customizable for any coins


**Why another telegram bot? There's alot of coin tip bot out there.**

Unlike other bots, we designed it to be robust and scalable. Seperating it into classes for easier authorizations and access, clean codes and also those who forks or work with this bot for their coin will fell comfortable to modify and easier to maintain.

