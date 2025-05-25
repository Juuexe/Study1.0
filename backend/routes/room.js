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



// @route   POST /api/rooms/:roomId/join
// @desc    Join a room by ID
// @access  Private, no other user can see the room
router.post('/:roomId/join', authenticateToken, async (req, res) => {
    try {
        const { roomId } = req.params;

        // Find the room by its ID
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Check if the user is already in the room
        const alreadyInRoom = room.participants.includes(req.user.id);
        if (alreadyInRoom) {
            return res.status(400).json({ message: 'You already joined this room' });
        }

        // Add user to the participants list
        room.participants.push(req.user.id);
        await room.save();

        res.status(200).json({ message: 'You joined the room!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/rooms/:roomId/message
// @desc    Post a message to a specific room
// @access  Private no other user can see the message
router.post('/:roomId/message', authenticateToken, async (req, res) => {
    try {
        const { roomId } = req.params;
        const { content } = req.body;

        // Validate message content
        if (!content || content.trim() === "") {
            return res.status(400).json({ message: "Message cannot be empty" });
        }

        // Find the room
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Check if user is a participant
        if (!room.participants.includes(req.user.id)) {
            return res.status(403).json({ message: 'You must join the room first' });
        }

        // Add new message
        room.messages.push({
            sender: req.user.id,
            content
        });

        await room.save();

        res.status(201).json({ message: 'Message posted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/rooms/:roomId/messages
// @desc    Get all messages from a room
// @access  Private
router.get('/:roomId/messages', authenticateToken, async (req, res) => {
    try {
        const { roomId } = req.params;

        // Find room and populate sender usernames
        const room = await Room.findById(roomId) // Finds the room document by its ID
            .populate('messages.sender', 'username email') // only include these fields
           
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Check if user is a participant
        if (!room.participants.includes(req.user.id)) {
            return res.status(403).json({ message: 'You must join the room first' });
        }

        res.status(200).json(room.messages); // Send just the array of messages
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/rooms/:roomId/messages/:messageId
// @desc    Delete a message from a room (only if sender matches)
// @access  Private
router.delete('/:roomId/messages/:messageId', authenticateToken, async (req, res) => {
    try {
       let { roomId, messageId } = req.params;

// Just in case, remove quotes if they exist
roomId = roomId.replace(/['"]+/g, '');
messageId = messageId.replace(/['"]+/g, '');

console.log("Cleaned Room ID:", roomId);
console.log("Cleaned Message ID:", messageId);


        const room = await Room.findById(roomId);
        if (!room) return res.status(404).json({ message: 'Room not found' });

        // Find the message
        const messageIndex = room.messages.findIndex(msg => msg._id.toString() === messageId);
        if (messageIndex === -1) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Check if the current user is the sender
        const message = room.messages[messageIndex];
        if (message.sender.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You can only delete your own messages' });
        }

        // Remove message
        room.messages.splice(messageIndex, 1);
        await room.save();

        res.status(200).json({ message: 'Message deleted' });
   } catch (err) {
    console.error("DELETE error:", err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
}
});





