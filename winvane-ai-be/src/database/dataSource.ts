import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { buildDataSourceOptions } from './typeormConfig';
import { TDatabaseConfig } from '../config/configuration';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dbConfig: TDatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'winvane',
  password: process.env.DB_PASSWORD || 'change_me',
  name: process.env.DB_NAME || 'winvane',
  ssl: process.env.DB_SSL === 'true',
};

const appDataSource = new DataSource(buildDataSourceOptions(dbConfig));

export default appDataSource;
