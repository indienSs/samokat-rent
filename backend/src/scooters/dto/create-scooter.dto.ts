import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ScooterStatus } from '../../common/enums';

export class CreateScooterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  number: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  model: string;

  @IsOptional()
  @IsEnum(ScooterStatus)
  status?: ScooterStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  batteryLevel?: number;

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;
}
