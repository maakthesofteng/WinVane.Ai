import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './entities/auditLog.entity';
import { AuditLogService } from './auditLog.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditLogService],
  exports: [TypeOrmModule, AuditLogService],
})
export class AuditLogModule {}
