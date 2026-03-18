import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TextEmbedderService {
  private readonly apiKey?: string;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('OPENROUTER_API_KEY');
    this.model =
      this.config.get<string>('OPENROUTER_EMBEDDING_MODEL') ??
      'text-embedding-3-small';
  }

  async embed(input: string): Promise<number[]> {
    if (!this.apiKey) {
      throw new InternalServerErrorException(
        'OPENROUTER_API_KEY is not configured',
      );
    }

    const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        input,
      }),
    });

    const raw = (await response.json().catch(() => null)) as {
      data?: Array<{ embedding?: number[] }>;
      error?: { message?: string };
    } | null;

    if (!response.ok) {
      throw new InternalServerErrorException(
        raw?.error?.message ?? 'Failed to create embedding vector',
      );
    }

    const vector = raw?.data?.[0]?.embedding;
    if (!vector || !Array.isArray(vector) || vector.length === 0) {
      throw new InternalServerErrorException(
        'Embedding API returned empty vector',
      );
    }

    return vector;
  }

  getModel() {
    return this.model;
  }
}
