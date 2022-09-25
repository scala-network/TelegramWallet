const fetch = require('node-fetch');
const { Coins, LCDClient,MnemonicKey,MsgSend } = require('@terra-money/terra.js');
const https = require('https');
// process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const rpcAddress = "http://localhost:1317";
// const rpcAddress = "http://45.79.139.229:3000";
// const rpcAddress = "https://lcd.terra.dev";
// const httpsAgent = new https.Agent({
//   rejectUnauthorized: false,
// });
(async () => {
// const gasPrices = await fetch( "https://pisco-api.terra.dev/gas-prices", { redirect: 'follow' }
// );
// const gasPricesJson = await gasPrices.json();
// console.log(gasPricesJson);
const gasPricesCoins = new Coins({ uluna: '0.15' });

// const gasPricesCoins = new Coins(gasPricesJson); 
const lcd = new LCDClient({
  URL: rpcAddress, // Use "https://lcd.terra.dev" for prod "http://localhost:1317" for localterra.
  chainID: "localterra", // Use "columbus-5" for production or "localterra".
  gasPrices: gasPricesCoins,
  gasAdjustment: "1.5", // Increase gas price slightly so transactions go through smoothly.
  gas: 10000000,
  isClassic: true, // false by default, change to true if you want to interact with Terra Classic
});

/** createWallet **/
const mk = new MnemonicKey({
  // mnemonic:'symptom art car wonder spread current whale produce lounge chef raven divert improve onion park secret tooth private furnace disorder ability penalty chuckle argue'
  mnemonic:'notice oak worry limit wrap speak medal online prefer cluster roof addict wrist behave treat actual wasp year salad speed social layer crew genius'
});
const wallet = lcd.wallet(mk);
const address = wallet.key.accAddress;
let balance;
try{
  balance = await lcd.bank.balance(address);
} catch(e) {
  console.log(e.code);
}

console.log(balance[0].toData(true));

// const mk2 = new MnemonicKey();

// const wallet2 = lcd.wallet(mk2);
// console.log(wallet2.key.mnemonic);


// // Transfer 1 Luna.
// const send = new MsgSend(
//   wallet.key.accAddress,
//   "terra17lmam6zguazs5q5u6z5mmx76uj63gldnse2pdp",
//   { uluna: "1000000" }
// );

// const tx = await wallet.createAndSignTx({ msgs: [send] });
// const result = await lcd.tx.broadcast(tx);

// console.log(result);
const mk2 = new MnemonicKey({
  // mnemonic:'symptom art car wonder spread current whale produce lounge chef raven divert improve onion park secret tooth private furnace disorder ability penalty chuckle argue'
  mnemonic:'quality vacuum heart guard buzz spike sight swarm shove special gym robust assume sudden deposit grid alcohol choice devote leader tilt noodle tide penalty'
});
const wallet2 = lcd.wallet(mk2);
const address2 = wallet2.key.accAddress;
let balance2;
try{
  balance2 = await lcd.bank.balance(address2);
} catch(e) {
  console.log(e.code);
}

console.log(balance2[0].toData(true));

})();
