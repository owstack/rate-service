const config = require('./config');
const polka = require('polka');

const markets = require('./lib/markets');
const forexRates = require('./lib/openexchangerates');

const startupTimeout = config.get('startupTimeoutSeconds') * 1000;
let started = false;

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
    const requestCurrencyCodes = pair.match(/.{1,3}/g);
    const targetCurrency = requestCurrencyCodes[0].toUpperCase();
    switch (action) {
        case 'buy':
            res.end(JSON.stringify(forexRates.convert(markets.getMarketBuyPrice(exchange, pair, amount), targetCurrency), null, 4));
            break;
        case 'sell':
            res.end(JSON.stringify(forexRates.convert(markets.getMarketSellPrice(exchange, pair, amount), targetCurrency), null, 4));
            break;
        case 'orderbook':
            res.end(JSON.stringify(markets.getOrderBook(exchange, pair), null, 4));
            break;
        case 'convert':
            res.end(JSON.stringify({rate: markets.getConversionRate(exchange, pair, amount)}, null, 4));
            break;
        default:
            res.statusCode = 400;
            res.end(JSON.stringify({
                error: 'Invalid request'
            }));
    }
};

async function start() {
    setTimeout(() => {
        if (!started) {
            console.log('Process not started after timeout', config.get('startupTimeoutSeconds'), 'seconds. Killing process.');
            process.exit(1);
        }
    }, startupTimeout);
    await Promise.all([
        forexRates.start(),
        markets.start()
    ]);
    await polka()
        .get('/:action/:exchange/:pair', getHandler)
        .get('/:action/:exchange/:pair/:amount', getHandler)
        .listen(config.get('port'));
    console.log(`Listening on port ${config.get('port')}`);
    started = true;
}

start();
