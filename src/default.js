

module.exports = {
	/**
	 *  SINGLE WALLET MODE 
	 *  when swm:true 
	 *  Account create will be
	 *  a subaddress
	 **/
	"swm":true, 
	"log": {
        "files": {
            "enabled" : false,
            "level" : "error",
            "directory" : "logs",
            "flushInterval" : 5
        },
        "console"  : {
            "enabled" : true,
            "level" : "info",
            "colors" : true
        }
    },
	"redis": {
		// "path" :  "/path/to/socket/or/remove/key",
		"address" : "127.0.0.1",
		"port" : 6379,
		"db" : 5,
		"keepalive" : true,
		"auth" : false,
        "prefix":null
	},
	"admins" : [],
	"commands" : {
		'allowed' : [
			'help',
			'height',
    		'create',
    		'balance',
    		'address',
    		'info',
    		'remove',
    		'tip',
    		'set',
    		'transfer',
    		'withdraw',
    		'submit',
    		'version'
		],
		"tip" : 100000 // equals to 1000.00 XLA
		"rain" : 1000 // equals to 1000.00 XLA
	}    
}