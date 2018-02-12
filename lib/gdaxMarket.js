const Market = require('./_market');
const WebSocket = require('uws');
const _ = require('lodash');
const $ = require('highland');

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
            console.log(`Disconnected from ${this.exchange} websocket`);
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
                } catch (e) {
                    console.error('Error parsing data', e);
                    return;
                }

                if (data.type === 'heartbeat') {
                    this.lastHearbeat = {
                        sequence: data.sequence,
                        time: new Date(data.time)
                    }
                } else if (data.type === 'snapshot') {
                    const bookToNumbers = (book) => {
                        const converted = [];
                        book.forEach((order) => {
                            converted.push([Number(order[0]), Number(order[1])]);
                        });
                        return converted;
                    }

                    this.orderbook.bids = bookToNumbers(data.bids);
                    this.orderbook.asks = bookToNumbers(data.asks);
                } else if (data.type === 'l2update') {
                    data.changes.forEach((change) => {
                        push(null, change);
                    })
                } else if (data.type === 'subscriptions') {
                    // mute
                } else {
                    console.error('unexpected message', data);
                }
            });
        });
        this._changeStream.batchWithTimeOrCount(1000, 1000).each((changes) => {
            let sortBids = false;
            let sortAsks = false;

            let i = 0;
            const iMax = changes.length;

            for (; i < iMax; i++) {
                const change = changes[i];
                const side = change[0];
                const price = Number(change[1]);
                const qty = Number(change[2]);

                let changeArray;

                if (side === 'buy') {
                    changeArray = this.orderbook.bids;
                } else {
                    changeArray = this.orderbook.asks;
                }

                const changeIndex = _.findIndex(changeArray, (o) => {
                    return o[0] === price;
                });

                if (changeIndex > -1) {
                    if (qty === 0) {
                        changeArray = changeArray.splice(changeIndex, 1);
                    } else {
                        changeArray[changeIndex] = [price, qty];
                    }
                } else {
                    changeArray.push([price, qty]);
                    if (side === 'buy') {
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

            // console.log(`Processed ${changes.length} ${this.exchange} ${this.pair} changes`);
        });

    }
}

module.exports = Gdax;
