import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RewardsService } from './rewards.service';
import { RewardsController } from './rewards.controller';
import { Reward } from './entities/reward.entity';
import { CustomerPoints } from './entities/customer-points.entity';
import { RedeemedReward } from './entities/redeemed-reward.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reward, CustomerPoints, RedeemedReward])],
  controllers: [RewardsController],
  providers: [RewardsService],
  exports: [RewardsService],
})
export class RewardsModule {}
