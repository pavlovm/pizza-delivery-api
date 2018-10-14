/*
Hadlers for API methods
*/

var handlers = {};

handlers.notFound = function(data, callback){
  callback(404);
};

handlers.users = function(data, callback){
  callback(200);
};

module.exports = handlers;
