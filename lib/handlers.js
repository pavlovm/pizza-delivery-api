/*
Hadlers for API methods
*/

var _data = require('./data');
var helpers = require('./helpers');

var handlers = {};

handlers.notFound = function(data, callback){
  callback(404);
};

handlers.users = function(data, callback){
  var availiableMethods = ['get', 'put', 'post', 'delete'];
  var requestedMethod = data.method;
  requestedMethod = typeof(requestedMethod) == 'string' && availiableMethods.indexOf(requestedMethod) > -1 ? requestedMethod : false;

  if(requestedMethod){
    handlers._users[data.method](data, callback);
  } else {
    callback(405, {'Error' : 'Wrong method passed'});
  }
};

handlers._users = {};


module.exports = handlers;
