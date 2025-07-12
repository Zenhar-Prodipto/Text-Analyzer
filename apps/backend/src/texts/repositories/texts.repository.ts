import { Injectable } from "@nestjs/common";
import { Repository, DataSource, FindManyOptions } from "typeorm";
import { Text } from "../entities/text.entity";
import { CreateTextDto } from "../dto/create-text.dto";
import { UpdateTextDto } from "../dto/update-text.dto";

export interface TextFindOptions {
  userId: string;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "created_at" | "updated_at" | "title";
  sortOrder?: "ASC" | "DESC";
}

@Injectable()
export class TextsRepository extends Repository<Text> {
  constructor(private dataSource: DataSource) {
    super(Text, dataSource.createEntityManager());
  }

  async createText(
    createTextDto: CreateTextDto,
    userId: string
  ): Promise<Text> {
    const text = this.create({
      ...createTextDto,
      user_id: userId,
    });
    return await this.save(text);
  }

  async findUserTexts(
    options: TextFindOptions
  ): Promise<{ texts: Text[]; total: number }> {
    const {
      userId,
      page = 1,
      limit = 10,
      search,
      sortBy = "created_at",
      sortOrder = "DESC",
    } = options;

    const queryBuilder = this.createQueryBuilder("text").where(
      "text.user_id = :userId",
      { userId }
    );

    // Add search filter
    if (search) {
      queryBuilder.andWhere(
        "(text.title ILIKE :search OR text.content ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    // Add sorting
    queryBuilder.orderBy(`text.${sortBy}`, sortOrder);

    // Add pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Execute query
    const [texts, total] = await queryBuilder.getManyAndCount();

    return { texts, total };
  }

  async findUserTextById(id: string, userId: string): Promise<Text | null> {
    return await this.findOne({
      where: { id, user_id: userId },
    });
  }

  async updateUserText(
    id: string,
    userId: string,
    updateTextDto: UpdateTextDto
  ): Promise<Text | null> {
    const text = await this.findUserTextById(id, userId);
    if (!text) {
      return null;
    }

    // Reset analysis cache if content changed
    if (updateTextDto.content && updateTextDto.content !== text.content) {
      Object.assign(text, updateTextDto, {
        word_count: 0,
        character_count: 0,
        sentence_count: 0,
        paragraph_count: 0,
        longest_words: null,
        analyzed_at: null,
      });
    } else {
      Object.assign(text, updateTextDto);
    }

    return await this.save(text);
  }

  async deleteUserText(id: string, userId: string): Promise<boolean> {
    const result = await this.delete({ id, user_id: userId });
    return result.affected > 0;
  }

  async updateAnalysisCache(
    id: string,
    analysis: {
      word_count: number;
      character_count: number;
      sentence_count: number;
      paragraph_count: number;
      longest_words: string[];
    }
  ): Promise<void> {
    await this.update(id, {
      ...analysis,
      analyzed_at: new Date(),
    });
  }

  async getUserTextCount(userId: string): Promise<number> {
    return await this.count({ where: { user_id: userId } });
  }
}
