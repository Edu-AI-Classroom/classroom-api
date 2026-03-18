import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class RagGenerateDto {
  @ApiProperty({ example: 'Tao 5 cau hoi trac nghiem tu tai lieu nay' })
  @IsString()
  prompt!: string;

  @ApiProperty({ required: false, default: 5, example: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  topK?: number = 5;

  @ApiProperty({ required: false, default: 'vi', example: 'vi' })
  @IsOptional()
  @IsString()
  language?: string = 'vi';
}
