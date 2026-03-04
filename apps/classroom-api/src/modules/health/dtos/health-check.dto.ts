import { ApiProperty } from '@nestjs/swagger';

export class ServiceDetailDto {
  @ApiProperty({ description: 'Status of the service', example: 'up' })
  status: string;

  @ApiProperty({
    description: 'Optional message for failed services',
    example: 'connect ECONNREFUSED ::1:3002',
    required: false,
  })
  message?: string;
}

export class HealthCheckDataDto {
  @ApiProperty({
    description: 'List of services with status up',
    type: [Object],
    example: [
      { database: { status: 'up' } },
      { microservice_health_auth: { status: 'up' } },
    ],
  })
  healthCheckSuccessful: Record<string, ServiceDetailDto>[];

  @ApiProperty({
    description: 'List of services with status down',
    type: [Object],
    example: [
      {
        microservice_health_notify: {
          status: 'down',
          message: 'connect ECONNREFUSED',
        },
      },
    ],
  })
  healthCheckFailed: Record<string, ServiceDetailDto>[];
}

export class HealthCheckResponseDto {
  @ApiProperty({
    description: 'HTTP status code of the response',
    example: 200,
  })
  statusCode: number;

  @ApiProperty({ description: 'Response message', example: 'Success' })
  message: string;

  @ApiProperty({
    description: 'Data containing health check results',
    type: HealthCheckDataDto,
  })
  data: HealthCheckDataDto;
}
