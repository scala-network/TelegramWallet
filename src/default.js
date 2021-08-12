

module.exports = {
	
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
	"commands" : {
		'allowed' : [
			'help',
			'height',
    		'create',
    		'balance',
    		'address',
    		'info',
    		'remove'
		]
	}    
}