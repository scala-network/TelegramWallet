var http = require('http');
http.createServer(function (req, res) {
  const userid = req.url.trim().replace('/','');
  if(isNaN(userid) || parseInt(userid) <= 0) {
      res.writeHead(404, {'Content-Type': 'text/json'});
      res.write(JSON.stringify({
        message:"Invalid request"
      }));
      res.end();
      return;
  }
  global.redisClient.hgetall(`xla:Users:${userid}`).then(results => {
    let output = {};
    for(let i =0;i< results.length;i+=2) {
      const field = results[i];
      let value;
      try{
        const json = JSON.parse(results[i+1]);
        value = {
          address:json.address,
          wallet_id:json.wallet_id
        };
      } catch{
        value = results[i+1];
      }

      results[field] = value;
    }

    res.writeHead(200, {'Content-Type': 'text/json'});
    res.write(JSON.stringify({results}));
    res.end();  
  })
  
}).listen(8080);