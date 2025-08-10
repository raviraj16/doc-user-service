import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { TriggerIngestionDto } from './dto/trigger-ingestion.dto';
import { UpdateIngestionDto } from './dto/update-ingestion.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Ingestion')
@Controller('ingestion')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('trigger')
  @ApiOperation({ summary: 'Trigger a new ingestion job' })
  @ApiResponse({ status: 201, description: 'Ingestion job created' })
  trigger(@Body() dto: TriggerIngestionDto) {
    return this.ingestionService.trigger(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List ingestion jobs' })
  list() {
    return this.ingestionService.list();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ingestion job by id' })
  @ApiParam({ name: 'id', description: 'Ingestion job id (UUID)' })
  get(@Param('id') id: string) {
    return this.ingestionService.get(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update ingestion job status (callback/webhook)' })
  @ApiParam({ name: 'id', description: 'Ingestion job id (UUID)' })
  update(@Param('id') id: string, @Body() dto: UpdateIngestionDto) {
    return this.ingestionService.update(id, dto);
  }
}
