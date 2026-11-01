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
import { SubcategoryService } from './subcategory.service';
import { Public } from '../../common/decorators/public.decorator';
import { ResponseMessage } from '../../common/decorators/responseMessage.decorator';
import { GetSubcategoriesDto } from './dto/getSubcategories.dto';
import { Role } from '../../common/decorators/role.decorator';
import { CreateSubcategoryDto } from './dto/createSubcategory.dto';
import { UpdateSubcategoryDto } from './dto/updateSubcategory.dto';
import { CurrentUser } from '../../common/decorators/currentUser.decorator';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Subcategory')
@Controller('subcategory')
export class SubcategoryController {
  constructor(private subcategoryService: SubcategoryService) {}

  @Get()
  @Public()
  @ResponseMessage('Get subcategories successfully')
  async findAll(@Query() query: GetSubcategoriesDto) {
    return this.subcategoryService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ResponseMessage('Get subcategory by id successfully')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.subcategoryService.findOne(id);
  }

  @Post()
  @Role('Admin', 'SuperAdmin')
  @ResponseMessage('Create subcategory successfully')
  async createSubcategory(@Body() dto: CreateSubcategoryDto) {
    return this.subcategoryService.createSubcategory(dto);
  }

  @Patch(':id')
  @Role('Admin', 'SuperAdmin')
  @ResponseMessage('Update subcategory successfully')
  async updateSubcategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubcategoryDto,
  ) {
    return this.subcategoryService.updateSubcategory(id, dto);
  }

  @Delete(':id')
  @Role('Admin', 'SuperAdmin')
  @ResponseMessage('Delete subcategory successfully')
  async removeSubcategory(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number },
  ) {
    return this.subcategoryService.deleteSubcategory(id, user.id);
  }
}
