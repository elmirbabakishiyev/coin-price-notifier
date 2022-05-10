# Coin Price Notifier

Application sends WEB push notifications to users based on conditions they define over provided API endpoint.
It gets coin prices from cryptowat.ch WebSocket API and sends push notifications over WonderPush.

https://cryptowat.ch
https://www.wonderpush.com

Mentioned environment variables need to be configured:

```
API_KEY='test'
SECRET_KEY='test'
DBHOST='test.host.net'
DBUSER='user'
PASSWORD='password'
DATABASE='db'
```

# Start application

node app.js

if you are using pm2:

pm2 start app.js

# API endpoints

Endpoint: /addSubscription
Method: POST
Body:

```json
{
  "installation_id": 5895,
  "market_id": 579,
  "condition": "lt",
  "value": 40000,
  "frequency": "always"
}
```

```
installation_id - wonderpush installation over registered on browser
market_id       - cryptowat market id
condition       - condition to send notification: lt (less than) and gt (greater than)
value           - coin price to subscribe for
frequency       - always: send notification after certain time non-stopping, onetime: send notifcation once and clear subscription
```
