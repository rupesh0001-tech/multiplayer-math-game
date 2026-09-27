import { Router } from "express";
import { registerUser } from "../../controllers/user_controllers/registerUser.controller.js";
import { loginUser } from "../../controllers/user_controllers/loginUser.controller.js";
import { getUserProfile } from "../../controllers/user_controllers/getUserProfile.controller.js";
import { logoutUser } from "../../controllers/user_controllers/logoutUser.controller.js";
import {
  authenticateUser,
  validateRequest,
} from "../../middlewares/user_middlewares/auth_middlewares.js";
import {
  registerSchema,
  loginSchema,
} from "../../schema/user.schema.js";

const router: Router = Router();

// Public routes
router.post("/register", validateRequest(registerSchema), registerUser);
router.post("/login", validateRequest(loginSchema), loginUser);
router.post("/logout", logoutUser);

// Protected routes
router.get("/profile", authenticateUser, getUserProfile);
router.get("/me", authenticateUser, getUserProfile);

export default router;
