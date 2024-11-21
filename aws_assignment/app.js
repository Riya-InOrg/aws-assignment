const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
require('dotenv').config(); // To load environment variables from .env file

const app = express();
const port = 5000;

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

// MySQL connection pool setup (using environment variables for sensitive data)
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'user',
    database: process.env.DB_NAME || 'simple_app',
    waitForConnections: true,
    connectionLimit: 10, // Customize as needed
    queueLimit: 0
});

// Helper function to query the database
const queryDatabase = (query, params) => {
    return new Promise((resolve, reject) => {
        db.query(query, params, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};

// Route for the home page (root URL)
app.get('/', (req, res) => {
    res.status(200).send('Hi, welcome to the home page');
});

// API Routes

// GET: Retrieve all users
app.get('/users', async (req, res) => {
    try {
        const results = await queryDatabase('SELECT * FROM users');
        res.status(200).json(results);
    } catch (err) {
        res.status(500).json({ error: 'Database query error: ' + err.message });
    }
});

// POST: Add a new user
app.post('/users', async (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) {
        return res.status(400).json({ message: 'Name and email are required' });
    }

    try {
        const results = await queryDatabase('INSERT INTO users (name, email) VALUES (?, ?)', [name, email]);
        res.status(201).json({ id: results.insertId, name, email });
    } catch (err) {
        res.status(500).json({ error: 'Database query error: ' + err.message });
    }
});

// DELETE: Remove a user by ID
app.delete('/users/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const results = await queryDatabase('DELETE FROM users WHERE id = ?', [userId]);

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Database query error: ' + err.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
