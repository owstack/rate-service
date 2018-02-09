const config = require('./lib/config');
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

const getQuote = (req, res) => {
    const name = req.params.exchange;
    const pair = req.params.pair;
    const amount = Number(req.params.amount);
    console.log(`requested quote for amount ${amount} from ${req.params.exchange} ${req.params.pair}`);
    const quote = market[name][pair].quotePrice(amount);
    res.end(JSON.stringify(quote));
};

polka()
    .get('/orderbook/:exchange/:pair', getOrderBook)
    .get('/quote/:exchange/:pair/:amount', getQuote)
    .listen(config.get('port'))
    .then(() => {
        console.log(`Listening on port ${config.get('port')}`);
    });
