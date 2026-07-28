import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class CreateRentalDto {
  @IsUUID()
  scooterId: string;

  @IsUUID()
  customerId: string;

  @IsOptional()
  @IsDateString()
  startedAt?: string;
}
