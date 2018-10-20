/*
* Create and export configuration variables

*/

// Container for all the environments
var environments = {};

environments.staging = {
  'envName' : 'staging',
  'hashingSecret' : 'thisIsASecrete',
  'stripeSecret' : 'sk_test_BbZgU9DZvNyOu6q5Bb2nSlsv',
  'stripeToken' : 'tok_mastercard',
  'stripeTokenError' : 'tok_chargeCustomerFail'
};

environments.production = {
  'envName': 'production',
  'hashingSecret' : 'thisIsAlsoASecret',
  'stripeSecret' : 'sk_test_BbZgU9DZvNyOu6q5Bb2nSlsv',
  'stripeToken' : 'tok_mastercard',
  'stripeTokenError' : 'tok_chargeCustomerFail'
};


// Which env was passed

var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : 'alala';

var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

module.exports = environmentToExport;
