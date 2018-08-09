const config = require('./config');
const polka = require('polka');

const markets = require('./lib/markets');

const getHandler = (req, res) => {
    const action = req.params.action;
    let exchange = req.params.exchange;
    if (exchange.indexOf(',') > -1) {
        exchange = exchange.split(',');
        exchange.clean('');
    }
    const pair = req.params.pair;
    const amount = Number(req.params.amount);
    let message = `[api] GET ${action} ${exchange} ${pair}`;
    if (amount) {
        message += ` ${amount}`;
    }
    console.log(message);
    res.setHeader('Content-Type', 'application/json');
    switch (action) {
        case 'buy':
            res.end(JSON.stringify({price: markets.getMarketBuyPrice(exchange, pair, amount)}, null, 4));
            break;
        case 'sell':
            res.end(JSON.stringify({price: markets.getMarketSellPrice(exchange, pair, amount)}, null, 4));
            break;
        case 'orderbook':
            res.end(JSON.stringify(markets.getOrderBook(exchange, pair), null, 4));
            break;
        case 'convert':
            res.end(JSON.stringify({price: markets.getConversionRate(exchange, pair, amount)}, null, 4));
            break;
        default:
            res.statusCode = 400;
            res.end(JSON.stringify({
                error: 'Invalid request'
            }));
    }
};

markets.start()
    .then(() => {
        return polka()
            .get('/:action/:exchange/:pair', getHandler)
            .get('/:action/:exchange/:pair/:amount', getHandler)
            .listen(config.get('port'));
    })
    .then(() => {
        console.log(`Listening on port ${config.get('port')}`);
    });
