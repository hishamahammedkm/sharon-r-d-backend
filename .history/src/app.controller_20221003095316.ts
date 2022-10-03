import {
  Controller,
  Request,
  Post,
  UseGuards,
  Get,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { extname } from 'path';

import { FileInterceptor } from '@nestjs/platform-express';
import multer from 'multer';
import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard } from './auth/strategy/jwt-auth.guard';
import { LocalAuthGuard } from './auth/strategy/local-auth.guard';
import { diskStorage } from 'multer';
@Controller('')
export class AppController {
  constructor(
    private authService: AuthService,
    private appService: AppService,
  ) {}

  @Get()
  gi(){
    ret
  }
  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }
  @Get('/')
  get() {
    return 'ok';
  }
  @Post('upload')

  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './dist/aws/upload',
        filename: (req, file, cb) => {
          // Generating a 32 random chars long string
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          //Calling the callback passing the random name generated with the original extension name
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.appService.processFile(file);
  }
}
