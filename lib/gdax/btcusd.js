const config = require('../config');
const Gdax = require('../class/gdax');

const gdaxBtcUsd = new Gdax({
    pair: 'BTC-USD',
    takerFee: 0.25,
    precision: 2,
    refreshRate: config.get('refreshRate')
});

module.exports = gdaxBtcUsd;
