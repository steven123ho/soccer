// PostgreSQL Database Configuration - Production

// Uses environment variables from Railway/Heroku/etc.

 

const dbConfig = {

    // Railway/Heroku automatically provide DATABASE_URL

    connectionString: process.env.DATABASE_URL,

   

    // Or use individual environment variables

    host: process.env.DB_HOST || 'localhost',

    port: process.env.DB_PORT || 5432,

    database: process.env.DB_NAME || 'soccer_pickup',

    user: process.env.DB_USER || 'postgres',

    password: process.env.DB_PASSWORD,

   

    // Connection pool settings

    max: 20,

    idleTimeoutMillis: 30000,

    connectionTimeoutMillis: 2000,

   

    // SSL required for cloud databases

    ssl: process.env.NODE_ENV === 'production' ? {

        rejectUnauthorized: false

    } : false

};

 

module.exports = dbConfig;