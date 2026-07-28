import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ScootersService } from './scooters.service';
import { Scooter } from './scooter.entity';
import { CreateScooterDto } from './dto/create-scooter.dto';
import { UpdateScooterDto } from './dto/update-scooter.dto';
import { ListScootersDto } from './dto/list-scooters.dto';

@Controller('scooters')
export class ScootersController {
  constructor(private readonly scooters: ScootersService) {}

  @Get()
  list(@Query() query: ListScootersDto): Promise<Scooter[]> {
    return this.scooters.list(query);
  }

  @Get(':id')
  one(@Param('id', ParseUUIDPipe) id: string): Promise<Scooter> {
    return this.scooters.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateScooterDto): Promise<Scooter> {
    return this.scooters.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateScooterDto,
  ): Promise<Scooter> {
    return this.scooters.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.scooters.remove(id);
  }
}
