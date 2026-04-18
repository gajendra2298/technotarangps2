import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ProjectUpdate extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true })
  projectId: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  freelancerId: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String], default: [] })
  files: string[];
}

export const ProjectUpdateSchema = SchemaFactory.createForClass(ProjectUpdate);
