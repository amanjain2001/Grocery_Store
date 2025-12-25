/**
 * Format date to Indian Standard Time (IST)
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted date string in IST
 */
export const formatToIST = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // IST is UTC+5:30
  const options = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };
  
  const formatted = date.toLocaleString('en-IN', options);
  return `${formatted} IST`;
};

/**
 * Format date to IST with custom format
 * @param {string|Date} dateString - Date string or Date object
 * @param {object} options - Intl.DateTimeFormatOptions
 * @returns {string} Formatted date string
 */
export const formatToISTCustom = (dateString, options = {}) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  const defaultOptions = {
    timeZone: 'Asia/Kolkata',
    ...options
  };
  
  return date.toLocaleString('en-IN', defaultOptions);
};

/**
 * Get relative time in IST (e.g., "2 hours ago")
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Relative time string
 */
export const getRelativeTime = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
  
  return formatToIST(dateString);
};

