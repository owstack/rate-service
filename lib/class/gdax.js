const Market = require('./market');
const WebSocket = require('uws');
const _ = require('lodash');
const $ = require('highland');

function sort(array, sortOrder) {
    let changeMultiplier = 1;
    if (sortOrder === 'desc') {
        changeMultiplier = -1;
    }
    array = array.sort((a, b) => {
        if (Number(a[0]) < Number(b[0])) {
            return -1 * changeMultiplier;
        } else if (Number(a[0]) > Number(b[0])) {
            return 1 * changeMultiplier;
        }
        return 0;
    });
}

class Gdax extends Market {
    constructor(config) {
        super(config);
        this.exchange = 'gdax';
    }

    async start() {
        this.ws = new WebSocket('wss://ws-feed.gdax.com');
        this.ws.on('open', () => {
            console.log(`Connected to ${this.exchange} ${this.pair} websocket`);
            this.connected = true;
            const subscriptionMessage = {
                type: 'subscribe',
                product_ids: [
                    this.pair
                ],
                channels: [
                    'level2',
                    'heartbeat'
                ]
            }
            this.ws.send(JSON.stringify(subscriptionMessage))
        });
        this.ws.on('close', () => {
            console.log(`${this.exchange} websocket disconnected`);
            this.connected = false;
            this.orderbook = {
                bids: [],
                asks: []
            }
        });
        this._changeStream = $((push, next) => {
            this.ws.on('message', (data) => {
                try {
                    data = JSON.parse(data);
                    if (data.type === 'heartbeat') {
                        this.lastHearbeat = {
                            sequence: data.sequence,
                            time: new Date(data.time)
                        }
                    } else if (data.type === 'snapshot') {
                        this.orderbook.bids = data.bids;
                        this.orderbook.asks = data.asks;
                        console.log(`${this.exchange} ${this.pair} bid: ${this.orderbook.bids[0][0]} ask: ${this.orderbook.asks[0][0]}`);
                    } else if (data.type === 'l2update') {
                        data.changes.forEach((change) => {
                            push(null, change);
                        })
                    } else if (data.type === 'subscriptions') {
                        // mute
                    } else {
                        console.error('unexpected message', data);
                    }
                } catch (e) {
                    console.error('Error parsing data', e);
                }
            });
        });
        this._changeStream.batchWithTimeOrCount(1000, 250).each((changes) => {
            let sortBids = false;
            let sortAsks = false;

            changes.forEach((change) => {
                const side = change[0];
                const price = change[1];
                const qty = change[2];

                let changeArray;

                if (side === 'buy') {
                    changeArray = this.orderbook.bids;
                } else {
                    changeArray = this.orderbook.asks;
                }

                const changeIndex = _.findIndex(changeArray, (o) => {
                    return Number(o[0]) === Number(price);
                });

                if (changeIndex > -1) {
                    if (Number(qty) === 0) {
                        // delete from array
                        changeArray = changeArray.splice(changeIndex, 1);
                    } else {
                        // update array
                        changeArray[changeIndex] = [Number(price).toFixed(this.quoteCurrencyPrecision), qty];
                    }
                } else {
                    // push into array
                    changeArray.push([Number(price).toFixed(this.quoteCurrencyPrecision), qty]);
                    if (side === 'buy') {
                        sortBids = true;
                    } else {
                        sortAsks = true;
                    }
                }
            });


            if (sortBids) {
                sort(this.orderbook.bids, 'desc');
            }
            if (sortAsks) {
                sort(this.orderbook.asks, 'asc');
            }

            // console.log(`Processed ${changes.length} ${this.exchange} ${this.pair} changes`);
        });
        this.timer = setInterval(() => {
            console.log(`${this.exchange} ${this.pair} bid: ${this.orderbook.bids[0][0]} ask: ${this.orderbook.asks[0][0]}`);
        }, 5000);
        this.timer.unref();
    }
}

module.exports = Gdax;
