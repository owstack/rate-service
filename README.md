# Rate Service

### Market Data
This service keeps a synchronized copy of the order books for the following exchanges:

- Bitstamp
- GDAX

### API

This data is used to provide a REST API with the following features:

- GET orderbook for a supported exchange
- GET conversion rates based on current market data ($300 USD = X BTC)

### Running with Docker

- Clone repo
- cd into dir and run `docker build .`
- Run resulting image. Example: `docker run 6ccf54d60907`

### Manual Installation

Clone this repo, and run `npm install && npm start`

### TODO
- GET combined orderbook for multiple exchanges
- Provide ticker stream
- Configurable exchanges
- Tests
- Stream data via SSE, Websocket
