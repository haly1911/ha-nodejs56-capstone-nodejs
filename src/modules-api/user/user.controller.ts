import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Role } from '../../common/decorators/role.decorator';
import { ResponseMessage } from '../../common/decorators/responseMessage.decorator';
import { GetUsersDto } from './dto/getUsers.dto';
import { UpdateProfileDto } from './dto/updateProfile.dto';
import { CurrentUser } from '../../common/decorators/currentUser.decorator';
import { ChangePasswordDto } from './dto/changePassword.dto';
import { UpdateUserStatusDto } from './dto/updateUserStatus.dto';
import { UpdateUserRoleDto } from './dto/updateUserRole.dto';
import { CreateUserDto } from './dto/createUser.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  MAX_FILE_SIZE,
  RATE_LIMIT_TTL,
} from '../../common/constant/app.constant';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Patch('profile')
  @ResponseMessage('Update profile successfully')
  async updateProfile(
    @Body() dto: UpdateProfileDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.userService.updateProfile(user.id, dto);
  }

  @Patch('password')
  @ResponseMessage('Change password successfully')
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.userService.changePassword(user.id, dto);
  }

  @Post('avatar')
  @Throttle({ default: { limit: 10, ttl: RATE_LIMIT_TTL } })
  @HttpCode(200)
  @ResponseMessage('Upload avatar successfully')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  async uploadAvatar(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.userService.uploadAvatar(user.id, file);
  }

  @Get()
  @Role('Admin', 'SuperAdmin')
  @ResponseMessage('Get users successfully')
  async findAll(@Query() query: GetUsersDto) {
    return this.userService.findAll(query);
  }

  @Get(':id')
  @Role('Admin', 'SuperAdmin')
  @ResponseMessage('Get user by id successfully')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Post()
  @Role('Admin', 'SuperAdmin')
  @ResponseMessage('Create user successfully')
  async createUser(
    @Body() dto: CreateUserDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.userService.createUser(dto, user);
  }

  @Patch(':id/status')
  @Role('Admin', 'SuperAdmin')
  @ResponseMessage('Update user status successfully')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.userService.updateStatus(id, dto, user);
  }

  @Patch(':id/role')
  @Role('SuperAdmin')
  @ResponseMessage('Update user role successfully')
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.userService.updateRole(id, dto, user);
  }

  @Delete(':id')
  @Role('Admin', 'SuperAdmin')
  @ResponseMessage('Delete user successfully')
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.userService.deleteUser(id, user);
  }
}
