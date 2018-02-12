# Rate Service

This service keeps a synchronized copy of the order books for the following exchanges:

- Bitstamp
- GDAX

This data is used to provide a REST API with the following features:

- GET orderbook for a supported exchange
- GET combined orderbook for multiple exchanges
- Quote conversion rates based on current market data

### Running

Clone this repo, and run `npm start`

### TODO
- Provide ticker stream
- Configurable exchanges
- Tests
