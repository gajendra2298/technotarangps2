import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum UserRole {
  CLIENT = 'CLIENT',
  FREELANCER = 'FREELANCER',
  ADMIN = 'ADMIN',
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  clerkId: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.FREELANCER })
  role: UserRole;

  @Prop()
  name?: string;

  @Prop()
  avatar?: string;

  @Prop()
  bio?: string;

  @Prop()
  otp?: string;

  @Prop()
  otpExpiry?: Date;

  // --- Client Specific Fields ---
  @Prop()
  companyName?: string;

  @Prop()
  industry?: string;

  @Prop()
  website?: string;

  @Prop({ default: 0 })
  projectsPosted?: number;

  @Prop({ default: 0 })
  activeProjects?: number;

  // --- Freelancer Specific Fields ---
  @Prop()
  title?: string; // e.g., Full Stack Developer

  @Prop({ type: [String], default: [] })
  skills?: string[];

  @Prop()
  experience?: string;

  @Prop({ type: [String], default: [] })
  portfolioLinks?: string[];

  @Prop()
  github?: string;

  @Prop()
  linkedin?: string;

  @Prop({ default: 0 })
  completedProjects?: number;

  @Prop({ default: 0 })
  rating?: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
