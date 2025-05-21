const mongoose = require('mongoose');

// Define the shape of a message (embedded inside a room)
const MessageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to sender
    content: { type: String, required: true }, // Text of the message
    timestamp: { type: Date, default: Date.now } // Auto-assign current time
});

// Define the Room schema
const RoomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId, // Users in the room
        ref: 'User'
    }],
    messages: [MessageSchema] // Chat messages in the room
}, { timestamps: true }); // Automatically adds createdAt, updatedAt fields

// Export the model so it can be used in routes
module.exports = mongoose.model('Room', RoomSchema);
