const connection = require('./dbmysql');

const db = {
    getMarketData: async (market_id) => {
        const [rows] = await connection.execute(
            `select id,
                    market_id,
                    term,
                    change_val,
                    frequency,
                    push_id,
                    last_notf,
                    now() >= interval notf_interval minute + last_notf as 'validtime'
             from ${process.env.TABLE}
             where market_id = ?`,
            [market_id]
        );
        return rows;
    },
    getAllMarkets: async () => {
        const [results] = await connection.execute(
            `select distinct(market_id)
             from ${process.env.TABLE}`
        );
        return results.map((item) => `markets:${item.market_id}:trades`);
    },
    beforeNotfSent: async (frequency, id) => {
        frequency === 'onetime' && connection.execute(
            `delete
             from ${process.env.TABLE}
             where id = ?`,
            [id]
        );
        frequency === 'always' && connection.execute(
            `update ${process.env.TABLE}
             set last_notf=now()
             where id = ?`,
            [id]
        );
    },
    addSubscription: async (push_id, market_id, term, change_val, frequency, notf_interval) => {
        const [result] = await connection.execute(
            `insert into ${process.env.TABLE} (push_id, market_id, term, change_val, notf_interval, frequency)
             values (?, ?, ?, ?, ?, ?)`,
            [push_id, market_id, term, change_val, notf_interval, frequency]
        );
        return result;
    },
    getCoinInfo: async (marketId) => {
        const [rows] = await connection.execute(
            `select name, coin_id, img_thumb
             from coin_info
             where cryptowat_id = ?`,
            [marketId]
        );
        return rows[0];
    }
}

module.exports = db;