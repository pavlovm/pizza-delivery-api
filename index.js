/*
Pizza-Delivery API – initial file
*/

// Dependencies

var http = require('http');
var url = require('url');
var path = require('path');
var StringDecoder = require('string_decoder').StringDecoder;
var helpers = require('./lib/helpers');
var handlers = require('./lib/handlers');
var util = require('util');
var debug = util.debuglog('server');

// Start server and listen for requests

var server = http.createServer(function(req, res){

  // Get parameters from request
  var parsedUrl = url.parse(req.url, true);
  var path = parsedUrl.pathname;
  var trimmedPath = path.replace(/^\/+|\/+$/g, '');
  var queryStringObject = parsedUrl.query;

  var method = req.method.toLowerCase();
  var headers = req.headers;
  var decoder = new StringDecoder('utf-8');
  var buffer = '';

  req.on('data', function(data){
    buffer += decoder.write(data);
  });

  req.on('end', function(){
    buffer += decoder.end();

    // Looking for existing handler
    var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

    var data = {
      'trimmedPath' : trimmedPath,
      'queryStringObject' : queryStringObject,
      'method' : method,
      'headers' : headers,
      'payload' : helpers.parseJsonToObject(buffer)
    };
    console.log(data);

    chosenHandler(data, function(statusCode, payload){
      // Use default statuscode
      statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
      // Use payload called back by handler
      payload = typeof(payload) == 'object' ? payload : {};
      // Convert payload to a string
      var payloadString = JSON.stringify(payload);
      // Return the response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);
      // If response is 200, print green, otherwise print red
      if (statusCode == 200){
        console.log('\x1b[32m%s\x1b[0m', method.toUpperCase()+' /'+trimmedPath+' '+statusCode);
      } else {
        console.log('\x1b[31m%s\x1b[0m', method.toUpperCase()+' /'+trimmedPath+' '+statusCode);
      }
    });

  });



});
var router = {
  'users' : handlers.users,
  'tokens' : handlers.tokens,
  'menu' : handlers.menu,
  'cart' : handlers.cart,
  'orders': handlers.orders
};

server.listen(3000, function(){
  console.log('Server is listening on port 3000');
});
