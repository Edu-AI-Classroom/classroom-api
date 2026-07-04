import { registerAs } from '@nestjs/config';

export interface AgoraConfig {
  appId: string;
  appCertificate: string;
  channelPrefix: string;
  tokenTtlSeconds: number;
  sessionTtlSeconds: number;
}

function toPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export default registerAs(
  'agora',
  (): AgoraConfig => ({
    appId: process.env.AGORA_APP_ID ?? '',
    appCertificate: process.env.AGORA_APP_CERTIFICATE ?? '',
    channelPrefix: process.env.AGORA_CHANNEL_PREFIX ?? 'classroom',
    tokenTtlSeconds: toPositiveInt(process.env.AGORA_TOKEN_TTL_SECONDS, 3600),
    sessionTtlSeconds: toPositiveInt(
      process.env.AGORA_SESSION_TTL_SECONDS,
      86400,
    ),
  }),
);
