// Database connection module using pg (node-postgres)

const { Pool } = require('pg');

 

// Use production config if DATABASE_URL is set, otherwise use local config

let config;

if (process.env.DATABASE_URL) {

    config = require('./config.production');

} else {

    try {

        config = require('./config');

    } catch (error) {

        console.error('⚠️  No config.js found. Using config.production.js');

        config = require('./config.production');

    }

}

 

// Create connection pool

const pool = new Pool(config);

 

// Test connection

pool.on('connect', () => {

    console.log('✅ Connected to PostgreSQL database');

});

 

pool.on('error', (err) => {

    console.error('❌ Unexpected database error:', err);

    process.exit(-1);

});

 

// Helper function to execute queries

async function query(text, params) {

    const start = Date.now();

    try {

        const res = await pool.query(text, params);

        const duration = Date.now() - start;

        console.log('Executed query', { text, duration, rows: res.rowCount });

        return res;

    } catch (error) {

        console.error('Database query error:', error);

        throw error;

    }

}

 

// Helper function to get a client from the pool (for transactions)

async function getClient() {

    const client = await pool.connect();

    const query = client.query.bind(client);

    const release = client.release.bind(client);

   

    // Set a timeout to release client after 5 seconds

    const timeout = setTimeout(() => {

        console.error('Client has been checked out for more than 5 seconds!');

    }, 5000);

   

    // Override release to clear timeout

    client.release = () => {

        clearTimeout(timeout);

        return release();

    };

   

    return client;

}

 

// Graceful shutdown

process.on('SIGINT', async () => {

    console.log('\nClosing database connections...');

    await pool.end();

    process.exit(0);

});

 

module.exports = {

    query,

    getClient,

    pool

};