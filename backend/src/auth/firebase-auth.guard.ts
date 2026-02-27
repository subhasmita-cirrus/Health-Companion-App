import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { FirebaseService, FirebaseDecodedToken } from './firebase.service';

export const FIREBASE_USER = 'firebaseUser';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private firebase: FirebaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    try {
      const decoded: FirebaseDecodedToken = await this.firebase.verifyIdToken(token);
      (request as Request & { [FIREBASE_USER]: FirebaseDecodedToken })[FIREBASE_USER] = decoded;
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid or expired token';
      console.error('[Auth] Token verification failed:', message);
      // Expose reason in response for debugging (e.g. "Token expired", "Firebase Admin is not initialized")
      throw new UnauthorizedException(message);
    }
  }
}
