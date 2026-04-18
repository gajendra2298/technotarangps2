import { IsString, IsOptional, IsArray, IsUrl, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../schemas/user.schema';

export class UpdateUserProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ required: false, enum: UserRole })
  @IsOptional()
  role?: UserRole;

  // --- Client Fields ---
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateIf((o) => o.website !== undefined && o.website !== '')
  @IsUrl({}, { message: 'website must be a URL address' })
  website?: string;

  // --- Freelancer Fields ---
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @ValidateIf((o) => o.skills !== undefined && Array.isArray(o.skills) && o.skills.length > 0)
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  experience?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @ValidateIf((o) => o.portfolioLinks !== undefined && Array.isArray(o.portfolioLinks) && o.portfolioLinks.length > 0)
  @IsArray()
  @IsUrl({}, { each: true, message: 'each value in portfolioLinks must be a URL address' })
  portfolioLinks?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateIf((o) => o.github !== undefined && o.github !== '')
  @IsUrl({}, { message: 'github must be a URL address' })
  github?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateIf((o) => o.linkedin !== undefined && o.linkedin !== '')
  @IsUrl({}, { message: 'linkedin must be a URL address' })
  linkedin?: string;
}
