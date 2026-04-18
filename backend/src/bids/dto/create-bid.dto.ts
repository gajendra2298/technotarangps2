import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBidDto {
  @ApiProperty({ example: '69f337efd625497072873818', description: 'ID of the project being bid on' })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ example: 1000000000000000000, description: 'Proposed amount in Wei (1 ETH)' })
  @IsNumber()
  proposedAmount: number;

  @ApiProperty({ example: 'I am highly experienced in this stack.', description: 'Message to the client' })
  @IsString()
  @IsNotEmpty()
  message: string;
}
