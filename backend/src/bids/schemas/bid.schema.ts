import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Bid extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true })
  projectId: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  freelancerId: string;

  @Prop({ required: true })
  proposedAmount: number;

  @Prop({ required: true })
  message: string;

  @Prop({ default: 'PENDING' })
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export const BidSchema = SchemaFactory.createForClass(Bid);
