import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bid } from './schemas/bid.schema';
import { Project } from '../projects/schemas/project.schema';
import { CreateBidDto } from './dto/create-bid.dto';

@Injectable()
export class BidsService {
  constructor(
    @InjectModel(Bid.name) private bidModel: Model<Bid>,
    @InjectModel(Project.name) private projectModel: Model<Project>
  ) {}

  async createBid(freelancerId: string, createBidDto: CreateBidDto) {
    const project = await this.projectModel.findById(createBidDto.projectId);
    if (!project) throw new NotFoundException('Project not found');
    if (project.status !== 'OPEN') throw new BadRequestException('Project is not OPEN for bidding');

    const existingBid = await this.bidModel.findOne({
      projectId: createBidDto.projectId,
      freelancerId
    });
    if (existingBid) throw new BadRequestException('You have already bid on this project');

    const bid = new this.bidModel({
      ...createBidDto,
      freelancerId
    });
    return bid.save();
  }

  async getBidsForProject(projectId: string) {
    return this.bidModel.find({ projectId }).populate('freelancerId', 'name email address skills avatar role').exec();
  }

  async acceptBid(bidId: string, clientId: string) {
    const bid = await this.bidModel.findById(bidId);
    if (!bid) throw new NotFoundException('Bid not found');
    
    // Actually we need to check if client owns this project
    const project = await this.projectModel.findById(bid.projectId);
    if (!project) throw new NotFoundException('Project not found');
    if (project.clientId?.toString() !== clientId) {
      throw new BadRequestException('You do not own this project');
    }
    if (project.status !== 'OPEN') {
      throw new BadRequestException('Project cannot accept bids right now');
    }

    // Accept this bid
    bid.status = 'ACCEPTED';
    await bid.save();

    // Reject all other bids
    await this.bidModel.updateMany(
      { projectId: project.id, _id: { $ne: bidId } },
      { status: 'REJECTED' }
    );

    // Update project!
    project.status = 'IN_PROGRESS';
    project.assignedFreelancerId = bid.freelancerId;
    project.finalAmount = bid.proposedAmount;
    await project.save();

    return bid;
  }

  async rejectBid(bidId: string, clientId: string) {
    const bid = await this.bidModel.findById(bidId);
    if (!bid) throw new NotFoundException('Bid not found');

    const project = await this.projectModel.findById(bid.projectId);
    if (!project) throw new NotFoundException('Project not found');
    if (project.clientId?.toString() !== clientId) {
      throw new BadRequestException('You do not own this project');
    }

    bid.status = 'REJECTED';
    await bid.save();

    return bid;
  }
}
