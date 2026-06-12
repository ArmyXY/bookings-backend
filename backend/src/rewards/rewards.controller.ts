import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { RewardsService } from './rewards.service';
import { CreateRewardDto } from './dto/create-reward.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@ApiTags('rewards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Post('business')
  @Roles(UserRole.BUSINESS)
  @ApiOperation({ summary: 'Empresa crea recompensa' })
  createReward(@Request() req, @Body() createRewardDto: CreateRewardDto) {
    const businessId = req.user.businessId;
    return this.rewardsService.createReward(businessId, createRewardDto);
  }

  @Post('business/points')
  @Roles(UserRole.BUSINESS)
  @ApiOperation({ summary: 'Empresa añade puntos a cliente' })
  addPoints(@Request() req, @Body() body: { customerId: number, points: number }) {
    return this.rewardsService.addPoints(body.customerId, req.user.businessId, body.points);
  }

  @Get('business')
  @Roles(UserRole.BUSINESS)
  @ApiOperation({ summary: 'Empresa obtiene sus recompensas' })
  getBusinessRewards(@Request() req) {
    return this.rewardsService.getBusinessRewards(req.user.businessId);
  }

  @Get('business/:businessId')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener recompensas de una empresa por ID' })
  getRewardsByBusiness(@Param('businessId') businessId: string) {
    return this.rewardsService.getBusinessRewards(+businessId);
  }

  @Get('all')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener todas las recompensas de todos los negocios' })
  getAllRewards() {
    return this.rewardsService.getAllRewards();
  }

  @Get('my-points')
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Cliente obtiene sus puntos' })
  getMyPoints(@Request() req) {
    return this.rewardsService.getCustomerPoints(req.user.id);
  }

  @Post('redeem/:id')
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Cliente canjea recompensa' })
  redeemReward(@Request() req, @Param('id') rewardId: string) {
    return this.rewardsService.redeemReward(req.user.id, +rewardId);
  }

  @Get('my-rewards')
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Cliente obtiene recompensas canjeadas' })
  getMyRedeemedRewards(@Request() req) {
    return this.rewardsService.getRedeemedRewards(req.user.id);
  }
}
