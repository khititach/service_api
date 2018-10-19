var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var MongoClient = require('mongodb').MongoClient;
var ip = require("ip");
var JSONStream = require('JSONStream');
var jwt = require("jsonwebtoken");
var crypto = require("crypto"),
    algorithm = 'aes-256-ctr',
    password = 'd6F3Efeq';
	
var route = require('./route');
var login = require('./login');
var config = require('./config');

var mongodb = {};

var app = express();

app.use(cors());
app.use(bodyParser.json({
  limit: '50mb'
}));
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use('*',function(req,res,next){
  res.set({
    'Access-Control-Expose-Headers': 'Authorization',
    'Content-Type': 'application/json; charset=utf-8',
    'Bind-Address': ip.address()+':'+config.port
  });
  next();
});

app.param('db', function(req, res, next, value) {
  req.mongodb = mongodb[value];
  next();
});

app.param('collection', function(req, res, next, value) {
  req.collection = req.mongodb.db.collection(value);
  next();
});

function encrypt(text){
  var cipher = crypto.createCipher(algorithm,password)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}
 
function decrypt(text){
  var decipher = crypto.createDecipher(algorithm,password)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}

app.post('/signup', function(req, res) {
  mongodb['cores'].db.collection('user_db').insert({
    Name : req.headers.user,
    Pass : encrypt(req.headers.pass)
  },function(err,data){
      if(!err){
        res.send(encrypt(req.headers.pass));
      }
      else{
        res.send("Can't insert!!!!");
      }
  });
});

app.post('/login',function(req,res){
  //var user = req.headers.user;
  //var pass = req.headers.pass;
  //encode pass
  var obj;
  console.log(mongodb['cores']);
  mongodb['cores'].db.collection('user_db').find({
    Name:req.headers.user,
    Pass:encrypt(req.headers.pass)
  }).toArray(function(err,data){
    if(!err){
      if(data.length==1){
        var JWTToken = jwt.sign({
          data:data
        },
        'secret',
         {
           expiresIn: '2h'
         });
      obj = {
        token:JWTToken,
        status:true
      }
      res.send(obj);
    }
    else res.send({status:false});
    }
    else{
      obj = {
        status:false
      }
      res.send(obj);
    }
  });
  //console.log(req.headers);
  
});

/*app.post('/login', rewrite('/_login/cores/user_db'));
app.post('/_login/:db/:collection', login);*/

app.use('/mongodb/:db/:collection', route);

app.get('/servertime', function (req, res) {
  var long_date = new Date().getTime()
  res.send(long_date.toString());
});

var count = config.mongodb.length;

config.mongodb.forEach(function(db_config) {  
  MongoClient.connect(db_config.url,
    function(err, db) {
      if (!err) {
        count--;
        mongodb[db_config.db] = {
          'db': db,
          'config': db_config
        };
        if (count == 0) {
          app.listen(config.port, function() {
            console.log('Server listening on port %d', this.address().port);
          });
        }
      }
    });
});