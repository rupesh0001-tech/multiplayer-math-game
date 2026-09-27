import { Request, Response } from "express";
import { sendSuccess } from "../../utils/common/response.js";

export const logoutUser = async (
  _req: Request,
  res: Response
): Promise<void> => {
  // Clear the authentication cookie
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  sendSuccess(res, 200, "Logged out successfully");
};
