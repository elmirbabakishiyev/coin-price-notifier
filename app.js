require('dotenv').config();
const {StreamClient} = require("cw-sdk-node");
const logger = require('./logger')
const express = require('express')
const db = require('./dbutils')
const notification = require('./notification');

const api = express()
api.use(express.json())
let lockSet = new Set()
subscriptions = [];

const clientWs = new StreamClient({
    creds: {
        apiKey: process.env.API_KEY,
        secretKey: process.env.SECRET_KEY
    },
    subscriptions: subscriptions
});

clientWs.connect();

db.getAllMarkets().then((markets) => {
    logger.info(`Subscription result from db : ${markets}`);

    clientWs.subscribe(markets);
    clientWs.onMarketUpdate(marketData => {

        const incomingPrice = marketData.trades[0].price
        const incomingMarketId = marketData.market.id
        logger.info(`New update from websocket server - price: ${incomingPrice} | marketId: ${incomingMarketId}`);

        if (lockSet.has(incomingMarketId)) {
            logger.warn(`This marketId in process. Here is active process list: ${Array.from(lockSet.values())}`);
            return;
        }

        lockSet.add(incomingMarketId);
        db.getMarketData(incomingMarketId).then(subscriptions => {
            if (subscriptions.length == 0) {
                clientWs.unsubscribe(['markets:' + incomingMarketId + ':trades']);
                lockSet.delete(incomingMarketId)
                logger.warn(`Db result is empty for given marketId: ${incomingMarketId} , going to unsubscribe`);
                return;
            }
            subscriptions.forEach(subs => {
                if (subs.validtime == 0) {
                    logger.info(`No valid time - Last notification time: ${subs.last_notf}`);
                    return;
                }
                if ((subs.term === "lt" && subs.change_val > incomingPrice) || (subs.term === "gt" && subs.change_val < incomingPrice)) {
                    logger.info(`Incoming price: ${incomingPrice} Conditions on db: ${subs.term} Value on db: ${subs.change_val}`);
                    db.beforeNotfSent(subs.frequency, subs.id).then(() => {
                        notification.send(subs, incomingPrice).then(resp => {
                            logger.info(`Notification sent to ${subs.push_id} with ${resp.success}`);
                        });
                    });
                } else {
                    logger.info(`No match - Incoming price: ${incomingPrice}, Term: ${subs.term} Change_val: ${subs.change_val}`);
                }
            });
            lockSet.delete(incomingMarketId);
        });
    });
});

api.post('/addSubscription', function (req, res) {
    logger.info(`New api request | url: ${req.url} | body: ${JSON.stringify(req.body)}`);
    db.addSubscription(
        req.body.push_id,
        req.body.market_id,
        req.body.term,
        req.body.change_val,
        req.body.frequency,
        req.body.notf_interval
    ).then(result => {
        logger.info(`New subscription inserted to db : affectedRows ${result.affectedRows}`);
        subscriptions.push(`markets:${req.body.market_id}:trades`);
        logger.info(`New subscription to websocket server : ${subscriptions}`);
        clientWs.subscribe(subscriptions);
        res.status(200).json({"status": "success"});
    }).catch(error => {
        logger.error(`Exception occured on insert new subscription : ${error.message}`);
        res.status(500).json({"status": "error"});
    });
});

api.listen(process.env.PORT, () => {
    logger.info(`Starting App --> Server is up on port: ${process.env.PORT}`);
});