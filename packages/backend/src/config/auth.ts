export const authConfig = {
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  bcryptRounds: 10,
};
