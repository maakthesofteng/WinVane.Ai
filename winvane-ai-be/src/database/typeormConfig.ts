import { DataSourceOptions } from 'typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { SnakeNamingStrategy } from './snakeNamingStrategy';
import { TDatabaseConfig } from '../config/configuration';

export const buildDataSourceOptions = (
  dbConfig: TDatabaseConfig,
): DataSourceOptions => ({
  type: 'postgres',
  host: dbConfig.host,
  port: dbConfig.port,
  username: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.name,
  ssl: dbConfig.ssl ? { rejectUnauthorized: false } : false,
  synchronize: false,
  migrationsRun: false,
  namingStrategy: new SnakeNamingStrategy(),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
});

export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const dbConfig: TDatabaseConfig = {
    host: configService.get<string>('db.host', 'localhost'),
    port: Number(configService.get<number>('db.port', 5432)),
    user: configService.get<string>('db.user', 'winvane'),
    password: configService.get<string>('db.password', 'change_me'),
    name: configService.get<string>('db.name', 'winvane'),
    ssl: Boolean(configService.get<boolean>('db.ssl', false)),
  };

  return {
    ...buildDataSourceOptions(dbConfig),
    autoLoadEntities: true,
  };
};
