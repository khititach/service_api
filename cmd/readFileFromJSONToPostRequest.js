var request = require('request');
var through2 = require('through2');
var JSONStream = require('JSONStream');
var fs = require('fs');
var uuid = require('node-uuid');

var count = 0;

var stream = fs.createReadStream('./province.json')
.pipe(JSONStream.parse('RECORDS.*'))
.pipe(through2.obj(function(chunk, enc, callback) {
  var key = uuid.v1();
  key = key.replace(/-/g, '');
  var value = chunk;
  var opt = {
    method: 'POST',
    uri: 'http://localhost/mongodb/thailand/provine/data/'+key,
    //headers: {
    //  'Authorization': 'JWT OuB6OnhPFKyUkFJp',
    //},
    json: true,
    body:chunk
  };

  request(opt, function(err, httpResponse, data) {
    if (err) {
      saveLog('./cmd/error_province.json', JSON.stringify(chunk));
      console.error('failed:', err);
    } else {
      console.log(count++, data);
      saveLog('success_province.json', key);
    }
  });
  callback();
}));

function saveLog(log, data) {
  var file = './' + log;
  var text = data+',\r\n';
  fs.appendFile(file, text, function(err) {
    if (err) return console.log(err);
  });
}
