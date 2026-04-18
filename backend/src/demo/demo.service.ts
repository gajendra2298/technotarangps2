import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, MilestoneStatus } from '../projects/schemas/project.schema';

@Injectable()
export class DemoService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>
  ) {}

  async seed() {
    // Clear existing data for a fresh demo
    await this.projectModel.deleteMany({});

    const demoProjects = [
      {
        title: 'E-commerce Mobile App Development',
        description: 'Complete development of a React Native mobile application for a high-end fashion brand.',
        clientAddress: '0xClientAddress123...',
        freelancerAddress: '0xFreelancerAddress456...',
        contractAddress: '0xEscrowAddress...',
        blockchainId: 1,
        milestones: [
          {
            title: 'UI/UX Design Phase',
            description: 'Provide high-fidelity Figma designs for all core screens (Home, Product, Cart, Profile).',
            amount: 1000000000000000000, // 1 ETH
            status: MilestoneStatus.APPROVED,
            aiFeedback: 'Designs match all branding guidelines and covering all requested user flows.',
            aiConfidence: 0.98,
          },
          {
            title: 'Frontend API Integration',
            description: 'Integrate all REST endpoints and implement global state management.',
            amount: 2000000000000000000, // 2 ETH
            status: MilestoneStatus.SUBMITTED,
            submissionContent: 'Merged PR #45 with 95% test coverage. All API hooks established.',
            aiFeedback: 'Code quality is high. Integration tests pass. AI confirms API coverage.',
            aiConfidence: 0.92,
          },
          {
            title: 'Testing & QA',
            description: 'Conduct comprehensive E2E testing and fix all P0/P1 bugs.',
            amount: 1500000000000000000, // 1.5 ETH
            status: MilestoneStatus.FUNDED,
          }
        ]
      },
      {
        title: 'Smart Contract Audit - DeFi Protocol',
        description: 'Security audit for a new multi-chain lending protocol.',
        clientAddress: '0xClientAddress789...',
        freelancerAddress: '0xFreelancerAddress012...',
        contractAddress: '0xEscrowAddress...',
        blockchainId: 2,
        milestones: [
          {
            title: 'Initial Security Report',
            description: 'Identify high and medium severity vulnerabilities.',
            amount: 500000000000000000, // 0.5 ETH
            status: MilestoneStatus.PENDING,
          }
        ]
      }
    ];

    return this.projectModel.insertMany(demoProjects);
  }

  async reset() {
    return this.projectModel.deleteMany({});
  }
}
