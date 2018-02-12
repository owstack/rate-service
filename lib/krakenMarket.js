const Market = require('./_market');
const request = require('request-promise-native');
const _ = require('lodash');

class Kraken extends Market {
    constructor(config) {
        super(config);
        this.exchange = 'kraken';
        this.refreshRate = config.refreshRate || 5000;
    }

    async start() {
        console.log(`Polling ${this.exchange} ${this.pair}`);
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
        return request(`https://api.kraken.com/0/public/Depth?pair=${this.pair}&count=1000000`)
            .then((res) => {
                let data;
                try {
                    data = JSON.parse(res);
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

                this.orderbook.bids = bookToNumbers(data.result[this.pair].bids);
                this.orderbook.asks = bookToNumbers(data.result[this.pair].asks);

                return Promise.resolve();
            })
            .catch((err) => {
                console.error(err);
                return Promise.reject();
            });
    }
}

module.exports = Kraken;
