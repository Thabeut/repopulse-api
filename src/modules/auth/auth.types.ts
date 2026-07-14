export interface AuthUser {
  uid: string;
  email: string | null;
  name: string | null;
  picture: string | null;
}

declare module 'express' {
  interface Request {
    user?: AuthUser;
  }
}
