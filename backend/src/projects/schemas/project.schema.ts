import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export enum MilestoneStatus {
  PENDING = 'PENDING',
  FUNDED = 'FUNDED',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  DISPUTED = 'DISPUTED',
  RESOLVED = 'RESOLVED',
}

@Schema({ timestamps: true })
export class Milestone {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  amount: number; // In wei or smallest unit

  @Prop({ enum: MilestoneStatus, default: MilestoneStatus.PENDING })
  status: MilestoneStatus;

  @Prop()
  submissionContent?: string;

  @Prop()
  aiFeedback?: string;

  @Prop()
  aiConfidence?: number;

  @Prop()
  deadline?: Date;
}

export const MilestoneSchema = SchemaFactory.createForClass(Milestone);

@Schema({ timestamps: true })
export class Project extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  scope?: string;

  @Prop()
  deadline?: Date;

  @Prop()
  budget?: number;

  @Prop({ required: true })
  clientAddress: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  clientId?: string;

  @Prop({ required: false })
  freelancerAddress?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  freelancerId?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  assignedFreelancerId?: string;

  @Prop()
  finalAmount?: number;

  @Prop({ type: [MilestoneSchema], default: [] })
  milestones: Milestone[];

  @Prop({ required: false })
  contractAddress?: string; // The Escrow contract address

  @Prop({ required: false })
  blockchainId?: number; // The project ID on-chain

  @Prop({ default: 'OPEN' })
  status: 'OPEN' | 'PENDING' | 'FUNDED' | 'DISPUTED' | 'COMPLETED' | 'IN_PROGRESS';
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
