import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { RentalsService } from './rentals.service';
import { Rental, RentalWithDuration } from './rental.entity';
import { CreateRentalDto } from './dto/create-rental.dto';
import { ListRentalsDto } from './dto/list-rentals.dto';
import { PaginatedResult } from '../common/api-response';

@Controller('rentals')
export class RentalsController {
  constructor(private readonly rentals: RentalsService) {}

  @Get()
  list(
    @Query() query: ListRentalsDto,
  ): Promise<PaginatedResult<RentalWithDuration>> {
    return this.rentals.list(query);
  }

  @Get(':id')
  one(@Param('id', ParseUUIDPipe) id: string): Promise<Rental> {
    return this.rentals.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateRentalDto): Promise<Rental> {
    return this.rentals.create(dto);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  complete(@Param('id', ParseUUIDPipe) id: string): Promise<Rental> {
    return this.rentals.complete(id);
  }
}
