import jwt from "jsonwebtoken";

// Common Environment & Configuration
export const JWT_SECRET =
  process.env.JWT_SECRET || "super-secret-jwt-key-change-in-production-12345";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// JWT Payload Interface
export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  [key: string]: any;
}

// Verify JWT token with fallback to default JWT_SECRET
export const verifyJWT = (
  token: string,
  secret: string = JWT_SECRET
): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, secret) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

// Generate JWT token with default or custom secret & expiry
export const generateJWT = (
  payload: JWTPayload,
  secret: string = JWT_SECRET,
  expiresIn: string = JWT_EXPIRES_IN
): string => {
  return jwt.sign(payload, secret, {
    expiresIn: expiresIn as jwt.SignOptions["expiresIn"],
  });
};

export interface Question {
  id: string;
  op1: number;
  op2: number;
  operand: string;
  que: string;
  ans: number;
}

export type SafeQuestion = Omit<Question, "ans">;

export function calculate(a: number, b: number, op: string): number {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
      return a * b;
    case "/":
      return b !== 0 ? Math.floor(a / b) : 0;
    default:
      return a + b;
  }
}

export function generateQues(n: number = 10): Question[] {
  const operators = ["+", "-", "*", "/"];
  const questions: Question[] = [];

  for (let i = 0; i < n; i++) {
    const op = operators[Math.floor(Math.random() * operators.length)] || "+";
    let op1: number;
    let op2: number;
    let answer: number;

    if (op === "+") {
      op1 = Math.floor(Math.random() * 50) + 1;
      op2 = Math.floor(Math.random() * 50) + 1;
      answer = op1 + op2;
    } else if (op === "-") {
      op1 = Math.floor(Math.random() * 60) + 10;
      op2 = Math.floor(Math.random() * op1) + 1; // ensure positive answer
      answer = op1 - op2;
    } else if (op === "*") {
      op1 = Math.floor(Math.random() * 12) + 2;
      op2 = Math.floor(Math.random() * 12) + 2;
      answer = op1 * op2;
    } else {
      // Division: choose quotient and divisor, compute dividend
      op2 = Math.floor(Math.random() * 10) + 2;
      const quotient = Math.floor(Math.random() * 12) + 1;
      op1 = op2 * quotient;
      answer = quotient;
    }

    questions.push({
      id: `q_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`,
      op1,
      op2,
      operand: op,
      que: `${op1} ${op === "*" ? "×" : op === "/" ? "÷" : op} ${op2}`,
      ans: answer,
    });
  }

  return questions;
}

// Aliases for convenience
export const verifyToken = verifyJWT;
export const generateToken = generateJWT;
