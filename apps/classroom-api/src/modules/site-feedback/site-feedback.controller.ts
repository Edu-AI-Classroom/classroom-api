import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { CreateSiteFeedbackDto } from './dtos/create-site-feedback.dto';
import { SiteFeedbackService } from './site-feedback.service';

@ApiTags('Site Feedback')
@Controller('site-feedback')
export class SiteFeedbackController {
  constructor(private readonly siteFeedbackService: SiteFeedbackService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Submit public landing page feedback' })
  async create(@Body() dto: CreateSiteFeedbackDto) {
    const data = await this.siteFeedbackService.create(dto);
    return { success: true, data };
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get approved landing page feedback' })
  async findPublic(@Query('limit') limit?: string) {
    const data = await this.siteFeedbackService.getPublicTestimonials(
      Number(limit),
    );
    return { success: true, data };
  }
}
