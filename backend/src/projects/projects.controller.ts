import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Create a new escrow project (Client only)' })
  @ApiResponse({ status: 201, description: 'Project successfully created.' })
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Post('create-and-fund')
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Create and Fund a project in one go using on-chain TX' })
  createAndFund(@Body() body: { txHash: string, project: any }) {
    return this.projectsService.createAndFundFromTx(body.txHash, body.project);
  }

  @Get()
  @ApiOperation({ summary: 'List all open projects' })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of all projects currently OPEN for bidding.',
  })
  findAll() {
    return this.projectsService.findAll();
  }

  @Get('client')
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: "Get the current client's projects" })
  findClientProjects(@Request() req) {
    return this.projectsService.findClientProjects(req.user.sub);
  }

  @Get('freelancer')
  @Roles(UserRole.FREELANCER)
  @ApiOperation({ summary: "Get the current freelancer's projects" })
  findFreelancerProjects(@Request() req) {
    return this.projectsService.findFreelancerProjects(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific project' })
  @ApiParam({ name: 'id', description: 'The MongoDB ObjectID of the project' })
  @ApiResponse({ status: 200, description: 'Project details found.' })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Post(':id/fund')
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Fund the escrow for a project (Client only)' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiBody({
    schema: {
      properties: {
        amount: { type: 'string', example: '1.5' },
        transactionHash: { type: 'string', example: '0xabc...' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Project successfully funded.' })
  fund(
    @Param('id') id: string,
    @Body('amount') amount: string,
    @Body('transactionHash') transactionHash: string,
  ) {
    return this.projectsService.fund(id, amount, transactionHash);
  }

  @Post(':id/milestones/:index/submit')
  @Roles(UserRole.FREELANCER)
  @ApiOperation({ summary: 'Submit work for a milestone (Freelancer only)' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiParam({
    name: 'index',
    description: 'The 0-based index of the milestone',
  })
  @ApiBody({
    schema: {
      properties: { proof: { type: 'string', example: 'ipfs://hash' } },
    },
  })
  @ApiResponse({ status: 200, description: 'Milestone submission successful.' })
  submitMilestone(
    @Param('id') id: string,
    @Param('index') index: number,
    @Body('proof') proof: string,
  ) {
    return this.projectsService.submitMilestone(id, index, proof);
  }

  @Post(':id/milestones/:index/release')
  @Roles(UserRole.CLIENT)
  @ApiOperation({
    summary: 'Approve a milestone and release payment (Client only)',
  })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiParam({
    name: 'index',
    description: 'The 0-based index of the milestone',
  })
  @ApiBody({
    schema: {
      properties: {
        transactionHash: { type: 'string', example: '0xabc...' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Milestone approved. Funds released.',
  })
  releasePayment(
    @Param('id') id: string,
    @Param('index') index: number,
    @Body('transactionHash') transactionHash: string,
  ) {
    return this.projectsService.releasePayment(id, index, transactionHash);
  }

  @Post(':id/update')
  @Roles(UserRole.FREELANCER)
  @ApiOperation({ summary: 'Add a project update' })
  addUpdate(
    @Request() req,
    @Param('id') id: string,
    @Body('description') description: string,
    @Body('files') files: string[],
  ) {
    return this.projectsService.addUpdate(
      id,
      req.user.sub,
      description,
      files || [],
    );
  }

  @Get(':id/updates')
  getUpdates(@Param('id') id: string) {
    return this.projectsService.getUpdates(id);
  }
}
