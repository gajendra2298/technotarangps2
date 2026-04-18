import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Reflector } from '@nestjs/core';
import { BidsController } from './bids.controller';
import { BidsService } from './bids.service';
import { Bid, BidSchema } from './schemas/bid.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/auth.guard';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Bid.name, schema: BidSchema },
      { name: Project.name, schema: ProjectSchema }
    ]),
    AuthModule,
    UsersModule
  ],
  controllers: [BidsController],
  providers: [BidsService, Reflector, JwtAuthGuard, RolesGuard],
  exports: [BidsService]
})
export class BidsModule {}
