/*
* Create and export configuration variables

*/

// Container for all the environments
var environments = {};

environments.staging = {
  'envName' : 'staging',
  'hashingSecret' : 'thisIsASecrete',
};

environments.production = {
  'envName': 'production',
  'hashingSecret' : 'thisIsAlsoASecret',
};


// Which env was passed

var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : 'alala';

var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

module.exports = environmentToExport;
