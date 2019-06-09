
const path = require('path');
const fs = require('fs');

const httpRequest = require('./interfaces/request');
const Wallet = require('./interfaces/wallet');




module.exports = (rpc_details) => {

        const self = this;
        this.details = rpc_details;
        this.status = 0; // 0 => Close, 1 => Open
        this.context = null;
        this.wallet = new Wallet(self);


        self.request = (method, params, callback) => {
            callback = callback || function () {}

            const c = httpRequest.setup(self.details,method,params);

            httpRequest.post(c).then((response) => {
                callback(null, response, c);
              })
             .catch(err => {
                callback(err, null, c);
             })
             .finally(() => {
             	self.wallet.reSync(() => {
             		self.wallet.close();
                    redisClient.rpush([global.config.redis.prefix,"Notify"].join(':'), {
                        ctx : JSON.stringify(self.context),
                        wallet : {
                        	height: self.wallet.height,
                        	last_updated: self.wallet.last_updated,
                        	address: self.wallet.getAddress(),
                        	balance: self.wallet.getBalance(),
                        }
                    });
             	});
             });
        };


        self.execute = (o, cb ) => {
            self.context = o.ctx;
            const r = o.rpc;  
            self.context.action = r;
            switch(r) {
            	case 'open':

            		break;
                case 'create_wallet':
                    let filename = o.ctx.from.id;
                    
                    let i = 0;

                    while(true) {
                        try {
                            let f = filename;
                            f += (i === 0) ? '' : i;

                            let p = path.join(global.config.rpc.wallet_dir, f);
                            
                            if (fs.existsSync(p)) {
                                i++;
                            } else {
                                filename = f;
                                break;
                            }

                        } catch(err) {
                            console.error(err)
                        }
                    }
                    // Make a request for a user with a given ID

                    self.request('create_wallet', {filename: filename}, cb);
                    break;
                default:
                    break;
            }           
        }

        return self;
};