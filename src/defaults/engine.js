

let output = {};

switch(global.config.datasource.engine) {
    case "redis":
    default:
       output = {
            "engine":"redis",
            // "path" :  "/path/to/socket/or/remove/key",
            "address" : "127.0.0.1",
            "port" : 6379,
            "db" : 5,
            "keepalive" : true,
            "auth" : false,
            "prefix":null
        };
        break;   
     case "sqlite":
        output = {
            "path": "database.sqlite"
        };
         break;   
}

module.exports = output;