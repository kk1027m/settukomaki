import { Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../database/connection';
import { authConfig } from '../config/auth';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const login = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { username, password } = req.body;

    // Find user
    const result = await query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid credentials', 401);
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw new AppError('Account is disabled', 403);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate tokens
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      authConfig.jwtSecret,
      { expiresIn: authConfig.jwtExpiresIn }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      authConfig.refreshTokenSecret,
      { expiresIn: authConfig.refreshTokenExpiresIn }
    );

    // Remove password from response
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        token,
        refreshToken,
        user: userWithoutPassword,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const result = await query(
      'SELECT id, username, email, role, full_name, is_active, created_at FROM users WHERE id = $1',
      [req.user?.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get current user
    const result = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user?.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const user = result.rows[0];

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isValidPassword) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, authConfig.bcryptRounds);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, req.user?.id]
    );

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const refreshAccessToken = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, authConfig.refreshTokenSecret) as any;

    // Get user
    const result = await query(
      'SELECT id, username, role FROM users WHERE id = $1 AND is_active = true',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found or inactive', 404);
    }

    const user = result.rows[0];

    // Generate new access token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      authConfig.jwtSecret,
      { expiresIn: authConfig.jwtExpiresIn }
    );

    res.json({
      success: true,
      data: { token },
    });
  } catch (error) {
    next(error);
  }
};
