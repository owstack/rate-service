const Market = require('./market');
const GdaxLib = require('gdax');
const gdaxPublic = new GdaxLib.PublicClient();

class Gdax extends Market {
    constructor(config) {
        super(config);
        this.exchange = 'gdax';
    }

    async start() {
        this.interval = setInterval(() => {
            this.updateOrderBook();
        }, this.refreshRate);
        return this.updateOrderBook();
    }

    async updateOrderBook() {
        try {
            this.orderbook = await gdaxPublic.getProductOrderBook(this.pair, {level: 2});
            console.log(`Updated order book ${this.exchange} ${this.pair} ${this.orderbook.bids[0][0]}`);
        } catch (e) {
            console.error(e);
            console.log(`Failed to update order book ${this.exchange} ${this.pair}`);
        }
        return this.orderbook;
    }
}

module.exports = Gdax;
