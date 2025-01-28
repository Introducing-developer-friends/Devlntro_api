import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const srcOrDist = process.env.NODE_ENV === 'production' ? 'dist' : 'src';
const entitiesExtension = process.env.NODE_ENV === 'production' ? 'js' : 'ts';

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [`${srcOrDist}/**/*.entity.${entitiesExtension}`],
  migrations: [`${srcOrDist}/migrations/*{.ts,.js}`],
  synchronize: false,
});
