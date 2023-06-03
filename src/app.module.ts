import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { AprsModule } from './aprs/aprs.module';
import { DexService } from './dex/dex.service';
import { DexModule } from './dex/dex.module';
import { MakeDataModule } from './make-data/make-data.module';
import { ExApisModule } from './ex-apis/ex-apis.module';

@Module({
  imports: [CommonModule, AprsModule, DexModule, MakeDataModule, ExApisModule],
  providers: [DexService],
})
export class AppModule {}
