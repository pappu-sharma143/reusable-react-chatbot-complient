const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle client', err);
    process.exit(-1);
});

// Initialize database tables
const initDatabase = async () => {
    try {
        // Create conversations table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        user_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Create messages table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
        session_id VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        sender VARCHAR(50) NOT NULL,
        user_id INTEGER,
        image_urls TEXT[],
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Create complaints table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS complaints (
        id SERIAL PRIMARY KEY,
        ticket_id VARCHAR(100) UNIQUE NOT NULL,
        user_id INTEGER,
        complaint_title VARCHAR(255) NOT NULL,
        complaint_description TEXT NOT NULL,
        transaction_hash VARCHAR(255),
        image_urls TEXT[],
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Create index for faster queries
        await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);
      CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON complaints(user_id);
      CREATE INDEX IF NOT EXISTS idx_complaints_ticket_id ON complaints(ticket_id);
    `);

        console.log('✅ Database tables initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing database:', error);
        throw error;
    }
};

// Initialize on startup
initDatabase();

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};
