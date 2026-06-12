import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reward } from './entities/reward.entity';
import { CustomerPoints } from './entities/customer-points.entity';
import { RedeemedReward } from './entities/redeemed-reward.entity';
import { CreateRewardDto } from './dto/create-reward.dto';

@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);

  constructor(
    @InjectRepository(Reward)
    private readonly rewardRepository: Repository<Reward>,
    @InjectRepository(CustomerPoints)
    private readonly customerPointsRepository: Repository<CustomerPoints>,
    @InjectRepository(RedeemedReward)
    private readonly redeemedRewardRepository: Repository<RedeemedReward>,
  ) { }

  async createReward(businessId: number, dto: CreateRewardDto) {
    const reward = this.rewardRepository.create({
      ...dto,
      businessId,
    });
    return this.rewardRepository.save(reward);
  }

  async getBusinessRewards(businessId: number) {
    return this.rewardRepository.find({ where: { businessId }, relations: ['business'] });
  }

  async getAllRewards() {
    return this.rewardRepository.find({ relations: ['business'] });
  }

  async getCustomerPoints(customerId: number) {
    return this.customerPointsRepository.find({
      where: { customerId },
      relations: ['business']
    });
  }

  async addPoints(customerId: number, businessId: number, points: number) {
    let cp = await this.customerPointsRepository.findOne({ where: { customerId, businessId } });
    if (!cp) {
      cp = this.customerPointsRepository.create({ customerId, businessId, points: 0 });
    }
    cp.points += points;
    const saved = await this.customerPointsRepository.save(cp);
    this.logger.log(`Cliente ${customerId} ahora tiene ${saved.points} puntos en el negocio ${businessId} (+${points})`);
    return saved;
  }

  async redeemReward(customerId: number, rewardId: number) {
    const reward = await this.rewardRepository.findOne({ where: { id: rewardId } });
    if (!reward) throw new NotFoundException('Recompensa no encontrada');

    const cp = await this.customerPointsRepository.findOne({ where: { customerId, businessId: reward.businessId } });
    if (!cp || cp.points < reward.pointsCost) {
      throw new BadRequestException('Puntos insuficientes');
    }

    // Restar puntos
    cp.points -= reward.pointsCost;
    await this.customerPointsRepository.save(cp);

    // Registrar canje
    const redeemed = this.redeemedRewardRepository.create({
      customerId,
      rewardId,
      isUsed: false,
    });
    const saved = await this.redeemedRewardRepository.save(redeemed);
    this.logger.log(`Cliente ${customerId} ha canjeado recompensa ${reward.id} (coste: ${reward.pointsCost} pts). Quedan ${cp.points} puntos.`);
    return saved;
  }

  async getRedeemedRewards(customerId: number) {
    return this.redeemedRewardRepository.find({
      where: { customerId },
      relations: ['reward', 'reward.business'],
    });
  }
}
