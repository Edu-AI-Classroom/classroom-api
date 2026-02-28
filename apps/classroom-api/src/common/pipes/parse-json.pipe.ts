import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class ParseJsonPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // Nếu value là object (đã được parse sẵn) thì trả về luôn
    if (typeof value === 'object' && value !== null) {
      return value;
    }

    // Nếu không có value, bỏ qua
    if (!value) {
      return {};
    }

    try {
      // Thử parse JSON string thành Object
      return JSON.parse(value);
    } catch (error) {
      throw new BadRequestException(
        `${metadata.data} must be a valid JSON string`,
      );
    }
  }
}
