import { Request, Response, NextFunction } from "express";

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
}

export const sendSuccess = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T
): Response => {
  const responsePayload: ApiResponse<T> = {
    success: true,
    message,
    ...(data !== undefined && { data }),
  };
  return res.status(statusCode).json(responsePayload);
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  errors?: any
): Response => {
  const responsePayload: ApiResponse = {
    success: false,
    message,
    ...(errors !== undefined && { errors }),
  };
  return res.status(statusCode).json(responsePayload);
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
