/**
 * Secure Storage Utility
 * Handles localStorage with error handling
 */

class SecureStorage {
  setItem(key, value) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value);
        return true;
      }
    } catch (error) {
      console.error('Error setting item in localStorage:', error);
    }
    return false;
  }

  getItem(key) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(key);
      }
    } catch (error) {
      console.error('Error getting item from localStorage:', error);
    }
    return null;
  }

  removeItem(key) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(key);
        return true;
      }
    } catch (error) {
      console.error('Error removing item from localStorage:', error);
    }
    return false;
  }

  clear() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.clear();
        return true;
      }
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
    return false;
  }
}

export default new SecureStorage();

