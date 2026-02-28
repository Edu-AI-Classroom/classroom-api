import { registerAs } from '@nestjs/config';

export interface AuthConfig {
  jwt: {
    secret: string;
    expiresIn: string;
  };
}

export default registerAs(
  'auth',
  (): AuthConfig => ({
    jwt: {
      secret:
        process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
  }),
);
