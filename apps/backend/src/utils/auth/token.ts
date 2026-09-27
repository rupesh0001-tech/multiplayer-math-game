import jwt from "jsonwebtoken";
import { JWTPayload } from "../../types/user.types.js";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-do-not-use-in-prod";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export const generateToken = (
  payload: JWTPayload,
  expiresIn: string = JWT_EXPIRES_IN
): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: expiresIn as jwt.SignOptions["expiresIn"],
  });
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};
