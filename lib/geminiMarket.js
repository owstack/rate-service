const Market = require('./_market');
const WebSocket = require('uws');
const _ = require('lodash');

class Gemini extends Market {
    constructor(config) {
        super(config);
        this.exchange = 'gemini';
    }

    async start() {
        this.staleInterval = setInterval(() => {
            if (Date.now() - this.lastUpdated > this.staleTimeout) {
                console.log(`${this.exchange} ${this.pair} STALE`);
            }
        }, this.staleTimeout);
        this.ws = new WebSocket(`wss://api.gemini.com/v1/marketdata/${this.pair}`);
        this.ws.on('open', () => {
            console.log(`Connected to ${this.exchange} ${this.pair} websocket`);
            this.connected = true;
        });
        this.ws.on('close', () => {
            console.log(`Disconnected from ${this.exchange} websocket`);
            this.connected = false;
            this.orderbook = {
                bids: [],
                asks: []
            };
        });
        this.ws.on('message', this._messageHandler.bind(this));
        return new Promise((resolve, reject) => {
            this.once('snapshot', resolve);
            this.once('error', reject);
        });
    }

    async stop() {
        clearInterval(this.staleInterval);
        this.ws.close();
        return Promise.resolve();
    }

    _messageHandler(data) {
        try {
            data = JSON.parse(data);
        } catch (e) {
            console.error('Error parsing data', e);
            this.emit('error', e);
            return;
        }

        if (data.type === 'update') {
            let sortBids = false;
            let sortAsks = false;

            const changes = data.events;
            let i = 0;
            const iMax = changes.length;
            for (; i < iMax; i++) {
                const change = changes[i];
                if (change.type === 'trade') {
                    return;
                }
                if (change.type !== 'change') {
                    console.log(`Got unknown change type ${change.type}`);
                    return;
                }
                const price = Number(change.price);
                const qty = Number(change.remaining);
                const side = `${change.side}s`;

                const changeIndex = _.findIndex(this.orderbook[side], (o) => {
                    return o[0] === price;
                });

                if (changeIndex > -1) {
                    if (qty === 0) {
                        this.orderbook[side] = this.orderbook[side].splice(changeIndex, 1);
                    } else {
                        this.orderbook[side][changeIndex] = [price, qty];
                    }
                } else {
                    this.orderbook[side].push([price, qty]);
                    if (side === 'bids') {
                        sortBids = true;
                    } else {
                        sortAsks = true;
                    }
                }
            }

            if (sortBids) {
                this._sortBids();
            }
            if (sortAsks) {
                this._sortAsks();
            }

            this.lastUpdated = new Date();
            this.emit('snapshot');
        }
    }
}

module.exports = Gemini;
