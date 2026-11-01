import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';
import { Trim } from '../../../common/decorators/trim.decorator';

export class CreateGigDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Trim()
  title: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  price: number;

  @IsString()
  description: string;

  @IsString()
  @MaxLength(255)
  short_description: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  subcategory_id: number;
}
