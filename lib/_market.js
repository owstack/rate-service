const EventEmitter = require('events');

class Market extends EventEmitter {
    constructor(config) {
        super();
        this.exchange = config.exchange;
        this.alias = config.alias;
        this.pair = config.pair;
        this.takerFee = config.takerFee;
        this.baseCurrencyPrecision = config.baseCurrencyPrecision;
        this.quoteCurrencyPrecision = config.quoteCurrencyPrecision;
        this.orderbook = {
            bids: [],
            asks: []
        };
        this.refreshRate = config.refreshRate;
        this.lastUpdated = new Date(0);
        this.staleTimeout = Number(config.staleTimeout) || 60 * 1000;
    }

    async start() {
        return Promise.resolve();
    }

    async stop() {
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
}

module.exports = Market;
