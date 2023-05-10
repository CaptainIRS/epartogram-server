import { User } from "../types";

export {};

declare global {
  namespace Express {
    export interface Request {
      user?: User;
      hospitalId?: string;
    }
  }
}
