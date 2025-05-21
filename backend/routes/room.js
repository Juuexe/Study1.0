const express = require('express');
const router = express.Router();
const Room = require('../models/Room'); // Room model
const authenticateToken = require('../middleware/authMiddleware'); // JWT middleware

// @route   POST /api/rooms/create
// @desc    Create a new study room
// @access  Private (must be logged in)
router.post('/create', authenticateToken, async (req, res) => {
    try {
        const { name, description } = req.body;

        // Check if a room with the same name already exists
        const existingRoom = await Room.findOne({ name });
        if (existingRoom) {
            return res.status(400).json({ message: 'Room name already taken' });
        }

        // Create new room with creator as first participant
        const newRoom = new Room({
            name,
            description,
            participants: [req.user.id] // add current user
        });

        const savedRoom = await newRoom.save();

        res.status(201).json({
            message: 'Room created successfully',
            room: {
                id: savedRoom._id,
                name: savedRoom.name,
                description: savedRoom.description
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;



