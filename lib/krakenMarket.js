const Market = require('./_market');
const request = require('request-promise-native');
const _ = require('lodash');

class Kraken extends Market {
    constructor(config) {
        super(config);
        this.exchange = 'kraken';
        this.refreshRate = config.refreshRate || 10000;
    }

    async start() {
        this.interval = setInterval(() => {
            this._fetchMarketData();
        }, this.refreshRate);
        return this._fetchMarketData();
    }

    async stop() {
        clearInterval(this.interval);
        return Promise.resolve();
    }

    async _fetchMarketData() {
        return request(`https://api.kraken.com/0/public/Depth?pair=${this.alias}&count=1000000`)
            .then((res) => {
                let data;
                try {
                    data = JSON.parse(res);
                    if (!data.result) {
                        throw new Error(`Bad response: ${JSON.stringify(data)}`);
                    }
                } catch (e) {
                    console.error('Error parsing data', e);
                    return;
                }

                const bookToNumbers = (book) => {
                    const converted = [];
                    book.forEach((order) => {
                        converted.push([Number(order[0]), Number(order[1])]);
                    });
                    return converted;
                }

                this.orderbook.bids = bookToNumbers(data.result[this.alias].bids);
                this.orderbook.asks = bookToNumbers(data.result[this.alias].asks);

                return Promise.resolve();
            })
            .catch((err) => {
                console.error(err);
                return Promise.reject();
            });
    }
}

module.exports = Kraken;
