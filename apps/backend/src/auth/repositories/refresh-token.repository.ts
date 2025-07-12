import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';

@Injectable()
export class RefreshTokenRepository extends Repository<RefreshToken> {
  constructor(private dataSource: DataSource) {
    super(RefreshToken, dataSource.createEntityManager());
  }

  async createRefreshToken(tokenData: Partial<RefreshToken>): Promise<RefreshToken> {
    const token = this.create(tokenData);
    return await this.save(token);
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    return await this.findOne({
      where: { token, is_revoked: false },
      relations: ['user'],
    });
  }

  async findByUserId(userId: string): Promise<RefreshToken[]> {
    return await this.find({
      where: { user_id: userId, is_revoked: false },
      order: { created_at: 'DESC' },
    });
  }

  async revokeToken(tokenId: string): Promise<void> {
    await this.update(tokenId, {
      is_revoked: true,
      revoked_at: new Date(),
    });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.update(
      { user_id: userId, is_revoked: false },
      {
        is_revoked: true,
        revoked_at: new Date(),
      },
    );
  }
}
