const EventEmitter = require('events');
const config = require('../config');

const Market = {
    bitstamp: require('./bitstampMarket'),
    gdax: require('./gdaxMarket'),
    gemini: require('./geminiMarket'),
    kraken: require('./krakenMarket')
};

class Markets extends EventEmitter {
    constructor() {
        super();
        this.market = {};
    }

    async start() {
        const promises = [];
        const exchanges = config.get('exchanges');
        Object.keys(exchanges).forEach((exchangeName) => {
            exchanges[exchangeName].forEach((exPair) => {
                this.market[exPair.pair] = this.market[exPair.pair] || {};
                this.market[exPair.pair][exchangeName] = new Market[exchangeName](exPair);
                promises.push(this.market[exPair.pair][exchangeName].start());
            });
        });
        this.logInterval = setInterval(() => {
            console.log('Best market bids:');
            Object.keys(this.market).forEach((pair) => {
                console.log(`  ${pair}:`);
                Object.keys(this.market[pair]).forEach((exchangeName) => {
                    try {
                        const bestBid = this.market[pair][exchangeName].orderbook.bids[0][0].toFixed(2);
                        console.log(`    ${exchangeName}: \t${bestBid}`);
                    } catch (e) {
                        console.log(`    ${exchangeName}: \tUNAVAILABLE`);
                    }
                });
            });
        }, 60 * 1000);
        return Promise.all(promises);
    }

    async stop() {
        clearInterval(this.logInterval);
        const promises = [];
        const exchanges = config.get('exchanges');
        Object.keys(exchanges).forEach((exchangeName) => {
            Object.keys(exchanges[exchangeName]).forEach((pairName) => {
                promises.push(this.market[pairName][exchangeName].stop());
            });
        });
        return Promise.all(promises);
    }

    async restart() {
        await this.stop();
        await this.start();
    }

    getMarketBuyPrice(exchanges, pair, requestedQty) {
        const orderbook = this.getOrderBook(exchanges, pair);
        const currencies = config.get('currencies');
        const requestCurrencyCodes = pair.match(/.{1,3}/g);
        const quoteCurrency = currencies[requestCurrencyCodes[1].toUpperCase()];

        if (!orderbook.asks.length) {
            throw new Error(`Cannot quote buy price for ${this.exchange} ${this.pair}. Empty order book!`);
        }
        const maxQty = orderbook.asks.reduce((accumulator, currentValue) => {
            return accumulator + currentValue[1];
        });
        if (requestedQty > maxQty) {
            throw new Error(`Cannot quote buy price for amount: ${requestedQty} on ${exchanges} ${pair}, order book too shallow!`);
        }

        let totalQty = 0;
        let totalPrice = 0;

        for (var i = 0; i < orderbook.asks.length; i++) {
            const currentValue = orderbook.asks[i];
            const thisQty = Number(currentValue[1]);
            const thisPrice = Number(currentValue[0]);
            const thisTotalPrice = thisQty * thisPrice;

            if (totalQty < requestedQty) {
                const neededQty = requestedQty - totalQty;
                if (thisQty < neededQty) {
                    // take it all
                    totalPrice += thisTotalPrice;
                    totalQty += thisQty;
                } else {
                    // take only needed qty
                    totalQty += neededQty;
                    totalPrice += neededQty * thisPrice;
                }
            } else {
                break;
            }
        }
        console.log(`[debug] Quoted buy price ${requestedQty} @ ${(totalPrice / requestedQty).toFixed(quoteCurrency.decimal_digits)} = ${totalPrice.toFixed(quoteCurrency.decimal_digits)} for  on ${exchanges} ${pair}`);
        return totalPrice.toFixed(quoteCurrency.decimal_digits);
    }

    getMarketSellPrice(exchanges, pair, requestedQty) {
        const orderbook = this.getOrderBook(exchanges, pair);
        const currencies = config.get('currencies');
        const requestCurrencyCodes = pair.match(/.{1,3}/g);
        const quoteCurrency = currencies[requestCurrencyCodes[1].toUpperCase()];

        if (!orderbook.bids.length) {
            throw new Error(`Cannot quote sell price for ${exchanges} ${pair}. Empty order book!`);
        }
        const maxQty = orderbook.bids.reduce((accumulator, currentValue) => {
            return accumulator + currentValue[1];
        });
        if (requestedQty > maxQty) {
            throw new Error(`Cannot quote sell price for amount: ${requestedQty} on ${exchanges} ${pair}, order book too shallow!`);
        }

        let totalQty = 0;
        let totalPrice = 0;

        for (var i = 0; i < orderbook.bids.length; i++) {
            const currentValue = orderbook.bids[i];
            const thisQty = Number(currentValue[1]);
            const thisPrice = Number(currentValue[0]);
            const thisTotalPrice = thisQty * thisPrice;

            if (totalQty < requestedQty) {
                const neededQty = requestedQty - totalQty;
                if (thisQty < neededQty) {
                    // take it all
                    totalPrice += thisTotalPrice;
                    totalQty += thisQty;
                } else {
                    // take only needed qty
                    totalQty += neededQty;
                    totalPrice += neededQty * thisPrice;
                }
            } else {
                break;
            }
        }
        console.log(`[debug] Quoted sell price ${requestedQty} @ ${(totalPrice / requestedQty).toFixed(quoteCurrency.decimal_digits)} = ${totalPrice.toFixed(quoteCurrency.decimal_digits)} for  on ${exchanges} ${pair}`);
        return totalPrice.toFixed(quoteCurrency.decimal_digits);
    }

    getOrderBook(exchanges, pair) {
        if (exchanges.length === 1) {
            return this.market[pair][exchanges[0]].orderbook;
        }

        const sort = (data, sortOrder) => {
            let changeMultiplier = 1;
            if (sortOrder === 'desc') {
                changeMultiplier = -1;
            }
            return data.sort((a, b) => {
                if (Number(a[0]) < Number(b[0])) {
                    return -1 * changeMultiplier;
                } else if (Number(a[0]) > Number(b[0])) {
                    return 1 * changeMultiplier;
                }
                return 0;
            });
        };

        const virtualOrderbook = {
            asks: [],
            bids: []
        };

        Object.keys(this.market[pair]).forEach((exchangeName) => {
            if (exchanges.includes(exchangeName)) {
                virtualOrderbook.asks = virtualOrderbook.asks.concat(this.market[pair][exchangeName].orderbook.asks);
                virtualOrderbook.bids = virtualOrderbook.bids.concat(this.market[pair][exchangeName].orderbook.bids);
            }
        });

        virtualOrderbook.asks = sort(virtualOrderbook.asks, 'asc');
        virtualOrderbook.bids = sort(virtualOrderbook.bids, 'desc');

        return virtualOrderbook;
    }

    getConversionRate(exchanges, pair, requestedValue) {
        const requestCurrencyCodes = pair.match(/.{1,3}/g);
        const pairs = config.get('pairs');
        const currencies = config.get('currencies');
        if (!requestCurrencyCodes || requestCurrencyCodes.length !== 2) {
            throw new Error(`Invalid pair: ${pair}`);
        }
        const baseCurrency = currencies[requestCurrencyCodes[0].toUpperCase()];
        let totalQty = 0;

        if (pairs.indexOf(pair) < 0) {
            if (requestCurrencyCodes[0] === requestCurrencyCodes[1]) {
                totalQty = 1;
                return totalQty.toFixed(baseCurrency.decimal_digits);
            }
        }
        const orderbook = this.getOrderBook(exchanges, pair);
        if (!orderbook.bids.length) {
            throw new Error(`Cannot quote conversion rate for ${exchanges} ${pair}. Empty order book!`);
        }
        const maxValue = orderbook.bids.reduce((accumulator, currentValue) => {
            return accumulator + currentValue[0];
        });
        if (requestedValue > maxValue) {
            throw new Error(`Cannot quote conversion rate for value: ${requestedValue} on ${exchanges} ${pair}, order book too shallow!`);
        }

        let totalPrice = 0;

        for (var i = 0; i < orderbook.bids.length; i++) {
            const currentValue = orderbook.bids[i];
            const thisQty = Number(currentValue[1]);
            const thisPrice = Number(currentValue[0]);
            const thisTotalPrice = thisQty * thisPrice;

            if (totalPrice < requestedValue) {
                const neededValue = requestedValue - totalPrice;
                if (thisTotalPrice < neededValue) {
                    // take it all
                    totalPrice += thisTotalPrice;
                    totalQty += thisQty;
                } else {
                    // take only needed value
                    const qtyToTake = (neededValue / thisTotalPrice) * thisQty;
                    totalQty += qtyToTake;
                    totalPrice += neededValue;
                }
            } else {
                break;
            }
        }
        console.log(`[debug] Quoted conversion rate for ${requestedValue} @ ${(totalQty).toFixed(baseCurrency.decimal_digits)} on ${exchanges} ${pair}`);
        return totalQty.toFixed(baseCurrency.decimal_digits);
    }
}

module.exports = new Markets();
