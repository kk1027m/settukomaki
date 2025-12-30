import { Response } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../database/connection';
import { authConfig } from '../config/auth';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const getUsers = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const result = await query(
      'SELECT id, username, email, role, full_name, is_active, created_at, updated_at FROM users ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT id, username, email, role, full_name, is_active, created_at, updated_at FROM users WHERE id = $1',
      [id]
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

export const createUser = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { username, email, password, role, full_name } = req.body;

    // Hash password
    const password_hash = await bcrypt.hash(password, authConfig.bcryptRounds);

    const result = await query(
      `INSERT INTO users (username, email, password_hash, role, full_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, role, full_name, is_active, created_at`,
      [username, email, password_hash, role, full_name || null]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    if (error.code === '23505') {
      next(new AppError('Username or email already exists', 409));
    } else {
      next(error);
    }
  }
};

export const updateUser = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { id } = req.params;
    const { email, role, full_name, is_active, password } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }

    if (role !== undefined) {
      updates.push(`role = $${paramCount++}`);
      values.push(role);
    }

    if (full_name !== undefined) {
      updates.push(`full_name = $${paramCount++}`);
      values.push(full_name);
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    if (password !== undefined) {
      const password_hash = await bcrypt.hash(password, authConfig.bcryptRounds);
      updates.push(`password_hash = $${paramCount++}`);
      values.push(password_hash);
    }

    if (updates.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE users SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, username, email, role, full_name, is_active, updated_at`,
      values
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

export const deleteUser = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (parseInt(id) === req.user?.id) {
      throw new AppError('Cannot delete your own account', 400);
    }

    // Soft delete by setting is_active to false
    const result = await query(
      'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
