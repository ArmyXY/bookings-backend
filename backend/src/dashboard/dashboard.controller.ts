import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas globales para el dashboard' })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas correctamente.' })
  getStats() {
    return this.dashboardService.getStats();
  }
}
