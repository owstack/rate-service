const nconf = require('nconf');

function Config() {
    nconf.argv().env(); // accept command line arguments and environment variables
    var environment = nconf.get('NODE_ENV') || 'development';
    nconf.file(environment, `./config/${environment.toLowerCase()}.json`);
}

Config.prototype.get = function (key) {
    return nconf.get(key);
};

module.exports = new Config();
