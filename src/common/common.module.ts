import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheService } from './services/cache.service';
import { PrismaService } from './services/prisma.service';

@Global()
@Module({
  imports: [CacheModule.register()],
  providers: [CacheService, PrismaService],
  exports: [CacheService, PrismaService],
})
export class CommonModule {}
