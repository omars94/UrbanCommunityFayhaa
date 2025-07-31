// Common Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  statusCode: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Navigation Types (to be extended based on your navigation structure)
export type RootStackParamList = {
  Home: undefined;
  Profile: { userId: string };
  Settings: undefined;
};

// Component Props Types
export interface BaseComponentProps {
  testID?: string;
  accessibilityLabel?: string;
}

// Form Types
export interface FormField {
  id: string;
  label: string;
  value: string;
  error?: string;
  required?: boolean;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
}
