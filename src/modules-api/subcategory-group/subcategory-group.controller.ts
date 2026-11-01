import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { SubcategoryGroupService } from './subcategory-group.service';
import { Public } from '../../common/decorators/public.decorator';
import { ResponseMessage } from '../../common/decorators/responseMessage.decorator';
import { GetSubcategoryGroupsDto } from './dto/getSubcategoryGroups.dto';
import { Role } from '../../common/decorators/role.decorator';
import { CreateSubcategoryGroupDto } from './dto/createSubcategoryGroup.dto';
import { UpdateSubcategoryGroupDto } from './dto/updateSubcategoryGroup.dto';
import { CurrentUser } from '../../common/decorators/currentUser.decorator';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Subcategory group')
@Controller('subcategory-group')
export class SubcategoryGroupController {
  constructor(private subcategoryGroupService: SubcategoryGroupService) {}

  @Get()
  @Public()
  @ResponseMessage('Get subcategory groups successfully')
  async findAll(@Query() query: GetSubcategoryGroupsDto) {
    return this.subcategoryGroupService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ResponseMessage('Get subcategory group by id successfully')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.subcategoryGroupService.findOne(id);
  }

  @Post()
  @Role('Admin', 'SuperAdmin')
  @ResponseMessage('Create subcategory group successfully')
  async createSubcategoryGroup(@Body() dto: CreateSubcategoryGroupDto) {
    return this.subcategoryGroupService.createSubcategoryGroup(dto);
  }

  @Patch(':id')
  @Role('Admin', 'SuperAdmin')
  @ResponseMessage('Update subcategory group successfully')
  async updateSubcategoryGroup(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubcategoryGroupDto,
  ) {
    return this.subcategoryGroupService.updateSubcategoryGroup(id, dto);
  }

  @Delete(':id')
  @Role('Admin', 'SuperAdmin')
  @ResponseMessage('Delete subcategory group successfully')
  async removeSubcategoryGroup(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number },
  ) {
    return this.subcategoryGroupService.deleteSubcategoryGroup(id, user.id);
  }
}
