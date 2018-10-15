/*
Hadlers for API methods
*/

var _data = require('./data');
var helpers = require('./helpers');
var config = require('./config');

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

// Create a user
// Required fields: Name, password, email
// Optional: address
handlers._users.post = function(data, callback){
  // Validate data
  var regEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  var name = typeof(data.payload.name) == 'string' && data.payload.name.trim().length > 0 ? data.payload.name.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 3 ? data.payload.password.trim() : false;
  var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 && regEmail.test(data.payload.email.toLowerCase()) ? data.payload.email : false;
  var address = typeof(data.payload.address) == 'string' && data.payload.address.trim().length > 0 ? data.payload.address : '';
  console.log(data.payload.name);
  if (name && password && email){
    _data.read('users', email, function(err, data){
      if(err){
        // Hash the password
        var hashedPassword = helpers.hash(password);

        if(hashedPassword){
          var userObject = {
            'email' : email,
            'name' : name,
            'hashedPassword' : hashedPassword,
            'address' : address
          };

          _data.create('users', email, userObject, function(err){
            if(!err){
              callback(200);
            } else {
              console.log(err);
              callback(500, {'Error' : 'Could not create the new user'})
            }
          });
        } else {
          callback(500, {'Error' : 'Could not hash the user\'s password'})
        }

      } else {
        // User already exists
        callback(400, {'Error' : 'A user with this phone number already exists'});
      }
    });
  } else {
    callback(400, {'Error' : 'Missing required fields or they are invalid'});
    console.log(name, password, email);
  }
};

//Required data: email
handlers._users.get = function(data, callback){
  // Check that the email is valid
  var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false;
  if (email) {
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    handlers._tokens.verifyToken(token, email, function(tokenIsValid){
      if(tokenIsValid){
        _data.read('users', email, function(err, data){
          if(!err && data){
            // Remove the hashed password form object
            delete data.hashedPassword;
            callback(200, data);
          } else {
            callback(404);
          }
        });
      } else {
        callback(403, {'Error' : 'Missing required token in header, or token is expired'})
      }
    });

  } else {
    callback(400, {'Error' : 'Missing required field'});
  }
};


// Edit user info
// Required: email
// Optional: name or address
handlers._users.put = function(data, callback){
  var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email : false;
  var name = typeof(data.payload.name) == 'string' && data.payload.name.trim().length > 0 ? data.payload.name.trim() : false;
  var address = typeof(data.payload.address) == 'string' && data.payload.address.trim().length > 0 ? data.payload.address : '';

  if (email){
    if (name || address){
      var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
      handlers._tokens.verifyToken(token, email, function(tokenIsValid){
        if(tokenIsValid){
          _data.read('users', email, function(err, userData){
            if(!err && userData){
              if (name){
                userData.name = name;
              }
              if (address){
                userData.address = address;
              }

              _data.update('users', email, userData, function(err){
                if(!err){
                  callback(200);
                } else {
                  console.log(err);
                  callback(500, {'Error' : 'Could not update the user'});
                }
              });
            } else {
              callback(400, {'Error' : 'Specified user does not exist'});
            }
          });
        } else {
          callback(403, {'Error' : 'Missing required token in header, or token is expired'})
        }
      });

    } else {
      callback(400, {'Error' : 'You should pass something valid to edit'});
    }
  } else {
    callback(400, {'Error' : 'Missing required fields'});
  }
};

// @TODO users.delete

// Tokens
handlers.tokens = function(data, callback){
  var acceptableMethods = ['post', 'get', 'put', 'delete'];
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers._tokens = {};

// Required: email, password
// Optional: none
handlers._tokens.post = function(data, callback){
  var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  if (email && password){
    _data.read('users', email, function(err, userData){
      if(!err && userData){
        var hashedPassword = helpers.hash(password);
        if(hashedPassword == userData.hashedPassword){
           var tokenId = helpers.createRandomString(20);
           var expires = Date.now() + 1000*60*60;
           var tokenObject = {
             'email' : email,
             'id' : tokenId,
             'expires' : expires
           };

           _data.create('tokens', tokenId, tokenObject, function(err){
             if (!err){
               callback(200, tokenObject);
             } else {
               callback(500, {'Error' : 'Could not create a new token'});
             }
           });
        } else {
          callback(400, {'Error' : 'Password did not match the specified user\'s password '});
        }
      } else {
        callback(400, {'Error' : 'Could not find the specified user'});
      }
    });
  } else {
    callback(400, {'Error' : 'Missing required fields'});
  }
};


// Required data: id
// Optional: none
handlers._tokens.get = function(data, callback){
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    _data.read('tokens', id, function(err, tokenData){
      if(!err && tokenData){
        callback(200, tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, {'Error' : 'Missing required field'});
  }
};

// Required data: id, extend
// Optional data: none
handlers._tokens.put = function(data, callback){
  var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
  var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? data.payload.extend : false;

  if (id && extend){
    _data.read('tokens', id, function(err, tokenData){
      if(!err && tokenData){
        if(tokenData.expires > Date.now()) {
          tokenData.expires = Date.now() + 1000*60*60;
          _data.update('tokens', id, tokenData, function(err){
            if(!err){
              callback(200);
            } else {
              callback(500, {'Error' : 'Could not update the token\'s expiration'});
            }
          });
        } else {
          callback(400, {'Error' : 'The token has already expired and cannot be extended'});
        }
      } else {
        callback(400, {'Error' : 'Specified token does not exist'});
      }
    });
  } else {
    callback(400, {'Error' : 'Missing required fields or fields are invalid'});
  }
};

// Required data: email, tokenId
// Optional data: none
handlers._tokens.delete = function(data, callback){
  var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
  handlers._tokens.verifyToken(token, email, function(tokenIsValid){
    if(tokenIsValid){
      var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
      var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false;
      if (id && email) {

        _data.read('tokens', id, function(err, data){
          if(!err && data){
            _data.delete('tokens', id, function(err){
              if(!err){
                callback(200);
              } else {
                callback(500, {'Error' : 'Could not delete the specified token'});
              }
            });
          } else {
            callback(400, {'Error' : 'Could not found specified token'});
          }
        });
      } else {
        callback(400, {'Error' : 'Missing required field'});
      }
    } else {
      callback(403, {'Error' : 'Token is not valid'});
    }
};

// Verify if a given token id is valid for a given user
handlers._tokens.verifyToken = function(id, email, callback){
  _data.read('tokens', id, function(err, tokenData){
    if(!err && tokenData){
      if(tokenData.email == email && tokenData.expires > Date.now()){
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

module.exports = handlers;
