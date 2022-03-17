module.exports = {
	/**
	 *  SINGLE WALLET MODE 
	 *  when swm:true 
	 *  Account create will be
	 *  a subaddress
	 **/
	"coin" : "xla",
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
	'datasource' : {
		
	},
	
	"admins" : []
}
