import { BadRequestException, Injectable } from '@nestjs/common';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

export interface ParsedDocument {
  fileType: 'pdf' | 'docx';
  text: string;
}

@Injectable()
export class DocumentParserService {
  detectFileType(file: Express.Multer.File): 'pdf' | 'docx' {
    const name = file.originalname.toLowerCase();
    if (file.mimetype.includes('pdf') || name.endsWith('.pdf')) {
      return 'pdf';
    }

    if (
      file.mimetype.includes('officedocument.wordprocessingml.document') ||
      name.endsWith('.docx')
    ) {
      return 'docx';
    }

    throw new BadRequestException('Only PDF and DOCX files are supported');
  }

  async parse(file: Express.Multer.File): Promise<ParsedDocument> {
    const fileType = this.detectFileType(file);

    if (fileType === 'pdf') {
      const parser = new PDFParse({ data: file.buffer });
      const parsed = await parser.getText();
      await parser.destroy();
      return {
        fileType,
        text: parsed.text?.trim() ?? '',
      };
    }

    const parsed = await mammoth.extractRawText({
      buffer: file.buffer,
    });

    return {
      fileType,
      text: parsed.value?.trim() ?? '',
    };
  }

  semanticChunk(text: string, maxChunkChars = 1200): string[] {
    const cleaned = text
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!cleaned) {
      return [];
    }

    const paragraphs = cleaned
      .split(/\n{2,}/)
      .map((item) => item.trim())
      .filter(Boolean);

    const chunks: string[] = [];
    let current = '';

    for (const paragraph of paragraphs) {
      const next = current ? `${current}\n\n${paragraph}` : paragraph;
      if (next.length <= maxChunkChars) {
        current = next;
        continue;
      }

      if (current) {
        chunks.push(current);
      }

      if (paragraph.length <= maxChunkChars) {
        current = paragraph;
        continue;
      }

      const sentences = paragraph
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);

      let sentenceChunk = '';
      for (const sentence of sentences) {
        const merged = sentenceChunk
          ? `${sentenceChunk} ${sentence}`
          : sentence;
        if (merged.length <= maxChunkChars) {
          sentenceChunk = merged;
        } else {
          if (sentenceChunk) {
            chunks.push(sentenceChunk);
          }
          sentenceChunk = sentence;
        }
      }

      if (sentenceChunk) {
        current = sentenceChunk;
      } else {
        current = '';
      }
    }

    if (current) {
      chunks.push(current);
    }

    return chunks;
  }
}
