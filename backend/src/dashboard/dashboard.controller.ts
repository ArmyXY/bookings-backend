import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/user.entity';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener estadisticas globales para el dashboard' })
  @ApiResponse({ status: 200, description: 'Estadisticas obtenidas correctamente.' })
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('business-stats')
  @Roles(UserRole.BUSINESS)
  @ApiOperation({ summary: 'Obtener estadisticas de la empresa' })
  getBusinessStats(@Request() req) {
    return this.dashboardService.getBusinessStats(req.user.businessId);
  }

  @Get('client-stats')
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Obtener estadisticas del cliente' })
  getClientStats(@Request() req) {
    return this.dashboardService.getClientStats(req.user.id);
  }
}
