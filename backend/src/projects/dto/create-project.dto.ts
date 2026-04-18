import { IsString, IsNotEmpty, IsNumber, IsEmail, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class MilestoneDto {
  @ApiProperty({ example: 'Design Phase', description: 'Title of the milestone' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 1000000000000000000, description: 'Amount in Wei (1 ETH)' })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: '2026-12-31T23:59:59Z', description: 'Milestone deadline' })
  @IsString()
  @IsOptional()
  deadline?: string;
}

export class CreateProjectDto {
  @ApiProperty({ example: 'Mobile App Development', description: 'Title of the freelance project' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Develop a secure NFT marketplace app', description: 'Brief overview of the project' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'Full implementation of backend API and frontend react application including smart contract integrations.', description: 'Detailed scope of work' })
  @IsString()
  @IsOptional()
  scope?: string;

  @ApiProperty({ example: '2026-12-31T23:59:59Z', description: 'Overall project deadline' })
  @IsString()
  @IsOptional()
  deadline?: string;

  @ApiProperty({ example: 5000000000000000000, description: 'Total budget in Wei (5 ETH)' })
  @IsNumber()
  budget: number;

  @ApiProperty({ type: [MilestoneDto], description: 'List of project milestones' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MilestoneDto)
  milestones: MilestoneDto[];

  @ApiProperty({ example: '0xabc...', description: 'Wallet address of the freelancer', required: false })
  @IsString()
  @IsOptional()
  freelancerAddress?: string;

  @ApiProperty({ example: '0xdef...', description: 'Wallet address of the client' })
  @IsString()
  @IsNotEmpty()
  clientAddress: string;

  @ApiProperty({ example: '69e337efd625497072873818', description: 'MongoDB ObjectId of the client', required: false })
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiProperty({ example: '0x62803b9487a315487a315487a315487a315487a3', description: 'Escrow contract address', required: false })
  @IsString()
  @IsOptional()
  contractAddress?: string;

  @ApiProperty({ example: 1776503505211, description: 'Blockchain ID or timestamp', required: false })
  @IsNumber()
  @IsOptional()
  blockchainId?: number;
}
