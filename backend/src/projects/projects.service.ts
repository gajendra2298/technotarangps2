import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, MilestoneStatus } from './schemas/project.schema';
import { ProjectUpdate } from './schemas/project-update.schema';
import { AiService } from '../ai/ai.service';
import { createPublicClient, http } from 'viem';
import { mainnet, sepolia } from 'viem/chains';

@Injectable()
export class ProjectsService {
  private publicClient;

  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(ProjectUpdate.name) private projectUpdateModel: Model<ProjectUpdate>,
    private aiService: AiService,
  ) {
    // Initializing client with Sepolia for transaction verification
    this.publicClient = createPublicClient({
      chain: sepolia,
      transport: http(),
    });
  }

  async create(projectData: any): Promise<Project> {
    const newProject = new this.projectModel(projectData);
    return newProject.save();
  }

  async findAll(): Promise<Project[]> {
    return this.projectModel.find()
      .populate('clientId', 'name avatar role companyName industry website projectsPosted activeProjects')
      .populate('freelancerId', 'name avatar role title skills experience portfolioLinks github linkedin completedProjects rating')
      .exec();
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectModel.findById(id)
      .populate('clientId', 'name avatar role companyName industry website projectsPosted activeProjects')
      .populate('freelancerId', 'name avatar role title skills experience portfolioLinks github linkedin completedProjects rating')
      .exec();
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async fund(id: string, amount: string, transactionHash?: string) {
    const project = await this.findOne(id);

    if (!transactionHash) {
      throw new BadRequestException('Transaction hash is required for funding');
    }

    try {
      const receipt = await this.publicClient.waitForTransactionReceipt({ 
        hash: transactionHash as `0x${string}` 
      });

      if (receipt.status !== 'success') {
        throw new BadRequestException('Transaction failed on-chain');
      }

      // Optional: Verify contract address and amount if needed
    } catch (err) {
      throw new BadRequestException(`On-chain verification failed: ${err.message}`);
    }

    project.status = 'FUNDED';
    return project.save();
  }

  async submitMilestone(projectId: string, milestoneId: number, content: string) {
    const project = await this.findOne(projectId);
    const milestone = project.milestones[milestoneId];
    
    if (!milestone) throw new NotFoundException('Milestone not found');

    milestone.submissionContent = content;
    milestone.status = MilestoneStatus.SUBMITTED;

    // Trigger AI Validation
    const aiResult = await this.aiService.validateMilestone(
      milestone.description,
      content,
    );

    milestone.aiFeedback = aiResult.reason;
    milestone.aiConfidence = aiResult.confidence;

    await project.save();
    return { milestone, aiResult };
  }

  async approveMilestone(projectId: string, milestoneId: number, transactionHash?: string) {
    const project = await this.findOne(projectId);
    const milestone = project.milestones[milestoneId];
    if (!milestone) throw new NotFoundException('Milestone not found');

    if (!transactionHash) {
      throw new BadRequestException('Transaction hash is required for milestone approval');
    }

    try {
      const receipt = await this.publicClient.waitForTransactionReceipt({ 
        hash: transactionHash as `0x${string}` 
      });

      if (receipt.status !== 'success') {
        throw new BadRequestException('Transaction failed on-chain');
      }
    } catch (err) {
      throw new BadRequestException(`On-chain verification failed: ${err.message}`);
    }
    
    milestone.status = MilestoneStatus.APPROVED;
    return project.save();
  }

  async addUpdate(projectId: string, freelancerId: string, description: string, files: string[]) {
    const project = await this.findOne(projectId);
    
    // Check if caller is the assigned freelancer
    if (project.assignedFreelancerId?.toString() !== freelancerId) {
      throw new BadRequestException('Only the assigned freelancer can post updates');
    }

    if (project.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Project updates can only be posted while in progress');
    }

    const update = new this.projectUpdateModel({
      projectId,
      freelancerId,
      description,
      files,
    });
    return update.save();
  }

  async getUpdates(projectId: string) {
    return this.projectUpdateModel.find({ projectId }).populate('freelancerId', 'name avatar role').sort({ createdAt: -1 }).exec();
  }
}
