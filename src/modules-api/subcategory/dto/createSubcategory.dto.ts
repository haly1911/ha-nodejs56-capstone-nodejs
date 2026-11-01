import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';
import { Trim } from '../../../common/decorators/trim.decorator';

export class CreateSubcategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Trim()
  name: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  subcategory_group_id: number;
}
