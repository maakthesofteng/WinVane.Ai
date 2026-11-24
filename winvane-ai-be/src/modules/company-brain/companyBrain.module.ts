import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthCoreModule } from '../auth-core/authCore.module';
import { CompanyBrainController } from './controllers/companyBrain.controller';
import { CompanyBrain } from './entities/companyBrain.entity';
import { CompanyBrainCaseStudy } from './entities/companyBrainCaseStudy.entity';
import { CompanyBrainContact } from './entities/companyBrainContact.entity';
import { CompanyBrainPdfService } from './services/companyBrainPdf.service';
import { CompanyBrainService } from './services/companyBrain.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CompanyBrain,
      CompanyBrainCaseStudy,
      CompanyBrainContact,
    ]),
    AuthCoreModule,
  ],
  controllers: [CompanyBrainController],
  providers: [CompanyBrainService, CompanyBrainPdfService],
})
export class CompanyBrainModule {}
