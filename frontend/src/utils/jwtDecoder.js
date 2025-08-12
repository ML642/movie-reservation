/**
 * JWT Token Decoder Utility
 * Decodes JWT tokens to extract user information
 */

/**
 * Decode JWT token payload
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded payload or null if invalid
 */
export const decodeJWT = (token) => {
  try {
    if (!token) return null;
    
    // JWT has 3 parts separated by dots: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode the payload (second part)
    const payload = parts[1];
    
    // Add padding if needed for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    
    // Decode base64 and parse JSON
    const decodedPayload = JSON.parse(atob(paddedPayload));
    
    return decodedPayload;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

/**
 * Get user data from stored JWT token
 * @returns {object|null} - User data or null if no valid token
 */
export const getUserFromToken = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    const decoded = decodeJWT(token);
    if (!decoded) return null;
    
    // Check if token is expired
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      console.warn('JWT token has expired');
      localStorage.removeItem('token');
      return null;
    }
    
    return {
      id: decoded.id || decoded.userId || decoded.sub,
      name: decoded.name || decoded.username || decoded.displayName,
      email: decoded.email,
      avatar: decoded.avatar || decoded.picture,
      role: decoded.role,
      memberSince: decoded.memberSince || decoded.createdAt,
      // Add any other fields your JWT might contain
      ...decoded
    };
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
};

/**
 * Check if user is authenticated (has valid token)
 * @returns {boolean} - True if authenticated
 */
export const isAuthenticated = () => {
  const user = getUserFromToken();
  return user !== null;
};

/**
 * Get token expiration date
 * @returns {Date|null} - Expiration date or null
 */
export const getTokenExpiration = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) return null;
    
    return new Date(decoded.exp * 1000);
  } catch (error) {
    console.error('Error getting token expiration:', error);
    return null;
  }
};

/**
 * Check if token will expire soon (within next hour)
 * @returns {boolean} - True if expiring soon
 */
export const isTokenExpiringSoon = () => {
  try {
    const expiration = getTokenExpiration();
    if (!expiration) return false;
    
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    return expiration < oneHourFromNow;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return false;
  }
};
