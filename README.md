# Rate Service

### Market Data
This service keeps a synchronized copy of the order books for the following exchanges:

- Bitstamp
- GDAX

### API

This data is used to provide a REST API with the following features:

- GET orderbook for a supported exchange
- GET combined virtual orderbook across multiple supported exchanges
- GET quote for buy or sell price based on best bids or asks
- GET conversion rates based on current market data ($300 USD = X BTC)

### Examples

```
# Get best ask price for BTC in USD
$curl http://localhost:3000/buy/gdax,gemini,bitstamp,kraken/btcusd/10
{
    "price": "104989.90"
}

# Get best bid for ETH in USD
$ curl http://localhost:3000/sell/gdax,gemini,bitstamp/ethusd/10
{
    "price": "8267.80"
}

# Get conversion rate for $1000 USD to BTC
$ curl http://localhost:3000/convert/gdax,gemini,bitstamp,kraken/btcusd/1000
{
    "price": "0.09503057"
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
