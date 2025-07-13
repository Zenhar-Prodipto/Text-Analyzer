import { Module } from "@nestjs/common";
import { AnalysisController } from "./controllers/analysis.controller";
import { AnalysisService } from "./services/analysis.service";
import { CacheModule } from "../cache/cache.module";
import { TextsModule } from "@/texts/texts.module";

@Module({
  imports: [CacheModule, TextsModule],
  controllers: [AnalysisController],
  providers: [AnalysisService],
  exports: [AnalysisService],
})
export class AnalysisModule {}
