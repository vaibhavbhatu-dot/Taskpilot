import jwt from 'jsonwebtoken';

const SECRET = process.env.MASTER_ADMIN_JWT_SECRET || 'master-admin-secret';
const EXPIRY = '4h';

export interface MasterAdminTokenPayload {
  adminId: string;
  email: string;
  role: string;
}

export function generateMasterAdminToken(payload: MasterAdminTokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRY });
}

export function verifyMasterAdminToken(token: string): MasterAdminTokenPayload {
  return jwt.verify(token, SECRET) as MasterAdminTokenPayload;
}
