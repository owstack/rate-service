const EventEmitter = require('events');
const math = require('mathjs');
const request = require('request-promise-native');

const config = require('../config');

class OpenExchangeRates extends EventEmitter {
    constructor() {
        super();
        this.currencies = config.get('currencies');
        this.appId = config.get('oer_app_id') || '';
        this.baseCurrency = 'USD';
        this.refreshRate = (Math.round(Number(config.get('oer_refresh_minutes'))) || 60) * 1000;
    }

    async start() {
        if (this.appId) {
            return this.poll();
        } else {
            console.warn('Forex currency exchange rates not available. Get an openexchangerates app id and set the env var OER_APP_ID to enable.');
            return;
        }
    }

    async poll() {
        this.refreshInterval = setInterval(() => {
            this._fetchExchangeRates();
        }, this.refreshRate);
        return this._fetchExchangeRates();
    }

    async stop() {
        clearInterval(this.refreshInterval);
        return;
    }

    async _fetchExchangeRates() {
        let res;
        let data;

        try {
            res = await request(`https://openexchangerates.org/api/latest.json?base=${this.baseCurrency}&app_id=${this.appId}`);
            data = JSON.parse(res);
            if (!data.rates) {
                throw new Error(`Bad response from openexchangerates.org: ${JSON.stringify(data)}`);
            }
        } catch (err) {
            console.error(err);
            return Promise.resolve();
        }

        this.exchangeRates = data.rates;
        this.emit('snapshot');
    }

    convert(usdPrice, targetCurrency) {
        const quotes = [];

        const baseCurrencyQuote =  Object.assign({}, this.currencies[this.baseCurrency]);
        baseCurrencyQuote.rate = usdPrice;
        quotes.push(baseCurrencyQuote);

        if (this.appId) {
            Object.keys(this.currencies).forEach((code) => {
                if (code !== this.baseCurrency && code !== targetCurrency && this.exchangeRates[code]) {
                    const currencyQuote =  Object.assign({}, this.currencies[code]);
                    currencyQuote.rate = math.number(math.multiply(usdPrice, math.bignumber(this.exchangeRates[code]))).toFixed(this.currencies[code].decimal_digits);
                    quotes.push(currencyQuote);
                }
            });
        }
        return quotes;
    }
}

module.exports = new OpenExchangeRates();
