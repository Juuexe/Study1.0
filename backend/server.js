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

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection failed:', err));


