
export const decodeJWT = (token) => {
  try {
    if (!token) return null;
    
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    
    const decodedPayload = JSON.parse(atob(paddedPayload));
    
    return decodedPayload;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

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
    console.log("Decoded JWT:", decoded);
    return {
      id: decoded.id || decoded.userId || decoded.sub,
      name: decoded.name || decoded.username || decoded.displayName,
      email: decoded.userEmail,
      avatar: decoded.avatar || decoded.picture,
      role: decoded.role,
      memberSince: decoded.memberSince || decoded.createdAt,
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
