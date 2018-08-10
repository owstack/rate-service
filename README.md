# Rate Service

### Market Data
This service keeps a synchronized copy of the order books for the following exchanges:

- Bitstamp
- Coinbase pro
- kraken
- Gemini

This service also optionally supports providing conversions to other currencies using OpenExchangeRates.org data. To enable this, set the environment variable OER_APP_ID and OER_REFRESH_MINUTES accordingly for your account type.

### API

This data is used to provide a REST API with the following features:

- GET orderbook for a supported exchange
- GET combined virtual orderbook across multiple supported exchanges
- GET quote for buy or sell price based on best market bids or asks
- GET conversion rates based on current market data ($300 USD = X BTC)

### Examples

```
# Get best ask price for BTC in USD
$curl http://localhost:3000/buy/gdax,gemini,bitstamp,kraken/btcusd/10
[
    {
        "symbol": "$",
        "name": "US Dollar",
        "symbol_native": "$",
        "decimal_digits": 2,
        "rounding": 0,
        "code": "USD",
        "name_plural": "US dollars",
        "rate": "64383.16"
    }
]

# Get best bid for ETH in USD
$ curl http://localhost:3000/sell/gdax,gemini,bitstamp/ethusd/10
[
    {
        "symbol": "$",
        "name": "US Dollar",
        "symbol_native": "$",
        "decimal_digits": 2,
        "rounding": 0,
        "code": "USD",
        "name_plural": "US dollars",
        "rate": "64339.60"
    }
]

# Get conversion rate for $1000 USD to BTC
$ curl http://localhost:3000/convert/gdax,gemini,bitstamp,kraken/btcusd/1000
{
    "rate": "0.09503057"
}
```

### Running with Docker

- Clone repo
- cd into dir and run `docker build .`
- Run resulting image. Example: `docker run 6ccf54d60907`

### Manual Installation

Clone this repo, and run `npm install && npm start`

### TODO
- Tests
- Stream data via SSE, Websocket
