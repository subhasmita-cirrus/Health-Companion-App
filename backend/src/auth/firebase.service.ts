import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as admin from 'firebase-admin';

export interface FirebaseDecodedToken {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
}

/** Normalize private key so PEM is valid: handle \\n, line endings, trim. */
function normalizePrivateKey(value: string): string {
  if (!value || typeof value !== 'string') return '';
  let key = value.trim();
  // Remove BOM if present
  if (key.charCodeAt(0) === 0xfeff) key = key.slice(1);
  // Remove surrounding quotes (from .env)
  if (key.startsWith('"') && key.endsWith('"')) key = key.slice(1, -1);
  if (key.startsWith("'") && key.endsWith("'")) key = key.slice(1, -1);
  // Literal \n in .env (backslash + n) -> real newline
  key = key.replace(/\\n/g, '\n');
  // Normalize line endings
  key = key.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  // Trim each line (trailing space can break PEM) and ensure single newlines
  key = key
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n');
  return key.trim();
}

@Injectable()
export class FirebaseService implements OnModuleInit {
  private app: admin.app.App | null = null;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    try {
      const credentialsPath = this.config.get<string>('GOOGLE_APPLICATION_CREDENTIALS');
      const cwd = process.cwd();

      const tryLoadFrom = (filePath: string): boolean => {
        if (!filePath || !fs.existsSync(filePath)) return false;
        try {
          const keyFile = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          if (!keyFile.private_key || !keyFile.client_email || !keyFile.project_id) return false;
          const privateKey = normalizePrivateKey(keyFile.private_key);
          this.app = admin.initializeApp({
            credential: admin.credential.cert({
              projectId: keyFile.project_id,
              clientEmail: keyFile.client_email,
              privateKey,
            }),
          });
          return true;
        } catch {
          return false;
        }
      };

      if (credentialsPath && credentialsPath.trim()) {
        const resolvedPath = path.isAbsolute(credentialsPath)
          ? credentialsPath
          : path.resolve(cwd, credentialsPath.trim());
        if (tryLoadFrom(resolvedPath)) return;
      }

      const dir = fs.existsSync(path.join(cwd, 'src')) ? cwd : path.join(cwd, '..');
      const dirEntries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of dirEntries) {
        if (!e.isFile() || !e.name.endsWith('.json')) continue;
        if (
          e.name === 'firebase-service-account.json' ||
          (e.name.includes('firebase') && e.name.includes('adminsdk'))
        ) {
          if (tryLoadFrom(path.join(dir, e.name))) return;
        }
      }

      const projectId = this.config.get<string>('FIREBASE_PROJECT_ID');
      const clientEmail = this.config.get<string>('FIREBASE_CLIENT_EMAIL');
      const privateKeyRaw = this.config.get<string>('FIREBASE_PRIVATE_KEY');

      if (projectId && clientEmail && privateKeyRaw) {
        const privateKey = normalizePrivateKey(privateKeyRaw);
        if (privateKey.includes('BEGIN') && privateKey.includes('END')) {
          this.app = admin.initializeApp({
            credential: admin.credential.cert({
              projectId,
              clientEmail,
              privateKey,
            }),
          });
          return;
        }
      }
    } catch {
      // Firebase not configured or invalid credentials; auth endpoints will fail until fixed.
    }
  }

  async verifyIdToken(idToken: string): Promise<FirebaseDecodedToken> {
    if (!this.app) {
      throw new Error('Firebase Admin is not initialized');
    }
    const decoded = await this.app.auth().verifyIdToken(idToken);
    const uid = decoded.uid ?? (decoded as { sub?: string }).sub;
    if (!uid) {
      throw new Error('Token missing uid');
    }
    const userRecord = await this.app.auth().getUser(uid);
    return {
      uid,
      email: userRecord.email ?? decoded.email ?? '',
      name: userRecord.displayName ?? (decoded as { name?: string }).name ?? undefined,
      picture: userRecord.photoURL ?? decoded.picture ?? undefined,
    };
  }
}
