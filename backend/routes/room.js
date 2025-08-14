const express = require('express');
const router = express.Router();
const Room = require('../models/Room'); // Room model
const authenticateToken = require('../middleware/authMiddleware'); // JWT middleware

// Simple in-memory rate limiting for messages (in production, use Redis)
const messageLimitMap = new Map();
const MESSAGE_LIMIT = 10; // messages per minute
const LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds

// Rate limiting middleware for message posting
const rateLimitMessages = (req, res, next) => {
    const userId = req.user.id;
    const now = Date.now();
    
    if (!messageLimitMap.has(userId)) {
        messageLimitMap.set(userId, { count: 1, resetTime: now + LIMIT_WINDOW });
        return next();
    }
    
    const userLimit = messageLimitMap.get(userId);
    
    if (now > userLimit.resetTime) {
        // Reset the limit window
        messageLimitMap.set(userId, { count: 1, resetTime: now + LIMIT_WINDOW });
        return next();
    }
    
    if (userLimit.count >= MESSAGE_LIMIT) {
        return res.status(429).json({ 
            message: `Rate limit exceeded. You can only send ${MESSAGE_LIMIT} messages per minute.`,
            retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
        });
    }
    
    userLimit.count++;
    next();
};

// Clean up rate limit map periodically (every 5 minutes)
setInterval(() => {
    const now = Date.now();
    for (const [userId, limit] of messageLimitMap.entries()) {
        if (now > limit.resetTime + LIMIT_WINDOW) {
            messageLimitMap.delete(userId);
        }
    }
}, 5 * 60 * 1000);

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
            participants: [req.user.id], // add current user
            creator: req.user.id 
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

router.delete('/:roomId', authenticateToken, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    if (room.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the creator can delete this room' });
    }

    await room.deleteOne();
    res.status(200).json({ message: 'Room deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


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
router.post('/:roomId/message', authenticateToken, rateLimitMessages, async (req, res) => {
    try {
        const { roomId } = req.params;
        const { content } = req.body;

        // Enhanced message validation
        if (!content || typeof content !== 'string') {
            return res.status(400).json({ message: "Message content is required and must be a string" });
        }
        
        const trimmedContent = content.trim();
        if (trimmedContent === "") {
            return res.status(400).json({ message: "Message cannot be empty" });
        }
        
        if (trimmedContent.length > 1000) {
            return res.status(400).json({ message: "Message is too long (max 1000 characters)" });
        }
        
        // Basic profanity filter (you can enhance this)
        const bannedWords = ['spam', 'abuse']; // Add more as needed
        const containsBannedWord = bannedWords.some(word => 
            trimmedContent.toLowerCase().includes(word.toLowerCase())
        );
        
        if (containsBannedWord) {
            return res.status(400).json({ message: "Message contains inappropriate content" });
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

        // Add new message with sanitized content
        const newMessage = {
            sender: req.user.id,
            content: trimmedContent
        };
        
        room.messages.push(newMessage);
        await room.save();
        
        // Get the saved message with populated sender info for response
        const savedRoom = await Room.findById(roomId)
            .populate('messages.sender', 'username email');
        
        const savedMessage = savedRoom.messages[savedRoom.messages.length - 1];

        res.status(201).json({ 
            message: 'Message posted successfully',
            messageData: savedMessage
        });
    } catch (err) {
        console.error('Message posting error:', err);
        res.status(500).json({ message: 'Server error while posting message' });
    }
});

// @route   GET /api/rooms/:roomId/messages
// @desc    Get messages from a room with pagination support
// @access  Private
router.get('/:roomId/messages', authenticateToken, async (req, res) => {
    try {
        const { roomId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Max 100 messages per request
        const skip = (page - 1) * limit;

        // Find room and populate sender usernames
        const room = await Room.findById(roomId)
            .populate('messages.sender', 'username email');
           
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Check if user is a participant
        if (!room.participants.includes(req.user.id)) {
            return res.status(403).json({ message: 'You must join the room first' });
        }

        // Sort messages by timestamp (newest first) and apply pagination
        const sortedMessages = room.messages
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(skip, skip + limit)
            .reverse(); // Reverse to show oldest first in the paginated result

        const totalMessages = room.messages.length;
        const totalPages = Math.ceil(totalMessages / limit);
        
        res.status(200).json({
            messages: sortedMessages,
            pagination: {
                currentPage: page,
                totalPages,
                totalMessages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                limit
            }
        });
    } catch (err) {
        console.error('Get messages error:', err);
        res.status(500).json({ message: 'Server error while fetching messages' });
    }
});

// @route   GET /api/rooms
// @desc    Get all rooms with creator info
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate('creator', 'username email')
      .populate('participants', 'username email');
    res.json(rooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/rooms/:roomId
// @desc    Get specific room details
// @access  Private
router.get('/:roomId', authenticateToken, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId)
      .populate('creator', 'username email')
      .populate('participants', 'username email');
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/rooms/clear-all
// @desc    Clear all rooms (admin function) - requires confirmation
// @access  Private
router.delete('/clear-all', authenticateToken, async (req, res) => {
  try {
    // Require confirmation to prevent accidental deletions
    const { confirm } = req.body;
    if (confirm !== 'DELETE_ALL_ROOMS') {
      return res.status(400).json({ 
        message: 'Confirmation required. Send { "confirm": "DELETE_ALL_ROOMS" } in request body to proceed.',
        warning: 'This action will permanently delete ALL rooms and cannot be undone.'
      });
    }
    
    const result = await Room.deleteMany({});
    console.log(`🧹 User ${req.user.id} cleared ${result.deletedCount} rooms`);
    
    res.status(200).json({ 
      message: `Successfully cleared ${result.deletedCount} rooms`,
      deletedCount: result.deletedCount 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/rooms/:roomId/messages/:messageId
// @desc    Edit a message in a room (only if sender matches)
// @access  Private
router.put('/:roomId/messages/:messageId', authenticateToken, rateLimitMessages, async (req, res) => {
    try {
        let { roomId, messageId } = req.params;
        const { content } = req.body;

        // Clean parameters
        roomId = roomId.replace(/['"]+/g, '');
        messageId = messageId.replace(/['"]+/g, '');

        // Validate new content (same validation as posting)
        if (!content || typeof content !== 'string') {
            return res.status(400).json({ message: "Message content is required and must be a string" });
        }
        
        const trimmedContent = content.trim();
        if (trimmedContent === "") {
            return res.status(400).json({ message: "Message cannot be empty" });
        }
        
        if (trimmedContent.length > 1000) {
            return res.status(400).json({ message: "Message is too long (max 1000 characters)" });
        }

        const room = await Room.findById(roomId);
        if (!room) return res.status(404).json({ message: 'Room not found' });

        // Check if user is a participant
        if (!room.participants.includes(req.user.id)) {
            return res.status(403).json({ message: 'You must join the room first' });
        }

        // Find the message
        const messageIndex = room.messages.findIndex(msg => msg._id.toString() === messageId);
        if (messageIndex === -1) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Check if the current user is the sender
        const message = room.messages[messageIndex];
        if (message.sender.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You can only edit your own messages' });
        }

        // Check if message is too old to edit (5 minutes)
        const messageAge = Date.now() - message.timestamp.getTime();
        const maxEditAge = 5 * 60 * 1000; // 5 minutes
        if (messageAge > maxEditAge) {
            return res.status(403).json({ message: 'Message is too old to edit (max 5 minutes)' });
        }

        // Update message content
        room.messages[messageIndex].content = trimmedContent;
        room.messages[messageIndex].editedAt = new Date();
        
        await room.save();

        // Get the updated message with populated sender info
        const updatedRoom = await Room.findById(roomId)
            .populate('messages.sender', 'username email');
        
        const updatedMessage = updatedRoom.messages[messageIndex];

        res.status(200).json({ 
            message: 'Message updated successfully',
            messageData: updatedMessage
        });
    } catch (err) {
        console.error("EDIT error:", err.message);
        res.status(500).json({ message: 'Server error while editing message', error: err.message });
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

        // Check if user is a participant
        if (!room.participants.includes(req.user.id)) {
            return res.status(403).json({ message: 'You must join the room first' });
        }

        // Find the message
        const messageIndex = room.messages.findIndex(msg => msg._id.toString() === messageId);
        if (messageIndex === -1) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Check if the current user is the sender or room creator
        const message = room.messages[messageIndex];
        const isOwner = message.sender.toString() === req.user.id;
        const isCreator = room.creator.toString() === req.user.id;
        
        if (!isOwner && !isCreator) {
            return res.status(403).json({ message: 'You can only delete your own messages (or all messages if you created the room)' });
        }

        // Remove message
        room.messages.splice(messageIndex, 1);
        await room.save();

        res.status(200).json({ message: 'Message deleted successfully' });
   } catch (err) {
        console.error("DELETE error:", err.message);
        res.status(500).json({ message: 'Server error while deleting message', error: err.message });
    }
});





