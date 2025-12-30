import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import { query } from '../database/connection';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { storageConfig } from '../config/storage';

export const uploadFile = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { entity_type, entity_id } = req.params;

    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    // Validate entity_type
    if (!['lubrication_point', 'replacement_schedule', 'part', 'maintenance_procedure', 'topic'].includes(entity_type)) {
      throw new AppError('Invalid entity type', 400);
    }

    // Fix filename encoding issue (Windows Japanese filenames)
    let fileName = req.file.originalname;
    try {
      // If the filename is incorrectly decoded, try to fix it
      // Convert from Latin-1 to UTF-8
      const buffer = Buffer.from(fileName, 'latin1');
      fileName = buffer.toString('utf8');
    } catch (err) {
      // If conversion fails, use original
      console.warn('Failed to convert filename encoding:', err);
    }

    // Insert attachment record
    const result = await query(
      `INSERT INTO attachments (entity_type, entity_id, file_name, file_path, file_size, mime_type, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        entity_type,
        entity_id,
        fileName,
        req.file.path,
        req.file.size,
        req.file.mimetype,
        req.user?.id,
      ]
    );

    const attachment = result.rows[0];

    res.status(201).json({
      success: true,
      data: {
        ...attachment,
        url: `/api/uploads/${attachment.id}`,
      },
    });
  } catch (error) {
    // Delete uploaded file if database insert fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

export const getFile = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM attachments WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('File not found', 404);
    }

    const attachment = result.rows[0];
    // Resolve file path relative to backend directory
    const filePath = path.isAbsolute(attachment.file_path)
      ? attachment.file_path
      : path.join(process.cwd(), attachment.file_path);

    console.log('File lookup:', {
      id,
      storedPath: attachment.file_path,
      resolvedPath: filePath,
      cwd: process.cwd(),
      exists: fs.existsSync(filePath)
    });

    if (!fs.existsSync(filePath)) {
      throw new AppError('File not found on disk', 404);
    }

    // Set CORS headers explicitly
    res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Set appropriate content type
    res.setHeader('Content-Type', attachment.mime_type || 'application/octet-stream');

    // Encode filename for proper display (RFC 5987 and fallback for older browsers)
    const encodedFilename = encodeURIComponent(attachment.file_name);
    const asciiFilename = attachment.file_name.replace(/[^\x00-\x7F]/g, '_'); // Fallback for ASCII-only
    res.setHeader('Content-Disposition', `inline; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`);

    res.sendFile(path.resolve(filePath));
  } catch (error) {
    next(error);
  }
};

export const getAttachmentsByEntity = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { entity_type, entity_id } = req.params;

    const result = await query(
      'SELECT * FROM attachments WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at DESC',
      [entity_type, entity_id]
    );

    const attachmentsWithUrls = result.rows.map(attachment => ({
      ...attachment,
      url: `/api/uploads/${attachment.id}`,
    }));

    res.json({
      success: true,
      data: attachmentsWithUrls,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFile = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM attachments WHERE id = $1 RETURNING file_path',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('File not found', 404);
    }

    const filePath = result.rows[0].file_path;

    // Delete file from disk
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
