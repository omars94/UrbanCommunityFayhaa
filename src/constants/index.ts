// App Constants
export const APP_NAME = 'Urban Community Fayhaa';
export const APP_VERSION = '1.0.0';
export const APP_NAME_ARABIC = 'مجتمع حضري فيحاء';

// Colors - Based on your red theme
export const COLORS = {

  primary: '#239ebc',
  primaryDark: '#1b7a99',
  primaryLight:'#d6f5fcff',
  secondary: '#fdb614',
  secondaryLight: '#fcf2dbee',

  // secondaryDark: '#',
  red: '#d32f2f',
  
  // Status Colors
  success: '#2e7d32',
  warning: '#ea5c1f',
  danger: '#f44336',
  info: '#1976d2',
  
  // UI Colors
  white: '#FFFFFF',
  black: '#000000',
  background: '#f5f5f5',
  surface: '#ffffff',
  
  // Gray Scale
  gray: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  
  // Text Colors
  text: {
    primary: '#333333',
    secondary: '#666666',
    disabled: '#999999',
    hint: '#cccccc',
  },
  
  // Status Badge Colors
  status: {
    pending: {
      background: '#fff3cd',
      text: '#856404',
    },
    resolved: {
      background: '#d4edda',
      text: '#155724',
    },
    rejected: {
      background: '#f8d7da',
      text: '#721c24',
    },
    assigned: {
      background: '#cce7ff',
      text: '#004085',
    },
    completed: {
      background: '#e2e3e5',
      text: '#383d41',
    },
    denied: {
      background: '#f8d7da',
      text: '#721c24',
    }
  },
  
  // Role Badge Colors
  roles: {
    admin: {
      background: '#e8f5e8',
      text: '#2e7d32',
    },
    manager: {
      background: '#fff3e0',
      text: '#f57c00',
    },
    worker: {
      background: '#e3f2fd',
      text: '#1976d2',
    },
    citizen: {
      background: '#fce4ec',
      text: '#c2185b',
    },
    supervisor: {
      background: '#f5e4fcff',
      text: '#8918c2ff',
    }
  },
  
  // Special Colors
  location: '#ffebee',
  overlay: 'rgba(0,0,0,0.5)',
  shadow: 'rgba(0,0,0,0.1)',
  shadowDark: 'rgba(0,0,0,0.3)',
};

// User Roles
export const ROLES = {
  ADMIN: 1,
  MANAGER: 2,
  WORKER: 3,
  CITIZEN: 4,
  SUPERVISOR: 5,
}

// Gradients
export const GRADIENTS = {
  primary: 'linear-gradient(135deg, #d32f2f, #b71c1c)',
  secondary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  emergency: 'linear-gradient(135deg, #f44336, #d32f2f)',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 15,
  xl: 20,
  xxl: 30,
  xxxl: 50,
  huge: 65,
};

// Border Radius
export const BORDER_RADIUS = {
  xs: 3,
  sm: 6,
  md: 10,
  lg: 15,
  xl: 20,
  xxl: 30,
  circle: 50,
  phone: 40,
};

// Font Families
export const FONT_FAMILIES = {
  arabic: "'Amiri', serif",
  primary: "'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

// Font Sizes
export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  huge: 28,
  massive: 32,
  title: 48,
};

// Font Weights
export const FONT_WEIGHTS = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

// Shadows
export const SHADOWS = {
  sm: '0 2px 4px rgba(0,0,0,0.1)',
  md: '0 4px 15px rgba(0,0,0,0.1)',
  lg: '0 8px 25px rgba(0,0,0,0.15)',
  xl: '0 20px 40px rgba(0,0,0,0.3)',
  primary: '0 5px 15px rgba(211, 47, 47, 0.3)',
  header: '0 2px 10px rgba(0,0,0,0.1)',
  bottomNav: '0 -5px 20px rgba(0,0,0,0.1)',
  notification: '0 5px 15px rgba(0,0,0,0.2)',
};

// Screen Dimensions
export const SCREEN_DIMENSIONS = {
  phone: {
    width: 375,
    height: 812,
  },
  breakpoints: {
    small: 375,
    medium: 768,
    large: 1024,
  },
};

// Animation Durations
export const ANIMATIONS = {
  fast: '0.2s',
  normal: '0.3s',
  slow: '0.5s',
  spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

// Z-Index Levels
export const Z_INDEX = {
  base: 1,
  dropdown: 100,
  overlay: 1000,
  modal: 1500,
  notification: 2000,
  tooltip: 2500,
};

// Component Sizes
export const SIZES = {
  header: {
    height: 60,
  },
  bottomNav: {
    height: 80,
  },
  avatar: {
    sm: 40,
    md: 60,
    lg: 80,
  },
  logo: {
    sm: 60,
    md: 80,
    lg: 100,
  },
  floatingBtn: {
    width: 60,
    height: 60,
  },
  input: {
    height: 50,
  },
  button: {
    height: 50,
  },
};

// Route Names
export const ROUTE_NAMES = {
  SIGN_IN: 'Signin',
  OTP: 'Otp',
  HOME: 'Home',
  MAIN: 'Main',
  DASHBOARD: 'Dashboard',
  COMPLAINTS: 'Complaints',
  ADD_COMPLAINT: 'Add Complaint',
  COMPLAINT_DETAILS: 'Complaint Details',
  PROFILE: 'Profile',
  USERS: 'Users',
  ADD_USER: 'AddUser',
  ADD_MANAGER:'AddManager',
  ADD_WORKER:'AddWorker',
  ADD_SUPERVISOR:'AddSupervisor',
  ADD_USER_FORM:'AddUserForm',
  WASTE: 'Waste',
  SETTINGS: 'Settings',
  EMERGENCY: 'Emergency',
  LOCATION: 'Location',
};

// Complaint Status
export const COMPLAINT_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  REJECTED: 'rejected',
  RESOLVED: 'resolved',
  COMPLETED: 'completed',
  DENIED: 'denied',
};

export const COMPLAINT_STATUS_AR = {
  PENDING: 'قيد الانتظار',
  ASSIGNED: 'مُعيّنة',
  REJECTED: 'ملغاة',
  RESOLVED: 'محلولة',
  COMPLETED: 'مكتملة',
  DENIED: 'مرفوضة',
};

// Complaint Types
// export const COMPLAINT_TYPES = {
//   WASTE: 'waste',
//   WATER: 'water',
//   ELECTRICITY: 'electricity',
//   ROADS: 'roads',
//   SEWAGE: 'sewage',
//   NOISE: 'noise',
//   OTHER: 'other',
// };

// API Endpoints (if applicable)
// export const API_ENDPOINTS = {
//   BASE_URL: 'https://api.ucf.com',
//   AUTH: '/auth',
//   COMPLAINTS: '/complaints',
//   USERS: '/users',
//   UPLOAD: '/upload',
// };

// Storage Keys
export const STORAGE_KEYS = {
  USER_TOKEN: 'user_token',
  USER_DATA: 'user_data',
  LANGUAGE: 'app_language',
  THEME: 'app_theme',
};

// Languages
export const LANGUAGES = {
  ARABIC: 'ar',
  ENGLISH: 'en',
};

// Default Values
export const DEFAULTS = {
  LANGUAGE: LANGUAGES.ARABIC,
  ITEMS_PER_PAGE: 10,
  TIMEOUT: 30000, // 30 seconds
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
};

// Validation Rules
export const VALIDATION = {
  PHONE: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 15,
    PATTERN: /^[0-9+\-\s()]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 20,
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
  },
  DESCRIPTION: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 500,
  },
};

export default {
  APP_NAME,
  APP_VERSION,
  APP_NAME_ARABIC,
  COLORS,
  ROLES,
  GRADIENTS,
  SPACING,
  BORDER_RADIUS,
  FONT_FAMILIES,
  FONT_SIZES,
  FONT_WEIGHTS,
  SHADOWS,
  SCREEN_DIMENSIONS,
  ANIMATIONS,
  Z_INDEX,
  SIZES,
  ROUTE_NAMES,
  COMPLAINT_STATUS,
  COMPLAINT_STATUS_AR,
  // COMPLAINT_TYPES,
  // API_ENDPOINTS,
  STORAGE_KEYS,
  LANGUAGES,
  DEFAULTS,
  VALIDATION,
};
