const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register Route
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
        });

        const savedUser = await newUser.save();

        // Create JWT token
        const token = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET, {
            expiresIn: '1d',
        });

        res.status(201).json({
            user: {
                id: savedUser._id,
                username: savedUser.username,
                email: savedUser.email,
            },
            token,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

// Login Route
router.post('/login', async (req, res) => {
    try {
        // Get email and password from the request body
        const { email, password } = req.body;

        // Look up user by email
        const user = await User.findOne({ email });
        if (!user) {
            // If user is not found, return error
            return res.status(400).json({ message: 'Invalid credentials (email)' });
        }

        // Compare input password with hashed password stored in DB
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            // If passwords don't match, return error
            return res.status(400).json({ message: 'Invalid credentials (password)' });
        }

        // If login is successful, create a JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '1d', // Token expires in 1 day
        });

        // Respond with user info and token
        res.status(200).json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
            token,
        });

    } catch (err) {
        // Catch any server-side error
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

