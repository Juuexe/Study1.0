const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String, //Must be a text string
        required: true, // Field must be provided (can't be null/undefined)
        unique: true, // MongoDB will create an index ensuring no two users have the same username
        trim: true, // Automatically removes whitespace from beginning/end of strings
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
}, 
{ timestamps: true });  // createdAt: Date when the user document was first saved updatedAt: Date when the user document was last modified

module.exports = mongoose.model('User', UserSchema); // makes this model available to be imported in other files using require().