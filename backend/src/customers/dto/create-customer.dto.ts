import { IsString, MaxLength, MinLength, Matches } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @IsString()
  @Matches(/^\+?[\d\s\-()]{7,20}$/, {
    message: 'phone должен быть корректным номером телефона',
  })
  phone: string;
}
