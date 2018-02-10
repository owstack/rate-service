const config = require('./config');
const polka = require('polka');
const market = {
    gdax: {
        btcusd: require('./lib/gdax/btcusd')
    }
};

market.gdax.btcusd.start();

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
