const nconf = require('nconf');

Array.prototype.clean = function (deleteValue) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == deleteValue) {
            this.splice(i, 1);
            i--;
        }
    }
    return this;
};

function Config() {
    nconf.argv() // accept command line arguments
        .env({
            lowerCase: true,
            whitelist: ['port', 'oer_app_id', 'oer_refresh_minutes']
        })   //  accept environment variables
        .file('currencies', './config/currencies.json')
        .file('exchanges', './config/exchanges.json')
        .file('./config/defaults.json');
}

Config.prototype.get = function (key) {
    return nconf.get(key);
};

module.exports = new Config();
