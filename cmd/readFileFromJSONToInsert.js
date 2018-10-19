var through2 = require('through2');
var JSONStream = require('JSONStream');
var fs = require('fs');
var uuid = require('node-uuid');
var MongoClient = require('mongodb').MongoClient;

var count = 0;

const url = 'mongodb://localhost:27017';
const dbName = 'thailand';

MongoClient.connect(url, function(err, client) {
  const col = client.db(dbName).collection('province');
  var stream = fs.createReadStream('./province.json')
  .pipe(JSONStream.parse('RECORDS.*'))
  .pipe(through2.obj(function(chunk, enc, callback) {
    var key = uuid.v1();
    key = key.replace(/-/g, '');
    chunk._id = key;
    var data = chunk;
    col.insert(data, function(err, result) {
      console.log(count++, result);
      saveLog('success_province.json', key);
    });
    callback();
  }));
});

function saveLog(log, data) {
  var file = './' + log;
  var text = data+',\r\n';
  fs.appendFile(file, text, function(err) {
    if (err) return console.log(err);
  });
}
