import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { StudentParentLinkService } from './student-parent-link.service';

@ApiTags('Student Parent Link Codes')
@Controller('student/parent-link-codes')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT')
export class StudentParentLinkController {
  constructor(private readonly service: StudentParentLinkService) {}

  @Post()
  async create(@CurrentUser('userId') studentId: number) {
    return this.service.createLinkCode(studentId);
  }

  @Get('active')
  async active(@CurrentUser('userId') studentId: number) {
    return this.service.getActiveLinkCode(studentId);
  }

  @Delete(':code')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(
    @CurrentUser('userId') studentId: number,
    @Param('code') code: string,
  ) {
    await this.service.revokeLinkCode(studentId, code);
  }
}
