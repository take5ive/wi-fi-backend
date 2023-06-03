import { Controller, Get } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma.service';
import { AprsService } from './aprs.service';
import { ApiOperation } from '@nestjs/swagger';

@Controller('aprs')
export class AprsController {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly aprsService: AprsService,
  ) {}
}
