import jwt from "jsonwebtoken";
import { stringify } from "querystring";

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

function calculate(a, b, op){ 
  if(op === '+') return a + b;
  if(op === '-') return a - b;
  if(op === '*') return a * b;
  if(op === '/') return a / b;
}


export function generateQues(n : number){ 

  const ques = []
  const oprant = ['+', '-', '*', '/']

  for(let i=0; i<n; i++){ 
    let op1 = (( Math.random() * 9 ) + 1); 
    let op2 =( Math.random() * 9 ) + 1;
    let o = oprant[ ( Math.random() * 3 ) + 1] 

    let a; 
    
    const que = { 
      que : op1.toString() + o +  op2.toString() , 
      ans : calculate(op1, op2, o)
    }

    ques.push(que)
    
  }


  return ques




  return ques
}

// Aliases for convenience
export const verifyToken = verifyJWT;
export const generateToken = generateJWT;
