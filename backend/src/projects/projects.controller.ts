import { 
  Controller, Get, Post, Body, Param, UseGuards, Request 
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { 
  ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiBody 
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
  @ApiResponse({ status: 403, description: 'Forbidden. Only Clients can create projects.' })
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all projects' })
  @ApiResponse({ status: 200, description: 'Returns an array of all projects.' })
  findAll() {
    return this.projectsService.findAll();
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
        transactionHash: { type: 'string', example: '0xabc...' }
      } 
    } 
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
  @ApiParam({ name: 'index', description: 'The 0-based index of the milestone' })
  @ApiBody({ schema: { properties: { proof: { type: 'string', example: 'ipfs://hash' } } } })
  @ApiResponse({ status: 200, description: 'Milestone submission successful.' })
  submitMilestone(
    @Param('id') id: string,
    @Param('index') index: number,
    @Body('proof') proof: string,
  ) {
    return this.projectsService.submitMilestone(id, index, proof);
  }

  @Post(':id/milestones/:index/approve')
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Approve a milestone and release payment (Client only)' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiParam({ name: 'index', description: 'The 0-based index of the milestone' })
  @ApiBody({ 
    schema: { 
      properties: { 
        transactionHash: { type: 'string', example: '0xabc...' }
      } 
    } 
  })
  @ApiResponse({ status: 200, description: 'Milestone approved. Funds released.' })
  approveMilestone(
    @Param('id') id: string, 
    @Param('index') index: number,
    @Body('transactionHash') transactionHash: string,
  ) {
    return this.projectsService.approveMilestone(id, index, transactionHash);
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
    return this.projectsService.addUpdate(id, req.user._id || req.user.id || req.user.sub, description, files || []);
  }

  @Get(':id/updates')
  getUpdates(@Param('id') id: string) {
    return this.projectsService.getUpdates(id);
  }
}
