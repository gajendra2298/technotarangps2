import { Controller, Post, Get, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { BidsService } from './bids.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { JwtAuthGuard as AuthGuard, RolesGuard } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('bids')
@UseGuards(AuthGuard, RolesGuard)
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  @Post()
  @Roles(UserRole.FREELANCER)
  createBid(@Request() req, @Body() createBidDto: CreateBidDto) {
    return this.bidsService.createBid(req.user.sub, createBidDto);
  }

  @Get('project/:projectId')
  getBidsForProject(@Param('projectId') projectId: string) {
    return this.bidsService.getBidsForProject(projectId);
  }

  @Patch(':id/accept')
  @Roles(UserRole.CLIENT)
  acceptBid(@Request() req, @Param('id') id: string) {
    return this.bidsService.acceptBid(id, req.user.sub);
  }

  @Patch(':id/reject')
  @Roles(UserRole.CLIENT)
  rejectBid(@Request() req, @Param('id') id: string) {
    return this.bidsService.rejectBid(id, req.user.sub);
  }
}
