const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const connection = require('../config/db');

// ========== REGISTER ==========
router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ message: 'Email & Password required' });

    // Check if user exists
    connection.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        
        if (results.length > 0) return res.status(400).json({ message: 'Email already registered' });

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        connection.query(
            'INSERT INTO users (email, password, created_at) VALUES (?, ?, NOW())',
            [email, hashedPassword],
            (err, results) => {
                if (err) {
                    console.error('Insert error:', err);
                    return res.status(500).json({ message: 'Database error' });
                }

                // Auto-login: set session
                req.session.user = { 
                    id: results.insertId, 
                    email: email 
                };
                
                console.log('User registered and logged in:', req.session.user);
                res.status(200).json({ 
                    message: 'Registration successful!',
                    user: { email: email }
                });
            }
        );
    });
});

// ========== LOGIN ==========
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ message: 'Email & Password required' });

    connection.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        
        if (results.length === 0) return res.status(400).json({ message: 'Email not found' });

        const user = results[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ message: 'Incorrect password' });

        // Login success
        req.session.user = { 
            id: user.id, 
            email: user.email 
        };
        
        console.log('User logged in:', req.session.user);
        res.status(200).json({ 
            message: 'Login successful!',
            user: { email: user.email }
        });
    });
});

// ========== LOGOUT ==========
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully' });
    });
});

module.exports = router;