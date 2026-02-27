import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { FirebaseAuthGuard, FIREBASE_USER } from '../auth/firebase-auth.guard';
import { FirebaseDecodedToken } from '../auth/firebase.service';

type RequestWithFirebase = Request & { [FIREBASE_USER]: FirebaseDecodedToken };

@ApiTags('users')
@ApiBearerAuth('firebase')
@Controller('users')
@UseGuards(FirebaseAuthGuard)
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'Current user (created if first time)' })
  @ApiResponse({ status: 401, description: 'Invalid or missing Firebase token' })
  async me(@Req() req: RequestWithFirebase) {
    return this.users.findOrCreateFromFirebase(req[FIREBASE_USER]);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user' })
  @ApiResponse({ status: 200, description: 'Updated user' })
  @ApiResponse({ status: 401, description: 'Invalid or missing Firebase token' })
  async updateMe(@Req() req: RequestWithFirebase, @Body() dto: UpdateUserDto) {
    return this.users.updateByFirebaseUid(req[FIREBASE_USER].uid, dto);
  }
}
