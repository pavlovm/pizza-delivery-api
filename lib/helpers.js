/*
Useful functions
*/
// Dependencies
var crypto = require('crypto');
var https = require('https');
var querystring = require('querystring');
var config = require('./config');
var StringDecoder = require('string_decoder').StringDecoder;

var helpers = {};

helpers.parseJsonToObject = function(str){
  try{
    var obj = JSON.parse(str);
    return obj;
  } catch(e){
    return {};
  }
};

helpers.hash = function(string){
  if(typeof(string) == 'string' && string.length > 0){
    var hash = crypto.createHmac('sha256', config.hashingSecret).update(string).digest('hex');
    return hash;
  } else {
    return false;
  }
};

helpers.createRandomString = function(strLength){
  strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
  if(strLength){
    var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

    var str = '';
    for (i = 0; i < strLength; i++){
      var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
      str += randomCharacter;
    }

    return str;
  } else {
     return false;
  }
};

helpers.chargeStripe = function(source, amount, description, callback){
  amount = typeof(amount) == 'number' && amount > 0.5 ? amount : false;
  description = typeof(description) == 'string' && description.trim().length > 0 ? description.trim() : false;
  if(amount && description){
    var payload = {
      'amount' : amount*100,
      'currency' : 'usd',
      'description' : description,
      'source' : source
    };

    var stringPayload = querystring.stringify(payload);
    var requestDetails = {
      'protocol' : 'https:',
      'hostname' : 'api.stripe.com',
      'method' : 'POST',
      'path' : '/v1/charges',
      'headers': {
        'Authorization' : 'Bearer '+config.stripeSecret,
        'Content-Type' : 'application/x-www-form-urlencoded',
        'Content-Length' : Buffer.byteLength(stringPayload)
      }
    };

    var req = https.request(requestDetails, function(res){
      var status = res.statusCode;

      var decoder = new StringDecoder('utf-8');
      var buffer = '';

      res.on('data', function(data){
        buffer += decoder.write(data);
      });

      res.on('end', function(){
        buffer += decoder.end();

        if (status == 200 || status == 201){
          callback(false, buffer);
        } else {
          callback(true, buffer);
        }
      });
    });

    // Bind to error event
    req.on('error', function(e){
      callback(e);
    });


    req.write(stringPayload);
    req.end();



  } else {
    callback(false, {"Error" : "Required fields are missing"});
  }
};

module.exports = helpers;
