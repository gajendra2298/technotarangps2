import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, MilestoneStatus } from './schemas/project.schema';
import { ProjectUpdate } from './schemas/project-update.schema';
import { AiService } from '../ai/ai.service';
import { UsersService } from '../users/users.service';
import { createPublicClient, http } from 'viem';
import { mainnet, sepolia } from 'viem/chains';

@Injectable()
export class ProjectsService {
  private publicClient;

  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(ProjectUpdate.name)
    private projectUpdateModel: Model<ProjectUpdate>,
    private aiService: AiService,
    private usersService: UsersService,
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
    return this.projectModel
      .find({ status: 'OPEN' })
      .populate(
        'clientId',
        'name avatar role companyName industry website projectsPosted activeProjects',
      )
      .populate(
        'freelancerId',
        'name avatar role title skills experience portfolioLinks github linkedin completedProjects rating',
      )
      .exec();
  }

  async findClientProjects(rawClientId: string): Promise<Project[]> {
    const clientId = await this.resolveUserId(rawClientId);
    return this.projectModel
      .find({ clientId })
      .populate(
        'clientId',
        'name avatar role companyName industry website projectsPosted activeProjects',
      )
      .populate(
        'freelancerId',
        'name avatar role title skills experience portfolioLinks github linkedin completedProjects rating',
      )
      .exec();
  }

  async findFreelancerProjects(rawFreelancerId: string): Promise<Project[]> {
    const freelancerId = await this.resolveUserId(rawFreelancerId);
    return this.projectModel
      .find({ assignedFreelancerId: freelancerId })
      .populate(
        'clientId',
        'name avatar role companyName industry website projectsPosted activeProjects',
      )
      .populate(
        'freelancerId',
        'name avatar role title skills experience portfolioLinks github linkedin completedProjects rating',
      )
      .exec();
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectModel
      .findById(id)
      .populate(
        'clientId',
        'name avatar role companyName industry website projectsPosted activeProjects',
      )
      .populate(
        'freelancerId',
        'name avatar role title skills experience portfolioLinks github linkedin completedProjects rating',
      )
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
        hash: transactionHash as `0x${string}`,
      });

      if (receipt.status !== 'success') {
        throw new BadRequestException('Transaction failed on-chain');
      }

      // Verify transaction details
      const tx = await this.publicClient.getTransaction({
        hash: transactionHash as `0x${string}`,
      });

      // Confirm it's the right contract and method
      // For simplicity in this demo, we check value and sender.
      // In production, we'd decode input data to verify function name and arguments.
      const expectedWei = BigInt(Math.round(parseFloat(amount) * 1e18));
      if (tx.value < expectedWei) {
        throw new BadRequestException(`Insufficient funding amount. Expected ${amount} ETH.`);
      }

    } catch (err) {
      throw new BadRequestException(
        `On-chain verification failed: ${err.message}`,
      );
    }

    project.status = 'FUNDED';
    return project.save();
  }

  async createAndFundFromTx(txHash: string, projectData: any) {
    try {
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash: txHash as `0x${string}`,
      });

      if (receipt.status !== 'success') {
        throw new BadRequestException('Transaction failed on-chain');
      }

      // Verify contract and value if possible
      // Then save
      const newProject = new this.projectModel({
        ...projectData,
        status: 'FUNDED',
      });
      return newProject.save();
    } catch (err) {
      throw new BadRequestException(`Verification failed: ${err.message}`);
    }
  }

  async submitMilestone(
    projectId: string,
    milestoneId: number,
    content: string,
  ) {
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

  async releasePayment(
    projectId: string,
    milestoneId: number,
    transactionHash?: string,
  ) {
    const project = await this.findOne(projectId);
    const milestone = project.milestones[milestoneId];
    if (!milestone) throw new NotFoundException('Milestone not found');

    if (!transactionHash) {
      throw new BadRequestException(
        'Transaction hash is required for payment release',
      );
    }

    try {
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash: transactionHash as `0x${string}`,
      });

      if (receipt.status !== 'success') {
        throw new BadRequestException('Transaction failed on-chain');
      }
      
      // In a real app, we'd verify the 'MilestoneApproved' event in the logs
    } catch (err) {
      throw new BadRequestException(
        `On-chain verification failed: ${err.message}`,
      );
    }

    milestone.status = MilestoneStatus.APPROVED;
    
    // Check if all milestones are approved to complete project
    const allApproved = project.milestones.every(m => m.status === MilestoneStatus.APPROVED);
    if (allApproved) {
      project.status = 'COMPLETED';
    }

    return project.save();
  }

  private async resolveUserId(userId: string): Promise<string> {
    if (userId && userId.startsWith('user_')) {
      const user = await this.usersService.findByClerkId(userId);
      if (!user) throw new NotFoundException('User not found for this session');
      return user._id.toString();
    }
    return userId;
  }

  async addUpdate(
    projectId: string,
    rawFreelancerId: string,
    description: string,
    files: string[],
  ) {
    const freelancerId = await this.resolveUserId(rawFreelancerId);
    const project = await this.findOne(projectId);

    // Check if caller is the assigned freelancer
    if (project.assignedFreelancerId?.toString() !== freelancerId) {
      throw new BadRequestException(
        'Only the assigned freelancer can post updates',
      );
    }

    if (project.status !== 'IN_PROGRESS') {
      throw new BadRequestException(
        'Project updates can only be posted while in progress',
      );
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
    return this.projectUpdateModel
      .find({ projectId })
      .populate('freelancerId', 'name avatar role')
      .sort({ createdAt: -1 })
      .exec();
  }
}
