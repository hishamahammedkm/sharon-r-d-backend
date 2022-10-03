import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { AwsService } from './aws/aws.service';
@Module({
  imports: [
    AuthModule,
    UsersModule,
    MulterModule.register({
      dest: './upload',
    }),
    ConfigModule.forRoot({
      isGlobal:true
    }),
  ],
  controllers: [AppController],
  providers: [AppService, AwsService],
})
export class AppModule {}
