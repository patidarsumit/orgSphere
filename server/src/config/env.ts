const requireEnv = (name: string): string => {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

export const env = {
  jwtSecret: () => requireEnv('JWT_SECRET'),
  jwtRefreshSecret: () => requireEnv('JWT_REFRESH_SECRET'),
  jwtAccessExpires: () => process.env.JWT_ACCESS_EXPIRES || '15m',
  jwtRefreshExpires: () => process.env.JWT_REFRESH_EXPIRES || '7d',
}

