// PostgreSQL Database Configuration

// FILL IN YOUR DATABASE DETAILS BELOW

 

const dbConfig = {

    // ⚠️ REPLACE THESE WITH YOUR ACTUAL DATABASE CREDENTIALS ⚠️

   

    host: 'localhost',              // Your PostgreSQL host

    port: 5432,                     // PostgreSQL port

    database: 'soccer_pickup',      // Your database name

    user: 'postgres',               // Your PostgreSQL username

    password: 'your_password_here', // ⚠️ CHANGE THIS!

   

    // Connection pool settings

    max: 20,

    idleTimeoutMillis: 30000,

    connectionTimeoutMillis: 2000,

   

    // SSL (set to true if required by your database)

    ssl: false

};

 

module.exports = dbConfig;

 