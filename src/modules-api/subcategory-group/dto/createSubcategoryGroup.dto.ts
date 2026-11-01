import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';
import { Trim } from '../../../common/decorators/trim.decorator';

export class CreateSubcategoryGroupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Trim()
  name: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  category_id: number;
}
