import { Injectable, UnauthorizedException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { createClerkClient } from '@clerk/clerk-sdk-node';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  private clerk;

  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {
    this.clerk = createClerkClient({
      secretKey: this.configService.get<string>('CLERK_SECRET_KEY'),
    });
  }

  async verifyClerkToken(token: string) {
    try {
      const decoded = await this.clerk.verifyToken(token);
      return decoded;
    } catch (err) {
      throw new UnauthorizedException('Invalid Clerk session');
    }
  }

  async syncUserWithClerk(clerkId: string, email: string) {
    let user = await this.usersService.findByClerkId(clerkId);
    if (!user) {
      user = await this.usersService.create({
        clerkId,
        email,
      });
    }
    
    const payload = { sub: user.clerkId, role: user.role, email: user.email };
    return {
      user,
      accessToken: this.jwtService.sign(payload),
    };
  }

  async sendOtp(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new BadRequestException('User not found');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10);

    await this.usersService.setOtp(user.clerkId, otp, expiry);
    await this.mailService.sendOtp(email, otp);

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(email: string, otp: string) {
    const isValid = await this.usersService.verifyOtp(email, otp);
    if (!isValid) throw new BadRequestException('Invalid or expired OTP');

    return { message: 'OTP verified successfully', status: 'VERIFIED' };
  }
}
