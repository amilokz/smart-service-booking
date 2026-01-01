const connection = require('../config/db');
const bcrypt = require('bcrypt');

// Register function
exports.register = async (req, res) => {
    const { email, password } = req.body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into database
    connection.query(
        'INSERT INTO users (email, password) VALUES (?, ?)',
        [email, hashedPassword],
        (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ message: 'Email already exists' });
                }
                return res.status(500).json({ message: 'Database error' });
            }
            res.status(201).json({ message: 'User registered successfully!' });
        }
    );
};

exports.login = (req, res) => {
    const { email, password } = req.body;

    connection.query(
        'SELECT * FROM users WHERE email = ?',
        [email],
        async (err, results) => {
            if (err) return res.status(500).json({ message: 'Database error' });
            if (results.length === 0)
                return res.status(400).json({ message: 'Email not found' });

            const user = results[0];
            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch)
                return res.status(400).json({ message: 'Incorrect password' });

            // ✅ SET SESSION
            req.session.user = { id: user.id, email: user.email };

            res.status(200).json({ message: 'Login successful!' });
        }
    );
};
