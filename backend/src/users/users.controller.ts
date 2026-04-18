import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('user')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile (using JWT)' })
  @ApiResponse({ status: 200, description: 'User profile fetched successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized. Invalid or missing JWT.' })
  async getProfile(@Req() req) {
    return this.usersService.findByClerkId(req.user.sub);
  }

  @Patch('update-profile')
  @ApiOperation({ summary: 'Update user profile info' })
  @ApiBody({ type: UpdateUserProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated successfully.' })
  async updateProfile(@Req() req, @Body() body: UpdateUserProfileDto) {
    return this.usersService.updateProfile(req.user.sub, body);
  }
}
