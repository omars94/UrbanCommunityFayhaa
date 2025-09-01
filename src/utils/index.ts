import { Dimensions, Platform } from 'react-native';

// Device Utils
export const getScreenDimensions = () => {
  const { width, height } = Dimensions.get('window');
  return { width, height };
};

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

// String Utils
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Validation Utils
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

// Date Utils
export const formatDate = (date: Date, format: 'short' | 'long' = 'short'): string => {
  if (format === 'long') {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  return date.toLocaleDateString('en-US');
};

export const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return formatDate(date);
};

// Array Utils
export const removeDuplicates = <T>(array: T[], key?: keyof T): T[] => {
  if (!key) return [...new Set(array)];
  
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
};

// Async Utils
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Formats a Lebanese phone number to the format: +961 70 000 999
 * @param {string} phoneNumber - Raw phone number (e.g., "96170499810", "+96170499810")
 * @returns {string} - Formatted phone number
 */
export const formatLebanesePhone = (phoneNumber: string) => {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters
  let cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // Handle different input formats
  if (cleanNumber.startsWith('961')) {
    // Already has country code
    cleanNumber = cleanNumber;
  } else if (cleanNumber.startsWith('0')) {
    // Remove leading 0 and add country code
    cleanNumber = '961' + cleanNumber.substring(1);
  } else if (cleanNumber.length === 8) {
    // Just the local number, add country code
    cleanNumber = '961' + cleanNumber;
  }
  
  // Ensure we have the right length (961 + 8 digits = 11 total)
  if (cleanNumber.length !== 11 || !cleanNumber.startsWith('961')) {
    return phoneNumber; // Return original if can't format
  }
  
  // Format as +961 XX XXX XXX
  const countryCode = cleanNumber.substring(0, 3); // 961
  const firstPart = cleanNumber.substring(3, 5);   // 70
  const secondPart = cleanNumber.substring(5, 8);  // 499
  const thirdPart = cleanNumber.substring(8, 11);  // 810
  
  return `${thirdPart} ${secondPart} ${firstPart} ${countryCode}+ `;
};

export const validateLebaneseNumber = (number: string) => {
    const cleanedNumber = number.replace(/\D/g, '');

    if (cleanedNumber.length === 0) {
      return { isValid: false, message: 'يرجى إدخال رقم الهاتف' };
    }

    if (cleanedNumber.length !== 8) {
      return { isValid: false, message: 'رقم الهاتف يجب أن يتكون من 8 أرقام' };
    }

    const validPrefixes = ['03', '70', '71', '76', '78', '79', '81'];
    const prefix = cleanedNumber.substring(0, 2);

    if (!validPrefixes.includes(prefix)) {
      return {
        isValid: false,
        message: 'يرجى ادخال رقم لبناني صالح ',
      };
    }

    if (!/^\d+$/.test(cleanedNumber)) {
      return {
        isValid: false,
        message: 'يجب أن يحتوي رقم الهاتف على أرقام فقط',
      };
    }

    return { isValid: true, message: '' };
  };

