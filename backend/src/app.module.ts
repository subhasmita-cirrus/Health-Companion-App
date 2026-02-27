import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AppController } from './app.controller';
import { User } from './users/entities/user.entity';
import { AuthModule } from './auth/auth.module';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL');
        const isDev = config.get('NODE_ENV') === 'development';
        const baseOptions = {
          entities: [User],
          synchronize: isDev,
          logging: isDev,
        };
        if (databaseUrl) {
          return { type: 'postgres', url: databaseUrl, ...baseOptions };
        }
        const password = config.get<string>('DB_PASSWORD') ?? '';
        return {
          type: 'postgres',
          host: config.get('DB_HOST', 'localhost'),
          port: config.get<number>('DB_PORT', 5432),
          username: config.get('DB_USERNAME', 'postgres'),
          password: String(password),
          database: config.get('DB_NAME', 'health_companion'),
          ...baseOptions,
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
