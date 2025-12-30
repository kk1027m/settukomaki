export interface User {
  id: number;
  username: string;
  email: string;
  password_hash?: string;
  role: 'admin' | 'user';
  full_name: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  full_name?: string;
}

export interface UpdateUserDto {
  email?: string;
  password?: string;
  role?: 'admin' | 'user';
  full_name?: string;
  is_active?: boolean;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: Omit<User, 'password_hash'>;
}
