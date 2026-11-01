import { Module } from '@nestjs/common';
import { SubcategoryGroupController } from './subcategory-group.controller';
import { SubcategoryGroupService } from './subcategory-group.service';

@Module({
  controllers: [SubcategoryGroupController],
  providers: [SubcategoryGroupService],
})
export class SubcategoryGroupModule {}
