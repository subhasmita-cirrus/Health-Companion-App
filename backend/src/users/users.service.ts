import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { FirebaseDecodedToken } from '../auth/firebase.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async findOrCreateFromFirebase(firebaseUser: FirebaseDecodedToken): Promise<User> {
    const uid = firebaseUser.uid;
    if (!uid) {
      throw new Error('Firebase UID is missing');
    }
    let user = await this.userRepo.findOne({ where: { firebaseUid: uid } });
    if (user) {
      user.lastLoginAt = new Date();
      if (firebaseUser.name !== undefined) user.displayName = firebaseUser.name ?? null;
      if (firebaseUser.picture !== undefined) user.photoUrl = firebaseUser.picture ?? null;
      if (firebaseUser.email !== undefined) user.email = firebaseUser.email ?? '';
      await this.userRepo.save(user);
      return user;
    }
    user = this.userRepo.create({
      firebaseUid: uid,
      email: firebaseUser.email ?? '',
      displayName: firebaseUser.name ?? null,
      photoUrl: firebaseUser.picture ?? null,
      lastLoginAt: new Date(),
    });
    const saved = await this.userRepo.save(user);
    console.log('[Users] Created user:', saved.id, saved.firebaseUid, saved.email);
    return saved;
  }

  async findOneByFirebaseUid(firebaseUid: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { firebaseUid } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateByFirebaseUid(firebaseUid: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOneByFirebaseUid(firebaseUid);
    Object.assign(user, dto);
    return this.userRepo.save(user);
  }
}
