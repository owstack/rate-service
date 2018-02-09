class Market {
    constructor(config) {
        this.exchange = config.exchange;
        this.pair = config.pair;
        this.takerFee = config.takerFee;
        this.precision = config.precision;
        this.orderbook = {
            bids: [],
            asks: []
        }
        this.refreshRate = config.refreshRate;
    }

    async start() {
        this.interval = setInterval(() => {
            this.updateOrderBook();
        }, this.refreshRate);
        return this.updateOrderBook();
    }

    async stop() {
        clearInterval(this.interval);
        return Promise.resolve();
    }

    async getOrderBook() {
        console.log(`Getting order book for ${this.exchange} ${this.pair}`);
        return Promise.resolve(this.orderbook);
    }

    async updateOrderBook() {
        return Promise.resolve();
    }

    quotePrice(requestedQty) {
        if (!this.orderbook.bids.length) {
            throw new Error(`Cannot quote price for ${this.exchange} ${this.pair}. Empty order book!`);
        }
        const maxQty = this.orderbook.bids.reduce((accumulator, currentValue) => {
            return accumulator + currentValue[1];
        });
        if (requestedQty > maxQty) {
            throw new Error(`Cannot quote bid price for amount: ${requestedQty} on ${this.exchange} ${this.pair}, order book too shallow!`);
        }

        let totalQty = 0;
        let totalPrice = 0;

        for(var i = 0; i < this.orderbook.bids.length; i++) {
            const currentValue = this.orderbook.bids[i];
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
        };
        console.log(`Quoted ${requestedQty} @ ${(totalPrice / requestedQty).toFixed(this.precision)}${totalPrice.toFixed(this.precision)} for  on ${this.exchange} ${this.pair}`);
        return totalPrice.toFixed(this.precision);
    }
}

module.exports = Market;
