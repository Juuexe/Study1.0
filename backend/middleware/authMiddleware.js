const jwt = require('jsonwebtoken'); //library to create and verify JSON Web Tokens, for authntication

// Middleware to check if request has a valid token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization']; // Get token from Authorization header
    const token = authHeader && authHeader.split(' ')[1]; // Format: 'Bearer <token>'

    if (!token) {
        return res.status(401).json({ message: 'No token provided' }); // Reject if no token
    }

    try {
        // Verify the token and decode it
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach user info to request object
        next(); // Token is valid, proceed to the actual route
    } catch (err) {
        console.error(err);
        return res.status(403).json({ message: 'Invalid token' }); // Token is wrong or expired
    }
};

module.exports = authenticateToken;
