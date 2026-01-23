import { IUser } from './user.types';

export interface ApiError {
  error: string;
}

export interface AuthResponse extends IUser {}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  type?: 'user' | 'editor' | 'admin';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}