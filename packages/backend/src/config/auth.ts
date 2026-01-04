export const authConfig = {
  jwtSecret: (process.env.JWT_SECRET || 'your-secret-key-change-in-production') as string,
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN || '1h') as string,
  refreshTokenSecret: (process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret') as string,
  refreshTokenExpiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN || '7d') as string,
  bcryptRounds: 10 as number,
};
