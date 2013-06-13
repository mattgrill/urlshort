var express   = require('express'),
    app       = express(),
    redis     = require('redis'),
    client    = redis.createClient(),
    shortid   = require('shortid'),
    crypto    = require('crypto'),
    bcrypt    = require('bcrypt'),
    urlshort  = {
      colors        : {
                      red   : '\033[31m',
                      blue  : '\033[34m',
                      reset : '\033[0m'
                    },
      listen_port   : 3000,
      status_codes  : {
                      200 : 'OK',
                      300 : 'Incorrect Link',
                      400 : 'Bad Request',
                      401 : 'Unauthorized',
                      404 : 'Not Found',
                      500 : 'Internal Server Error',
                      503 : 'Unknown Server Error'
                    },
      key_exists    : function(available_key,callback){
                      if (available_key.length <= 0) { return callback("Word not found") }
                      client.exists(available_key, function (err, doesExist) {
                        switch(doesExist){
                          case 0: // the key does not exist
                            callback(available_key);
                            break;
                          case 1: // the key exists
                            urlshort.key_exists(shortid.generate(),callback)
                            break
                        }
                      });
                    },
      crypt_email   : function(email,callback){
                      bcrypt.genSalt(200, function(err, salt){
                        bcrypt.hash(email, salt, function(err, hash){
                          callback(hash);
                        });
                      });
                    },
      auth_token    : function(callback){
                      crypto.randomBytes(8, function(ex, buf){
                        callback(buf.toString('hex'))
                      });
                    }
};

app.configure(function () {
  app.use(express.bodyParser());
  app.use(express.logger({
    format: ':response-time ms - :date - :req[x-real-ip] - :method :url :user-agent / :referrer'
  }));
}); 

app.post('/',function(req,res){ /* Create */
  if(req.body.url){
    var response = {
          original_url : req.body.url
        };
    urlshort.key_exists(shortid.generate(),function(available_key){
      response.key = available_key;
      urlshort.auth_token(function(authtoken){
        response.token = authtoken;
        client.hmset(response.key,response,function(){
          res.send(response,200);
        });
      });
    });
  }
  else {
    res.send({'message':urlshort.status_codes[400]},400);
  }
});

app.get('/:hash',function(req,res){ /* Read */
  if(req.params.hash){
    var hash = req.params.hash;
    client.exists(hash, function (err, doesExist) {
      switch(doesExist){
        case 0: // the key does not exist
          res.send({'message':urlshort.status_codes[404]},404);
          break;
        case 1: // the key exists
          client.hgetall(hash,function(err,obj){
            if (err) res.send({'message':urlshort.status_codes[500]},500);
            else res.redirect(obj.original_url.toString(), 301);
          });
          break
      };
    });
  }
  else{
    res.send(404);
  }
});

app.delete('/',function(req,res){ /* Delete */
  if(req.body.hash && req.body.authtoken){
    var hash        = req.body.hash,
        auth_token  = req.body.authtoken;
    
    client.exists(hash, function (err, doesExist) {
      switch(doesExist){
        case 0: // the key does not exist
          res.send({'message':urlshort.status_codes[404]},404);
          break;
        case 1: // the key exists
          client.hgetall(hash,function(err,obj){
            if (err){ res.send({'message':urlshort.status_codes[500]},500); }
            else if (obj.token === auth_token){
              client.del(hash,function(){
                res.send({'message':urlshort.status_codes[200]},200);
              });
            }
          });
          break
      };
    });
  }
  else {
    res.send({'message':urlshort.status_codes[401]},401);
  }

});

app.listen(urlshort.listen_port);
console.log(urlshort.colors.red + 'URLSHORT : Listening on port ' + urlshort.listen_port + urlshort.colors.reset);