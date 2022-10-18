var http = require('http');



http.createServer(function (req, res) {
  const error = () => {
    res.writeHead(404, {'Content-Type': 'text/json'});
    res.write(JSON.stringify({
      message:"Invalid request"
    }));
    res.end();
  }

  const wallets = () => {
    
    const fields = ['user_id','wallet','xla','vxla','lunc'];
    global.redisClient.hmget(`xla:Users:${userid}`,fields).then(results => {
      let output = {};

      for(let i =0;i< fields.length;i++) {
        const field = fields[i];
        let value = results[i];
        if(field !== 'userid') {
          try{
            if(value && isNaN(value) && typeof value === 'string') {  
              const json = JSON.parse(value);  
              value = {
                address:json.address,
                wallet_id:json.wallet_id
              };
            }
          } catch{
          }
        } 
        output[field] = value;
      }

      res.writeHead(200, {'Content-Type': 'text/json'});
      res.write(JSON.stringify(output));
      res.end();  
    })
  };

  if(req.url.startsWith('/walllets/')) {
    const userid = req.url.trim().replace('/wallets/','').replace('/','');
    if(isNaN(userid) || parseInt(userid) <= 0 || !userid) {
      errors();
      return;
    }
    return wallets();
  } 
  errors();
  return;

}).listen(8080);