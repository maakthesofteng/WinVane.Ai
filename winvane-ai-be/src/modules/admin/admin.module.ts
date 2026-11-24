import { Module } from '@nestjs/common';
import { AdminController } from './controllers/admin.controller';

@Module({
  controllers: [AdminController],
  providers: [],
  exports: [],
})
export class AdminModule {}
