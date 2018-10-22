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
  'stripeTokenError' : 'tok_chargeCustomerFail',
  'mailgun': {
    'auth' : 'api:595b9f4e6bad7803b4a3815d0b76d4b2-a3d67641-09dd9018',
    'sender': 'mailgun@sandboxca35ce86113d40248f918e9a00cf3198.mailgun.org'
  }
};

environments.production = {
  'envName': 'production',
  'hashingSecret' : 'thisIsAlsoASecret',
  'stripeSecret' : 'sk_test_BbZgU9DZvNyOu6q5Bb2nSlsv',
  'stripeToken' : 'tok_mastercard',
  'stripeTokenError' : 'tok_chargeCustomerFail',
  'mailgun': {
    'auth' : 'api:595b9f4e6bad7803b4a3815d0b76d4b2-a3d67641-09dd9018',
    'sender': 'mailgun@sandboxca35ce86113d40248f918e9a00cf3198.mailgun.org'
  }
};


// Which env was passed

var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : 'alala';

var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

module.exports = environmentToExport;
