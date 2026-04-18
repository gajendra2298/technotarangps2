import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserRole } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findByClerkId(clerkId: string): Promise<User | null> {
    return this.userModel.findOne({ clerkId }).exec();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async create(data: Partial<User>): Promise<User> {
    const user = new this.userModel(data);
    return user.save();
  }

  async updateProfile(clerkId: string, data: Partial<User>): Promise<User | null> {
    return this.userModel.findOneAndUpdate({ clerkId }, data, { new: true }).exec();
  }

  async setOtp(clerkId: string, otp: string, expiry: Date): Promise<void> {
    await this.userModel.updateOne({ clerkId }, { otp, otpExpiry: expiry }).exec();
  }

  async verifyOtp(email: string, otp: string): Promise<boolean> {
    const user = await this.userModel.findOne({ 
      email, 
      otp, 
      otpExpiry: { $gt: new Date() } 
    }).exec();
    return !!user;
  }
}
