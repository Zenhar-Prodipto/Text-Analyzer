import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Text } from "./entities/text.entity";
import { TextsRepository } from "./repositories/texts.repository";
import { TextsService } from "./services/texts.service";
import { TextsController } from "./controllers/texts.controller";
import { CacheModule } from "../cache/cache.module";

@Module({
  imports: [TypeOrmModule.forFeature([Text]), CacheModule],
  controllers: [TextsController],
  providers: [TextsRepository, TextsService],
  exports: [TextsService, TextsRepository],
})
export class TextsModule {}
