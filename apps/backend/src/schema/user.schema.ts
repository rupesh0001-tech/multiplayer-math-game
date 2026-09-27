import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters long")
    .max(30, "Username must be at most 30 characters long")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    )
    .trim(),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .max(100, "Password must not exceed 100 characters"),
  name: z.string().min(1).max(50).optional(),
});

export const loginSchema = z.object({
  // Allows logging in with either username or email
  identifier: z.string().min(1, "Username or email is required").trim(),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "New password must be at least 6 characters long").optional(),
}).refine(
  (data) => {
    if (data.newPassword && !data.currentPassword) {
      return false;
    }
    return true;
  },
  {
    message: "Current password is required to set a new password",
    path: ["currentPassword"],
  }
);
