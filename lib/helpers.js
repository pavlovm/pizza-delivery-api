/*
Useful functions
*/
// Dependencies
var crypto = require('crypto');
var https = require('https');
var querystring = require('querystring');
var config = require('./config');

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

module.exports = helpers;
