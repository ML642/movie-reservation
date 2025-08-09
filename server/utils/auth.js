const jwt = require('jsonwebtoken');

/**
 * Decodes a JWT and returns the username.
 * @param {string} token - The JWT, optionally with a 'Bearer ' prefix.
 * @returns {string|null} The username, or null if the token is invalid or doesn't contain a username.
 */
const getUsernameFromToken = (token) => {
    if (!token) {
        return null;
    }

    try {
        // Remove 'Bearer ' prefix if it exists
        const tokenToVerify = token.startsWith('Bearer ') ? token.slice(7) : token;

        // Verify the token using the secret key
        const decoded = jwt.verify(tokenToVerify, process.env.JWT_SECRET || 'secret-key');
        
        // Return the username from the decoded payload
        return decoded.username;
    } catch (error) {
        // If the token is invalid (e.g., expired, malformed), an error will be thrown
        console.error('Failed to decode or verify token:', error.message);
        return null;
    }
};

module.exports = { getUsernameFromToken };
