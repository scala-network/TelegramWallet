# Commands

Commands are message that are sent to bot to execute a certain function or features. Commands are accepted only with a prefix `/`
Each commands can be set as authorized for either in group only, user action only or both. Below are the commands available.

* /help - shows all commands avaliable
* /height - Returns all coins' wallet and daemon height
* /balance - Returns all coins' wallet balance
* /address - Returns wallet address for all generated coins and to generate a new coin's wallet 
* /info - Returns information about your profile and wallets
* /start - Function on start
* /remove - Deletes your account
* /tip - Tip coin to another user
* /set - Config setup for a certain coin
* /withdraw - Withdraw coins in wallet. Use all as amount to withdraw all from account (usages : /withdraw coin coin_address amount memo_or_note_here)
* /version - Returns app's version
* /price - Display current market price. With additional argument as ticker will send price changes for that ticker


## /address
![telegram-cloud-photo-size-5-6204172584145236156-y](https://user-images.githubusercontent.com/630603/194770232-bf00f52b-947c-4066-a7e1-805ff5fef917.jpg)

By issuing address command to bot, it will show all coin's wallet already generated. A button will appear to indicate that coin's wallet is avaliable to be generated

## /withdraw
Allows you to send funds from your wallet to another recipient's wallet or address. 

Usages:```/withdraw coin coin_address amount memo_or_note_here```

Replace "coin" with the name of the cryptocurrency you want to withdraw, "coin_address" with the recipient's coin address, "amount" with the total amount you want to withdraw, and "memo_or_note_here" with the memo or note you want to include with the transaction, if requires.

If you want to withdraw all the coins in your wallet, you can use the following command format:

Usages: ```/withdraw coin coin_address all memo_or_note_here```

**Take note:**

* Be sure to double-check all transaction details before confirming the withdrawal, especially when using the "all" parameter, to avoid any unintended consequences such as sending more funds than intended or sending funds to the wrong address.

* When withdrawing cryptocurrencies from a wallet to an exchange, it's important to include a memo or tag in the transaction, if required by the exchange.

## /tip
Tip allows users to transfer a spesific coin to another user. To setup default values for tipping go to /set for more information.
Usages : /tip coin username custom_amount(optional)
Can send a non default value by `/tip coin username custom_amount` (eg : `/tip xla username 10`)
For tipping multiple users run `/tip coin username1 username2 username3 username4 custom_amount`

## /set

Set config value for your coin. To display current settings for a coin run `/set coin`. To set configs run `/set coin config value`

### Configs avaliable
**rain**
- Set amount of coin to distribute per head 
- usage: `/set xla rain 10`
 
**tip**
- Set default tip value 
- usage: `/set xla tip 100`
 
**tip_submit**
- On enable tip will require a confirmation before sending (default: disable)
- usage: `/set xla tip_submit disable`

**rain_submit**
- On enable rain will require a confirmation before sending (default: disable) 
- usage: `/set xla rain_submit disable`

**wet**
- Number of latest members to recieve rain
- usage: `/set xla wet 10`
