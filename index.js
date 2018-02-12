const config = require('./config');
const polka = require('polka');
const Bitstamp = require('./lib/class/bitstamp');
const Gdax = require('./lib/class/gdax');
const market = {
    bitstamp: {
        bchusd: new Bitstamp({
            pair: 'bchusd',
            takerFee: 0.25,
            baseCurrencyPrecision: 8,
            quoteCurrencyPrecision: 2
        }),
        btcusd: new Bitstamp({
            pair: 'btcusd',
            takerFee: 0.25,
            baseCurrencyPrecision: 8,
            quoteCurrencyPrecision: 2
        }),
        ethusd: new Bitstamp({
            pair: 'ethusd',
            takerFee: 0.25,
            baseCurrencyPrecision: 8,
            quoteCurrencyPrecision: 2
        }),
        ltcusd: new Bitstamp({
            pair: 'ltcusd',
            takerFee: 0.25,
            baseCurrencyPrecision: 8,
            quoteCurrencyPrecision: 2
        })
    },
    gdax: {
        bchusd: new Gdax({
            pair: 'BCH-USD',
            takerFee: 0.25,
            baseCurrencyPrecision: 8,
            quoteCurrencyPrecision: 2
        }),
        btcusd: new Gdax({
            pair: 'BTC-USD',
            takerFee: 0.25,
            baseCurrencyPrecision: 8,
            quoteCurrencyPrecision: 2
        }),
        ethusd: new Gdax({
            pair: 'ETH-USD',
            takerFee: 0.3,
            baseCurrencyPrecision: 18,
            quoteCurrencyPrecision: 2
        }),
        ltcusd: new Gdax({
            pair: 'LTC-USD',
            takerFee: 0.3,
            baseCurrencyPrecision: 8,
            quoteCurrencyPrecision: 2
        })
    }
};

const timer = setInterval(() => {
    console.log(`\n${new Date} Market Asks:`);
    console.log(`Bitstamp - BCH: $${market.bitstamp.bchusd.orderbook.asks[0][0].toFixed(2)} BTC: $${market.bitstamp.btcusd.orderbook.asks[0][0].toFixed(2)} ETH: $${market.bitstamp.ethusd.orderbook.asks[0][0].toFixed(2)} LTC: $${market.bitstamp.ltcusd.orderbook.asks[0][0].toFixed(2)}`);
    console.log(`GDAX     - BCH: $${market.gdax.bchusd.orderbook.asks[0][0].toFixed(2)} BTC: $${market.gdax.btcusd.orderbook.asks[0][0].toFixed(2)} ETH: $${market.gdax.ethusd.orderbook.asks[0][0].toFixed(2)} LTC: $${market.gdax.ltcusd.orderbook.asks[0][0].toFixed(2)}`);
}, 5000);
timer.unref();

Object.keys(market).forEach((marketName) => {
    Object.keys(market[marketName]).forEach((pairName) => {
        market[marketName][pairName].start();
    });
});

const getOrderBook = (req, res) => {
    const name = req.params.exchange;
    const pair = req.params.pair;
    console.log(`requested rate for ${req.params.exchange} ${req.params.pair}`);
    market[name][pair]
        .getOrderBook()
        .then((orderbook) => {
            res.end(JSON.stringify(orderbook, null, 2));
        })
        .catch((error) => {
            res.end(error);
        });
};

const getMarketSellPrice = (req, res) => {
    const name = req.params.exchange;
    const pair = req.params.pair;
    const amount = Number(req.params.amount);
    console.log(`requested sell quote for amount ${amount} from ${req.params.exchange} ${req.params.pair}`);
    const quote = market[name][pair].getMarketSellPrice(amount);
    res.end(JSON.stringify(quote));
};

const getMarketBuyPrice = (req, res) => {
    const name = req.params.exchange;
    const pair = req.params.pair;
    const amount = Number(req.params.amount);
    console.log(`requested sell quote for amount ${amount} from ${req.params.exchange} ${req.params.pair}`);
    const quote = market[name][pair].getMarketBuyPrice(amount);
    res.end(JSON.stringify(quote));
};

const getConversionRate = (req, res) => {
    const name = req.params.exchange;
    const pair = req.params.pair;
    const amount = Number(req.params.amount);
    console.log(`requested conversion rate for amount ${amount} from ${req.params.exchange} ${req.params.pair}`);
    const quote = market[name][pair].getConversionRate(amount);
    res.end(JSON.stringify(quote));
};

polka()
    .get('/orderbook/:exchange/:pair', getOrderBook)
    .get('/quote/sell/:exchange/:pair/:amount', getMarketSellPrice)
    .get('/quote/buy/:exchange/:pair/:amount', getMarketBuyPrice)
    .get('/convert/:exchange/:pair/:amount', getConversionRate)
    .listen(config.get('port'))
    .then(() => {
        console.log(`Listening on port ${config.get('port')}`);
    });
