const Market = require('./_market');
const request = require('request-promise-native');

class Kraken extends Market {
    constructor(config) {
        super(config);
        this.exchange = 'kraken';
        this.refreshRate = config.refreshRate || 10000;
    }

    async start() {
        console.log(`Polling ${this.exchange} ${this.pair} via REST every ${this.refreshRate}ms`);
        this.interval = setInterval(() => {
            this._fetchMarketData();
        }, this.refreshRate);
        this._fetchMarketData();
        return new Promise((resolve) => {
            this.once('snapshot', resolve);
        });
    }

    async stop() {
        clearInterval(this.interval);
        return Promise.resolve();
    }

    async _fetchMarketData() {
        let res;
        let data;
        try {
            res = await request(`https://api.kraken.com/0/public/Depth?pair=${this.alias}&count=1000000`);
            data = JSON.parse(res);
            if (!data.result) {
                throw new Error(`Bad response: ${JSON.stringify(data)}`);
            }
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

        this.orderbook.bids = bookToNumbers(data.result[this.alias].bids);
        this.orderbook.asks = bookToNumbers(data.result[this.alias].asks);

        this.emit('snapshot');

        return Promise.resolve();
    }
}

module.exports = Kraken;
