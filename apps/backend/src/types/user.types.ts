import { Request } from "express";
import { z } from "zod";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
} from "../schema/user.schema.js";

// Inferred Types from Zod
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// JWT Payload Interface
export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
}

// User without sensitive data
export interface SafeUser {
  id: string;
  username: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Express Request with Authenticated User attached
export interface AuthenticatedRequest extends Request {
  user?: SafeUser;
}
