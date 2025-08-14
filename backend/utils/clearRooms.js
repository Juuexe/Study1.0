const mongoose = require('mongoose');
const Room = require('../models/Room');
require('dotenv').config();

const clearAllRooms = async () => {
    try {
        // Connect to MongoDB
        console.log('Attempting to connect to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        
        console.log('✅ Connected to MongoDB');

        // Delete all rooms
        const result = await Room.deleteMany({});
        console.log(`✅ Successfully deleted ${result.deletedCount} rooms`);

        // Close connection
        await mongoose.connection.close();
        console.log('✅ Database connection closed');
        
    } catch (error) {
        console.error('❌ Error clearing rooms:', error);
        process.exit(1);
    }
};

// Run the script
clearAllRooms();
