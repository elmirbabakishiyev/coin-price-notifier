const axios = require("axios");
const db = require("./dbutils");

let notification = {
  alert: {
    title: "",
    text: "",
    targetUrl: "",
    web: {
      buttons: [
        {
          label: "Open",
          action: "link",
          targetUrl: "",
        },
      ],
    },
  },
};

const notf = {
  send: async (subs, newPrice) => {
    const coin = await db.getCoinInfo(subs.market_id);
    const url = `https://yourwebsite.com/coins/${coin.coin_id}`;

    notification.alert.title = `${coin.name} price ${
      subs.term == "gt" ? "increased to" : "decreased to"
    } $${newPrice}`;
    notification.alert.text = `You have set notification for price of ${
      coin.name
    } ${subs.term == "up" ? "greater than" : "less than"} $${subs.change_val}`;
    notification.alert.targetUrl = url;
    notification.alert.web.buttons[0].targetUrl = url;

    return (
      await axios.post(process.env.WONDERPUSH_API_URL, {
        accessToken: process.env.WONDERPUSH_API_KEY,
        notification: notification,
        targetInstallationIds: subs.push_id,
      })
    ).data;
  },
};

module.exports = notf;
