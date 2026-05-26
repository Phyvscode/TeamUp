// Ambient declaration — no import/export so TypeScript treats this as a script
// and automatically merges it with @types/express's Express namespace.
// This adds req.user to every Request without any casting needed.
declare namespace Express {
  interface Request {
    user: import('./index').IUser;
  }
}