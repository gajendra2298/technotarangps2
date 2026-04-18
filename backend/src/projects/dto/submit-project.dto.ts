import { IsString, IsOptional, IsUrl, IsArray, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitProjectDto {
  @ApiProperty({ description: 'Final project delivery description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'GitHub repository link', required: false })
  @IsOptional()
  @IsUrl()
  github?: string;

  @ApiProperty({ description: 'ZIP file download URL', required: false })
  @IsOptional()
  @IsUrl()
  zipUrl?: string;

  @ApiProperty({ description: 'List of image URLs for proof', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ description: 'List of document URLs (PDFs)', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  docs?: string[];
}
