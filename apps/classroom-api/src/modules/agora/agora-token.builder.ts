import * as crypto from 'node:crypto';
import * as zlib from 'node:zlib';

const VERSION = '007';
const APP_ID_LENGTH = 32;

function encodeHmac(key: Buffer, message: Buffer): Buffer {
  return crypto.createHmac('sha256', key).update(message).digest();
}

class ByteBuf {
  private readonly buffer: Buffer;
  private position = 0;

  constructor(size = 1024) {
    this.buffer = Buffer.alloc(size);
    this.buffer.fill(0);
  }

  pack(): Buffer {
    const out = Buffer.alloc(this.position);
    this.buffer.copy(out, 0, 0, out.length);
    return out;
  }

  putUint16(value: number): this {
    this.buffer.writeUInt16LE(value, this.position);
    this.position += 2;
    return this;
  }

  putUint32(value: number): this {
    this.buffer.writeUInt32LE(value, this.position);
    this.position += 4;
    return this;
  }

  putInt16(value: number): this {
    this.buffer.writeInt16LE(value, this.position);
    this.position += 2;
    return this;
  }

  putBytes(bytes: Buffer): this {
    this.putUint16(bytes.length);
    bytes.copy(this.buffer, this.position);
    this.position += bytes.length;
    return this;
  }

  putString(value: string | Buffer): this {
    return this.putBytes(
      typeof value === 'string' ? Buffer.from(value, 'utf8') : value,
    );
  }

  putTreeMapUInt32(map?: Record<string, number>): this {
    const entries = Object.entries(map ?? {});
    this.putUint16(entries.length);
    for (const [key, value] of entries) {
      this.putUint16(Number(key));
      this.putUint32(value);
    }
    return this;
  }
}

class ReadByteBuf {
  private readonly buffer: Buffer;
  private position = 0;

  constructor(buffer: Buffer) {
    this.buffer = buffer;
  }

  getUint16(): number {
    const value = this.buffer.readUInt16LE(this.position);
    this.position += 2;
    return value;
  }

  getUint32(): number {
    const value = this.buffer.readUInt32LE(this.position);
    this.position += 4;
    return value;
  }

  getInt16(): number {
    const value = this.buffer.readInt16LE(this.position);
    this.position += 2;
    return value;
  }

  getString(): Buffer {
    const len = this.getUint16();
    const out = Buffer.alloc(len);
    this.buffer.copy(out, 0, this.position, this.position + len);
    this.position += len;
    return out;
  }

  getTreeMapUInt32(): Record<string, number> {
    const result: Record<string, number> = {};
    const len = this.getUint16();
    for (let index = 0; index < len; index += 1) {
      const key = this.getUint16();
      const value = this.getUint32();
      result[String(key)] = value;
    }
    return result;
  }

  pack(): Buffer {
    const out = Buffer.alloc(this.buffer.length - this.position);
    this.buffer.copy(out, 0, this.position, this.buffer.length);
    return out;
  }
}

abstract class Service {
  protected readonly privileges: Record<string, number> = {};

  protected constructor(private readonly type: number) {}

  serviceType(): number {
    return this.type;
  }

  addPrivilege(privilege: number, expire: number): void {
    this.privileges[String(privilege)] = expire;
  }

  protected packType(): Buffer {
    return new ByteBuf().putUint16(this.type).pack();
  }

  protected packPrivileges(): Buffer {
    return new ByteBuf().putTreeMapUInt32(this.privileges).pack();
  }

  pack(): Buffer {
    return Buffer.concat([this.packType(), this.packPrivileges()]);
  }

  abstract unpack(buffer: Buffer): ReadByteBuf;
}

const RTC_SERVICE_TYPE = 1;
const RTM_SERVICE_TYPE = 2;

export class ServiceRtc extends Service {
  static readonly kPrivilegeJoinChannel = 1;
  static readonly kPrivilegePublishAudioStream = 2;
  static readonly kPrivilegePublishVideoStream = 3;
  static readonly kPrivilegePublishDataStream = 4;

  constructor(
    private channelName: string,
    private uid: string,
  ) {
    super(RTC_SERVICE_TYPE);
    this.uid = uid === '0' ? '' : uid;
  }

  override pack(): Buffer {
    const payload = new ByteBuf()
      .putString(this.channelName)
      .putString(this.uid);
    return Buffer.concat([super.pack(), payload.pack()]);
  }

  override unpack(buffer: Buffer): ReadByteBuf {
    const reader = this.unpackService(buffer);
    this.channelName = reader.getString().toString('utf8');
    this.uid = reader.getString().toString('utf8');
    return reader;
  }

  private unpackService(buffer: Buffer): ReadByteBuf {
    const reader = new ReadByteBuf(buffer);
    reader.getTreeMapUInt32();
    return reader;
  }
}

export class ServiceRtm extends Service {
  static readonly kPrivilegeLogin = 1;

  constructor(private userId: string) {
    super(RTM_SERVICE_TYPE);
    this.userId = userId ?? '';
  }

  override pack(): Buffer {
    return Buffer.concat([
      super.pack(),
      new ByteBuf().putString(this.userId).pack(),
    ]);
  }

  override unpack(buffer: Buffer): ReadByteBuf {
    const reader = this.unpackService(buffer);
    this.userId = reader.getString().toString('utf8');
    return reader;
  }

  private unpackService(buffer: Buffer): ReadByteBuf {
    const reader = new ReadByteBuf(buffer);
    reader.getTreeMapUInt32();
    return reader;
  }
}

class AccessToken2 {
  private readonly salt: number;
  private readonly services = new Map<number, Service>();

  constructor(
    private appId: string,
    private appCertificate: string,
    private issueTs: number,
    private expire: number,
  ) {
    this.issueTs = issueTs || Math.floor(Date.now() / 1000);
    this.salt = Math.floor(Math.random() * 99_999_998) + 1;
  }

  addService(service: Service): void {
    this.services.set(service.serviceType(), service);
  }

  private buildSigningKey(): Buffer {
    const initial = encodeHmac(
      Buffer.from(this.appCertificate, 'utf8'),
      new ByteBuf().putUint32(this.issueTs).pack(),
    );
    return encodeHmac(initial, new ByteBuf().putUint32(this.salt).pack());
  }

  private isValidAppIdLike(value: string): boolean {
    return value.length === APP_ID_LENGTH && /^[0-9a-fA-F]+$/.test(value);
  }

  build(): string {
    if (
      !this.isValidAppIdLike(this.appId) ||
      !this.isValidAppIdLike(this.appCertificate) ||
      this.services.size === 0
    ) {
      return '';
    }

    const signingKey = this.buildSigningKey();

    let signingInfo = new ByteBuf()
      .putString(this.appId)
      .putUint32(this.issueTs)
      .putUint32(this.expire)
      .putUint32(this.salt)
      .putUint16(this.services.size)
      .pack();

    for (const service of this.services.values()) {
      signingInfo = Buffer.concat([signingInfo, service.pack()]);
    }

    const signature = encodeHmac(signingKey, signingInfo);
    const content = Buffer.concat([
      new ByteBuf().putString(signature).pack(),
      signingInfo,
    ]);
    const compressed = zlib.deflateSync(content);

    return `${VERSION}${compressed.toString('base64')}`;
  }
}

export interface BuildRtcTokenInput {
  appId: string;
  appCertificate: string;
  channelName: string;
  uid: number;
  tokenTtlSeconds: number;
  publish: boolean;
}

export function buildRtcToken(input: BuildRtcTokenInput): string {
  const builder = new AccessToken2(
    input.appId,
    input.appCertificate,
    Math.floor(Date.now() / 1000),
    input.tokenTtlSeconds,
  );

  const rtcService = new ServiceRtc(input.channelName, String(input.uid));
  rtcService.addPrivilege(
    ServiceRtc.kPrivilegeJoinChannel,
    input.tokenTtlSeconds,
  );

  if (input.publish) {
    rtcService.addPrivilege(
      ServiceRtc.kPrivilegePublishAudioStream,
      input.tokenTtlSeconds,
    );
    rtcService.addPrivilege(
      ServiceRtc.kPrivilegePublishVideoStream,
      input.tokenTtlSeconds,
    );
    rtcService.addPrivilege(
      ServiceRtc.kPrivilegePublishDataStream,
      input.tokenTtlSeconds,
    );
  }

  builder.addService(rtcService);

  const token = builder.build();
  if (!token) {
    throw new Error('Failed to build Agora RTC token');
  }

  return token;
}
