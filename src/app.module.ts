import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules-system/prisma/prisma.module';
import { AuthModule } from './modules-api/auth/auth.module';
import { TokenModule } from './modules-system/token/token.module';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ProtectGuard } from './common/guard/protect.guard';
import { RoleGuard } from './common/guard/role.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseSuccessInterceptor } from './common/interceptors/response.interceptor';
import { AllExceptionsFilter } from './common/filters/allExceptions.filter';
import { CategoryModule } from './modules-api/category/category.module';
import { SubcategoryGroupModule } from './modules-api/subcategory-group/subcategory-group.module';
import { SubcategoryModule } from './modules-api/subcategory/subcategory.module';
import { GigModule } from './modules-api/gig/gig.module';
import { UserModule } from './modules-api/user/user.module';
import { OrderModule } from './modules-api/order/order.module';
import { ReviewModule } from './modules-api/review/review.module';
import { ReportModule } from './modules-api/report/report.module';
import { CloudinaryModule } from './modules-system/cloudinary/cloudinary.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    TokenModule,
    CategoryModule,
    SubcategoryGroupModule,
    SubcategoryModule,
    GigModule,
    UserModule,
    OrderModule,
    ReviewModule,
    ReportModule,
    CloudinaryModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ProtectGuard },
    { provide: APP_GUARD, useClass: RoleGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResponseSuccessInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
