import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HealthService, HealthStatus } from './health.service.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOkResponse({
    description: 'API e banco de dados disponíveis',
    schema: { example: { status: 'ok' } },
  })
  @ApiServiceUnavailableResponse({ description: 'Banco de dados indisponível' })
  check(): Promise<HealthStatus> {
    return this.healthService.check();
  }
}
