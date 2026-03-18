import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface QdrantSearchHit {
  id: string;
  score: number;
  payload?: Record<string, unknown>;
}

interface QdrantSearchItem {
  id: string | number;
  score?: number;
  payload?: Record<string, unknown>;
}

@Injectable()
export class QdrantService implements OnModuleInit {
  private readonly logger = new Logger(QdrantService.name);
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly collection: string;
  private readonly vectorSize: number;
  private readonly strictBootstrap: boolean;

  constructor(private readonly config: ConfigService) {
    const normalizedUrl = this.normalizeEnvValue(
      this.config.get<string>('QDRANT_URL'),
    );
    const normalizedApiKey = this.normalizeEnvValue(
      this.config.get<string>('QDRANT_API_KEY') ??
        this.config.get<string>('QDRANT_APIKEY') ??
        this.config.get<string>('QDRANT_KEY'),
    );
    const normalizedCollection = this.normalizeEnvValue(
      this.config.get<string>('QDRANT_COLLECTION_NAME'),
    );
    const strictBootstrapValue = this.normalizeEnvValue(
      this.config.get<string>('QDRANT_STRICT_BOOTSTRAP'),
    );

    this.baseUrl = normalizedUrl ?? 'http://localhost:6333';
    this.apiKey = normalizedApiKey;
    this.collection = normalizedCollection ?? 'document_chunks';
    // text-embedding-3-small produces 1536-d vectors; keep default aligned.
    this.vectorSize = Number(
      this.config.get<string>('QDRANT_VECTOR_SIZE') ?? 1536,
    );
    this.strictBootstrap = strictBootstrapValue === 'true';
  }

  private normalizeEnvValue(value?: string | null) {
    if (value == null) {
      return undefined;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      return trimmed.slice(1, -1).trim();
    }

    return trimmed;
  }

  async onModuleInit() {
    try {
      await this.ensureCollection();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown qdrant bootstrap error';
      if (this.strictBootstrap) {
        throw error;
      }
      this.logger.warn(
        `Skip strict qdrant bootstrap: ${message}. Set QDRANT_STRICT_BOOTSTRAP=true to fail fast.`,
      );
    }
  }

  getCollectionName() {
    return this.collection;
  }

  async ensureCollection() {
    const getResult = await this.request(`/collections/${this.collection}`, {
      method: 'GET',
      ignoreNotFound: true,
    });

    if (getResult.statusCode === 200) {
      const existingVectorSize = this.extractCollectionVectorSize(
        getResult.json,
      );
      if (
        existingVectorSize != null &&
        existingVectorSize !== this.vectorSize
      ) {
        throw new InternalServerErrorException(
          `Qdrant collection '${this.collection}' vector size mismatch: existing=${existingVectorSize}, configured=${this.vectorSize}. Update QDRANT_VECTOR_SIZE or recreate the collection.`,
        );
      }
      return;
    }

    if (getResult.statusCode === 401 || getResult.statusCode === 403) {
      const details = this.readErrorBody(getResult);
      this.logger.error(
        `Cannot query qdrant collection status (HTTP ${getResult.statusCode})`,
      );
      this.logger.error(details);
      throw new UnauthorizedException(
        'Qdrant authentication failed. Please verify QDRANT_API_KEY and QDRANT_URL.',
      );
    }

    if (getResult.statusCode >= 300 && getResult.statusCode !== 404) {
      const details = this.readErrorBody(getResult);
      this.logger.error(
        `Cannot query qdrant collection status (HTTP ${getResult.statusCode})`,
      );
      this.logger.error(details);
      throw new InternalServerErrorException(
        `Cannot query qdrant collection status (HTTP ${getResult.statusCode})`,
      );
    }

    const createResult = await this.request(`/collections/${this.collection}`, {
      method: 'PUT',
      body: {
        vectors: {
          size: this.vectorSize,
          distance: 'Cosine',
        },
      },
    });

    if (createResult.statusCode === 200 || createResult.statusCode === 201) {
      return;
    }

    if (createResult.statusCode === 409) {
      return;
    }

    if (createResult.statusCode === 401 || createResult.statusCode === 403) {
      const details = this.readErrorBody(createResult);
      this.logger.error(
        `Failed to create qdrant collection (HTTP ${createResult.statusCode})`,
      );
      this.logger.error(details);
      throw new UnauthorizedException(
        'Qdrant authentication failed. Please verify QDRANT_API_KEY and QDRANT_URL.',
      );
    }

    if (createResult.statusCode >= 300) {
      const details = this.readErrorBody(createResult);
      this.logger.error(
        `Failed to create qdrant collection (HTTP ${createResult.statusCode})`,
      );
      this.logger.error(details);
      throw new InternalServerErrorException(
        `Cannot initialize vector collection (HTTP ${createResult.statusCode})`,
      );
    }
  }

  async upsertPoint(input: {
    id: string;
    vector: number[];
    payload?: Record<string, unknown>;
  }) {
    const result = await this.request(
      `/collections/${this.collection}/points?wait=true`,
      {
        method: 'PUT',
        body: {
          points: [
            {
              id: input.id,
              vector: input.vector,
              payload: input.payload ?? {},
            },
          ],
        },
      },
    );

    if (result.statusCode >= 300) {
      this.logger.error(
        `Failed to upsert qdrant point (HTTP ${result.statusCode})`,
      );
      this.logger.error(this.readErrorBody(result));
      throw new InternalServerErrorException('Cannot upsert vector point');
    }
  }

  async search(input: {
    vector: number[];
    limit?: number;
    filter?: Record<string, unknown>;
  }): Promise<QdrantSearchHit[]> {
    const result = await this.request(
      `/collections/${this.collection}/points/search`,
      {
        method: 'POST',
        body: {
          vector: input.vector,
          limit: input.limit ?? 5,
          with_payload: true,
          filter: input.filter,
        },
      },
    );

    if (result.statusCode >= 300) {
      this.logger.error(`Failed to search qdrant (HTTP ${result.statusCode})`);
      this.logger.error(this.readErrorBody(result));
      throw new InternalServerErrorException('Cannot search vector data');
    }

    const payload =
      (result.json as { result?: QdrantSearchItem[] } | null)?.result ?? [];
    return payload.map((item) => ({
      id: String(item.id),
      score: Number(item.score ?? 0),
      payload: item.payload,
    }));
  }

  private async request(
    path: string,
    options: {
      method: 'GET' | 'POST' | 'PUT';
      body?: Record<string, unknown>;
      ignoreNotFound?: boolean;
    },
  ) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['api-key'] = this.apiKey;
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method: options.method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown network error';
      throw new InternalServerErrorException(
        `Cannot connect to qdrant at ${this.baseUrl}: ${message}`,
      );
    }

    if (options.ignoreNotFound && response.status === 404) {
      return {
        statusCode: response.status,
        json: null,
        raw: null,
      };
    }

    const raw = await response.text().catch(() => null);
    let json: unknown = null;
    if (raw) {
      try {
        json = JSON.parse(raw);
      } catch {
        json = null;
      }
    }

    return {
      statusCode: response.status,
      json,
      raw,
    };
  }

  private extractCollectionVectorSize(json: unknown): number | null {
    const result = (json as { result?: unknown } | null)?.result as
      | {
          config?: {
            params?: {
              vectors?: { size?: number } | Record<string, { size?: number }>;
            };
          };
        }
      | undefined;

    const vectors = result?.config?.params?.vectors;
    if (!vectors) {
      return null;
    }

    if (typeof vectors === 'object' && 'size' in vectors) {
      const size = Number((vectors as { size?: number }).size ?? NaN);
      return Number.isFinite(size) ? size : null;
    }

    if (typeof vectors === 'object') {
      const first = Object.values(
        vectors as Record<string, { size?: number }>,
      )[0];
      const size = Number(first?.size ?? NaN);
      return Number.isFinite(size) ? size : null;
    }

    return null;
  }

  private readErrorBody(result: { json: unknown; raw: string | null }) {
    if (result.json != null) {
      try {
        return JSON.stringify(result.json);
      } catch {
        return String(result.json);
      }
    }

    return result.raw ?? 'No response body';
  }
}
