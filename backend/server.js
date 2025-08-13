const express = require('express'); // Import express
const mongoose = require('mongoose'); // Import mongoose for MongoDB connection

const dotenv = require('dotenv');// Import dotenv for environment variable management
dotenv.config(); // Load environment variables from .env file

const cors = require('cors'); // Import cors for Cross-Origin Resource Sharing

const app = express(); // Create an instance of express, which will be the server 

const PORT = process.env.PORT || 5000; // Set the port to either the environment variable PORT or 5000

//Middleware
app.use(express.json()); // Middleware to parse JSON bodies
app.use(cors()); // Middleware to enable CORS, allowing cross-origin requests

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const roomRoutes = require('./routes/room');
app.use('/api/rooms', roomRoutes);



// Middleware is used to parse JSON in incoming requests, so you dont have to manually parse through data.

//Test route
app.get('/', (req, res) => {
    res.send('Study Group API is running'); // Send a response when the root URL is accessed
}
);

//Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`); // Log a message when the server starts
}
);

// Connect to MongoDB with improved error handling
const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGO_URI ? process.env.MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@') : 'Not found');
    
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    
    console.log('✅ Successfully connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    
    if (err.message.includes('ECONNREFUSED')) {
      console.log('💡 Suggestion: Make sure MongoDB is running locally on port 27017');
      console.log('   - Install MongoDB: https://www.mongodb.com/try/download/community');
      console.log('   - Or run with Docker: docker run --name mongodb -p 27017:27017 -d mongo:latest');
    } else if (err.message.includes('bad auth')) {
      console.log('💡 Suggestion: Check your MongoDB credentials in .env file');
    } else if (err.message.includes('network')) {
      console.log('💡 Suggestion: Check your network connection and MongoDB Atlas settings');
    }
    
    console.log('⚠️  Server will continue running but database operations will fail');
  }
};

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('📡 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('💥 MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('📴 Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('👋 MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error during graceful shutdown:', err);
    process.exit(1);
  }
});

// Connect to database
connectDB();


