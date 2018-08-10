const Market = require('./_market');
const request = require('request-promise-native');

class Bitstamp extends Market {
    constructor(config) {
        super(config);
        this.exchange = 'bitstamp';
        this.refreshRate = config.refreshRate || 10000;
    }

    async start() {
        console.log(`Polling ${this.exchange} ${this.pair} API every ${this.refreshRate}ms`);
        this.staleInterval = setInterval(() => {
            if (Date.now() - this.lastUpdated > this.staleTimeout) {
                console.warn(`${this.exchange} ${this.pair} STALE`);
            }
        }, this.staleTimeout);
        this.refreshInterval = setInterval(() => {
            this._fetchMarketData();
        }, this.refreshRate);
        this._fetchMarketData();
        return new Promise((resolve) => {
            this.once('snapshot', resolve);
        });
    }

    async stop() {
        clearInterval(this.staleInterval);
        clearInterval(this.refreshInterval);
        return Promise.resolve();
    }

    async _fetchMarketData() {
        let res;
        let data;
        try {
            res = await request(`https://www.bitstamp.net/api/v2/order_book/${this.pair}/`);
            data = JSON.parse(res);
        } catch (err) {
            console.error(err);
            return Promise.resolve();
        }

        const bookToNumbers = (book) => {
            const converted = [];
            book.forEach((order) => {
                converted.push([Number(order[0]), Number(order[1])]);
            });
            return converted;
        };

        this.orderbook.bids = bookToNumbers(data.bids);
        this.orderbook.asks = bookToNumbers(data.asks);

        this.lastUpdated = new Date();
        this.emit('snapshot');

        return Promise.resolve();
    }
}

module.exports = Bitstamp;
