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
            'address' : address,
            'cart' : []
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
          callback(403, {'Error' : 'Missing required token in header, or token is expired'});
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
  });
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

handlers.menu = function(data, callback){
  var acceptableMethods = ['get'];
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._menu[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers._menu = {};

// Get menu object if authorized
handlers._menu.get = function(data,callback){
  var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
  var tokenIsValid = false;
  _data.read('tokens', token, function(err, tokenData){
    if(!err && tokenData){
      if(tokenData.expires > Date.now()){
        _data.read('menu', 'menu', function(err, menuData){
          if(!err && menuData){
            callback(200, menuData);
          } else {
            callback(400, {"Error" : "Can not read the menu"});
          }
        });
      } else {
        callback(403, {"Error" : "Token is expired"});
      }
    } else {
      callback(400, {"Error" : "Can not read token data"});
    }
  });
};

handlers.cart = function(data, callback){
  var acceptableMethods = ['put', 'delete'];
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._cart[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers._cart = {};

// Add item to the cart
// Required: token, itemsList
handlers._cart.put = function(data,callback){
  var itemsList = typeof(data.payload.itemsList) == 'object' && data.payload.itemsList.length > 0 ? data.payload.itemsList : false;
  var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
  if (token && itemsList){
    _data.read('tokens', token, function(err, tokenData){
      if(!err && tokenData){
        if(tokenData.expires > Date.now()){
          _data.read('users', tokenData.email, function(err, userData){
            if(!err && userData){
              // Check if item already in cart, then add +1
              if(userData.cart && userData.cart.length > 0){
                itemsList.forEach(function(newItem){
                  var itemAdded = false;
                  userData.cart.forEach(function(itemInCart){
                    if(newItem && itemInCart.id == newItem.id){
                      itemInCart.quantity += newItem.quantity;
                      itemAdded = true;
                    }
                  });
                  if(!itemAdded){
                    userData.cart.push(item);
                  }
                });
              } else {
                userData.cart = itemsList;
                console.log("Empty cart, add all items");
              }


              // Create newUserObject
              var newUserObject = {
                'email' : userData.email,
                'name' : userData.name,
                'hashedPassword' : userData.hashedPassword,
                'address' : userData.address,
                'cart' : userData.cart
              };

              // Update user
              _data.update('users', userData.email, newUserObject, function(err){
                if(!err){
                  callback(200, {"Success" : "Items added to the cart"});
                } else {
                  console.log(userData);
                  callback(400, {"Error" : "Cannot update user's cart"});
                }
              });
            } else {
              callback(403, {"Error" : "Can not read user data"});
            }
          });
        } else {
          callback(403, {"Error" : "Token is expired"});
        }
      } else {
        callback(403, {"Error" : "Can not read token data"});
      }
    });
  } else {
    callback(400, {"Error" : "Fields are missing"});
  }

};

handlers._cart.delete = function(data, callback){
  var itemsList = typeof(data.payload.itemsList) == 'object' && data.payload.itemsList.length > 0 ? data.payload.itemsList : false;
  var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
  if (token && itemsList){
    _data.read('tokens', token, function(err, tokenData){
      if(!err && tokenData){
        if(tokenData.expires > Date.now()){
          _data.read('users', tokenData.email, function(err, userData){
            if(!err && userData){
              // Check if item already in cart, then delete items
              if(userData.cart && userData.cart.length > 0){
                itemsList.forEach(function(deleteItem){
                  var itemDeleted = false;
                  userData.cart.forEach(function(itemInCart, index){
                    if(itemInCart.id == deleteItem.id){
                      if(itemInCart.quantity > deleteItem.quantity){
                        itemInCart.quantity -= deleteItem.quantity;
                        itemDeleted = true;
                      } else {
                        userData.cart.splice(index, 1);
                        itemDeleted = true;
                      }
                    }
                  });
                  if(!itemDeleted){
                    console.log("Can not find an item to delete");
                  }
                });

                // Create newUserObject
                var newUserObject = {
                  'email' : userData.email,
                  'name' : userData.name,
                  'hashedPassword' : userData.hashedPassword,
                  'address' : userData.address,
                  'cart' : userData.cart
                };

                // Update user
                _data.update('users', userData.email, newUserObject, function(err){
                  if(!err){
                    callback(200, {"Success" : "Items deleted from the cart"});
                  } else {
                    console.log(userData);
                    callback(400, {"Error" : "Cannot update user's cart"});
                  }
                });
              } else {
                console.log("Cart already empty");
                callback(200);
              }
            } else {
              callback(403, {"Error" : "Can not read user data"});
            }
          });
        } else {
          callback(403, {"Error" : "Token is expired"});
        }
      } else {
        callback(403, {"Error" : "Can not read token data"});
      }
    });
  } else {
    callback(400, {"Error" : "Fields are missing"});
  }

};

handlers.orders = function(data, callback){
  var acceptableMethods = ['post', 'get'];
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._orders[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers._orders = {};

// Create an order for user
// Required data: token
handlers._orders.post = function(data, callback){
  var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
  if (token){
    _data.read('tokens', token, function(err, tokenData){
      if(!err && tokenData){
        _data.read('users', tokenData.email, function(err, userData){
          if(!err && userData){
            if (typeof(userData.address) == 'string' && userData.address.trim().length > 10){

              var cost = 0;
              var items = [];

              _data.read('menu', 'menu', function(err, menuData){
                if(!err && menuData){
                  var menu = menuData;
                  userData.cart.forEach(function(cartItem){
                    var addedToOrder = false;
                    menu['items'].forEach(function(menuItem){
                      if(menuItem['id'] == cartItem['id']){
                        items.push(cartItem);
                        cost += menuItem['price'] * cartItem['quantity'];
                        addedToOrder = true;
                      }
                    });
                    if (!addedToOrder){
                      console.log("Couldn't add to order ", cartItem);
                    }

                  });
                  var orderObject = {
                    "id" : helpers.createRandomString(10),
                    "date" : Date.now(),
                    "status": "not_payed",
                    "cost" : cost,
                    "items" : items
                  };
                  if (cost > 0){
                    _data.create('orders', orderObject.id, orderObject, function(err){
                      if(!err){
                        callback(200, {"Success" : "Order has been placed"});
                      } else {
                        callback(500, {"Error" : err});
                      }
                    });
                  } else {
                    callback(400, {"Error" : "Orders is empty"});
                  }
                } else {
                  callback(400, {"Error" : "Cannot read menu data"});
                }
              });
            } else {
              callback(400, {"Error" : "User doesnt have an address"});
            }
          } else {
            callback(400, {"Error" : "Cannot read the user data"});
          }
        });
      } else {
        callback(403, {"Error" : "Cannot read the token or token is invalid"});
      }
    });
  } else {
    callback(403, {"Error" : "Token is not valid"});
  }
};


module.exports = handlers;
