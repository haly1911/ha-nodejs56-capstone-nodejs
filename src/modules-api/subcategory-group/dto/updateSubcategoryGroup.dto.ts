import { PartialType } from '@nestjs/swagger';
import { CreateSubcategoryGroupDto } from './createSubcategoryGroup.dto';

export class UpdateSubcategoryGroupDto extends PartialType(
  CreateSubcategoryGroupDto,
) {}
