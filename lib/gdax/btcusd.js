const config = require('../../config');
const Gdax = require('../class/gdax');

const gdaxBtcUsd = new Gdax({
    pair: 'BTC-USD',
    takerFee: 0.25,
    baseCurrencyPrecision: 2,
    quoteCurrencyPrecision: 8,
    refreshRate: config.get('refreshRate')
});

module.exports = gdaxBtcUsd;
