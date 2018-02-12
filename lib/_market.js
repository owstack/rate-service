const EventEmitter = require('events');

class Market extends EventEmitter {
    constructor(config) {
        super();
        this.exchange = config.exchange;
        this.pair = config.pair;
        this.takerFee = config.takerFee;
        this.baseCurrencyPrecision = config.baseCurrencyPrecision;
        this.quoteCurrencyPrecision = config.quoteCurrencyPrecision;
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

    _sort(side, sortOrder) {
        let changeMultiplier = 1;
        if (sortOrder === 'desc') {
            changeMultiplier = -1;
        }
        this.orderbook[side] = this.orderbook[side].sort((a, b) => {
            if (Number(a[0]) < Number(b[0])) {
                return -1 * changeMultiplier;
            } else if (Number(a[0]) > Number(b[0])) {
                return 1 * changeMultiplier;
            }
            return 0;
        });
    }

    _sortBids() {
        this._sort('bids', 'desc');
    }

    _sortAsks() {
        this._sort('asks', 'asc');
    }

    getMarketSellPrice(requestedQty) {
        if (!this.orderbook.bids.length) {
            throw new Error(`Cannot quote sell price for ${this.exchange} ${this.pair}. Empty order book!`);
        }
        const maxQty = this.orderbook.bids.reduce((accumulator, currentValue) => {
            return accumulator + currentValue[1];
        });
        if (requestedQty > maxQty) {
            throw new Error(`Cannot quote sell price for amount: ${requestedQty} on ${this.exchange} ${this.pair}, order book too shallow!`);
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
        }
        console.log(`Quoted sell price ${requestedQty} @ ${(totalPrice / requestedQty).toFixed(this.baseCurrencyPrecision)} = ${totalPrice.toFixed(this.baseCurrencyPrecision)} for  on ${this.exchange} ${this.pair}`);
        return totalPrice.toFixed(this.baseCurrencyPrecision);
    }

    getMarketBuyPrice(requestedQty) {
        if (!this.orderbook.asks.length) {
            throw new Error(`Cannot quote buy price for ${this.exchange} ${this.pair}. Empty order book!`);
        }
        const maxQty = this.orderbook.asks.reduce((accumulator, currentValue) => {
            return accumulator + currentValue[1];
        });
        if (requestedQty > maxQty) {
            throw new Error(`Cannot quote buy price for amount: ${requestedQty} on ${this.exchange} ${this.pair}, order book too shallow!`);
        }

        let totalQty = 0;
        let totalPrice = 0;

        for(var i = 0; i < this.orderbook.asks.length; i++) {
            const currentValue = this.orderbook.asks[i];
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
        console.log(`Quoted buy price ${requestedQty} @ ${(totalPrice / requestedQty).toFixed(this.baseCurrencyPrecision)} = ${totalPrice.toFixed(this.baseCurrencyPrecision)} for  on ${this.exchange} ${this.pair}`);
        return totalPrice.toFixed(this.baseCurrencyPrecision);
    }

    getConversionRate(requestedValue) {
        if (!this.orderbook.bids.length) {
            throw new Error(`Cannot quote conversion rate for ${this.exchange} ${this.pair}. Empty order book!`);
        }
        const maxValue = this.orderbook.bids.reduce((accumulator, currentValue) => {
            return accumulator + currentValue[0];
        });
        if (requestedValue > maxValue) {
            throw new Error(`Cannot quote conversion rate for value: ${requestedValue} on ${this.exchange} ${this.pair}, order book too shallow!`);
        }

        let totalQty = 0;
        let totalPrice = 0;

        for(var i = 0; i < this.orderbook.bids.length; i++) {
            const currentValue = this.orderbook.bids[i];
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
        console.log(`Quoted conversion rate for ${requestedValue} @ ${(totalQty).toFixed(this.quoteCurrencyPrecision)} on ${this.exchange} ${this.pair}`);
        return totalQty.toFixed(this.quoteCurrencyPrecision);
    }
}

module.exports = Market;
