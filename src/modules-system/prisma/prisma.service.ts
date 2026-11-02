import { Injectable } from '@nestjs/common';
import { PrismaClient } from './generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { DATABASE_URL } from '../../common/constant/app.constant';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const url = new URL(DATABASE_URL as string);

    const adapter = new PrismaMariaDb({
      user: url.username,
      password: url.password,
      host: url.hostname,
      port: Number(url.port),
      database: url.pathname.slice(1),
      allowPublicKeyRetrieval: true,
    });
    super({
      adapter,
      omit: {
        users: { password: true },
      },
    });
  }

  async onModuleInit() {
    try {
      await this.$queryRaw`SELECT 1 + 1 AS result`;
      console.log('✅ [PRISMA] Connection has been established successfully.');
    } catch (error) {
      console.error('❌ [PRISMA] Unable to connect to the database:', error);
    }
  }
}
