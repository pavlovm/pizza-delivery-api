/*
Useful functions
*/


var helpers = {};

helpers.parseJsonToObject = function(str){
  try{
    var obj = JSON.parse(str);
    return obj;
  } catch(e){
    return {};
  }
};

module.exports = helpers;
