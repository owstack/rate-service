const Market = require('./_market');
const Pusher = require('pusher-js');
const request = require('request-promise-native');
const _ = require('lodash');
const $ = require('highland');

class Bitstamp extends Market {
    constructor(config) {
        super(config);
        this.exchange = 'bitstamp';
    }

    async start() {
        this.socket = new Pusher('de504dc5763aeef9ff52', {
          enabledTransports: ['wss', 'ws'],
          disabledTransports: ['xhr_streaming']
        });
        this.socket.connection.bind('connected', () => {
            console.log(`Connected to ${this.exchange} ${this.pair} websocket`);
        });
        this.socket.connection.bind('disconnected', () => {
            console.error(`Disconnected from ${this.exchange} ${this.pair} websocket!`);
            this.orderbook = {
                bids: [],
                asks: []
            }
        });

        request(`https://www.bitstamp.net/api/v2/order_book/${this.pair}/`)
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

                this.orderbook.bids = bookToNumbers(data.bids);
                this.orderbook.asks = bookToNumbers(data.asks);
            });

        let subscribeTopic = 'diff_order_book';
        if (this.pair !== 'btcusd') {
            subscribeTopic += `_${this.pair}`;
        }
        this.channel = this.socket.subscribe(subscribeTopic);
        this.channel.bind('data', (data) => {
            const changes = [];
            let b = 0;
            const bMax = data.bids.length;
            for (; b < bMax; b++) {
                changes.push(['buy', data.bids[b][0], data.bids[b][1]]);
            }
            let a = 0;
            const aMax = data.asks.length;
            for (; a < aMax; a++) {
                changes.push(['sell', data.asks[a][0], data.asks[a][1]]);
            }

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

module.exports = Bitstamp;
