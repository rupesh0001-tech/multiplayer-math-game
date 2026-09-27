import {
  verifyJWT,
  generateJWT,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWTPayload,
} from "@repo/common";

export const generateToken = (
  payload: JWTPayload,
  expiresIn: string = JWT_EXPIRES_IN
): string => {
  return generateJWT(payload, JWT_SECRET, expiresIn);
};

export const verifyToken = (token: string): JWTPayload | null => {
  return verifyJWT(token, JWT_SECRET);
};

export { JWT_SECRET, JWT_EXPIRES_IN, verifyJWT, generateJWT };
