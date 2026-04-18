import { Controller, Post } from '@nestjs/common';
import { DemoService } from './demo.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('demo')
@Controller('demo')
export class DemoController {
  constructor(private readonly demoService: DemoService) {}

  @Post('seed')
  @ApiOperation({ summary: 'Seed the database with sample demo projects' })
  seed() {
    return this.demoService.seed();
  }

  @Post('reset')
  @ApiOperation({ summary: 'Reset the database for a clean demo' })
  reset() {
    return this.demoService.reset();
  }
}
