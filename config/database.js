module.exports = {
    development: {
        database: './data/app.db',
        dialect: 'sqlite'
    },
    production: {
        database: process.env.DATABASE_URL || './data/app.db',
        dialect: 'sqlite'
    }
};