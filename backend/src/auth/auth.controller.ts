import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sync')
  @ApiOperation({ summary: 'Sync user with Clerk and get JWT' })
  @ApiBody({ 
    schema: { 
      properties: { 
        token: { type: 'string', description: 'Clerk JWT session token' },
        clerkId: { type: 'string' },
        email: { type: 'string' }
      } 
    } 
  })
  @ApiResponse({ status: 200, description: 'User synced. Internal JWT returned.' })
  @ApiResponse({ status: 400, description: 'Invalid Clerk token or missing fields.' })
  async sync(@Body() body: any) {
    if (!body || !body.token) {
      throw new BadRequestException('Missing clerk token');
    }
    await this.authService.verifyClerkToken(body.token);
    return this.authService.syncUserWithClerk(body.clerkId, body.email);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request an OTP for password reset' })
  @ApiBody({ schema: { properties: { email: { type: 'string', example: 'user@example.com' } } } })
  @ApiResponse({ status: 200, description: 'OTP sent via email.' })
  @ApiResponse({ status: 400, description: 'User not found.' })
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.sendOtp(body.email);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify the OTP' })
  @ApiBody({ schema: { properties: { email: { type: 'string' }, otp: { type: 'string', example: '123456' } } } })
  @ApiResponse({ status: 200, description: 'Identity verified.' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP.' })
  async verifyOtp(@Body() body: { email: string; otp: string }) {
    return this.authService.verifyOtp(body.email, body.otp);
  }
}
