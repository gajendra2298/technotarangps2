import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BidsController } from './bids.controller';
import { BidsService } from './bids.service';
import { Bid, BidSchema } from './schemas/bid.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Bid.name, schema: BidSchema },
      { name: Project.name, schema: ProjectSchema }
    ]),
    AuthModule
  ],
  controllers: [BidsController],
  providers: [BidsService],
  exports: [BidsService]
})
export class BidsModule {}
