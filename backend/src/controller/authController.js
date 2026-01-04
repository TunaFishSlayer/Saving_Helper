import EmailService from "../services/emailService.js";
import logger from "../utils/logger.js";
import { signToken } from "../utils/jwt.js";
import { OAuth2Client } from 'google-auth-library';
import UserService from "../services/UserService.js"; 
// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const user = await UserService.registerUser({
      email,
      password,
      name
    });

    const token = signToken(user);
    logger.info("New user registered: " + user.email);

    return res.status(201).json({
      message: "User registered successfully",
      user,
      token
    });
  } catch (error) {
    logger.warn("Registration error: " + error.message);
    return res.status(400).json({
      message: error.message
    });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserService.loginLocal({
      email,
      password
    });

    const token = signToken(user);
    logger.info("User logged in: " + user.email);

    return res.status(200).json({
      message: "Login success",
      user,
      token
    });
  } catch (error) {
    logger.warn("Login error: " + error.message);
    return res.status(401).json({
      message: error.message
    });
  }
};

// POST /api/auth/google
export const loginGoogle = async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({
        message: "Google credential is required"
      });
    }

    // Initialize Google OAuth client
    const client = new OAuth2Client();
    
    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
    });
    
    // Get user data from Google
    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    if (!email || !name) {
      return res.status(400).json({
        message: "Invalid Google token: missing email or name"
      });
    }

    const user = await UserService.loginGoogle({
      email,
      name,
      googleId
    });

    const token = signToken(user);
    logger.info("User logged in with Google: " + user.email);

    return res.status(200).json({
      message: "Google login success",
      user,
      token
    });
  } catch (error) {
    logger.warn("Google login error: " + error.message);
    return res.status(400).json({
      message: error.message || "Google login failed"
    });
  }
};

// POST /api/auth/request-reset-password
export const requestResetPassword = async (req, res) => {
  const { email } = req.body;
  const code = await UserService.requestResetPassword(email);
  if (code) {
    await EmailService.sendPasswordResetEmail(email, code);
    logger.info(`Password reset email sent to ${email}`);
    return res.status(200).json({ 
      message: "Password reset code sent to email"
    });
  } else {
    logger.warn(`Failed to generate reset code for ${email}`);
    return res.status(400).json({ message: "Failed to generate reset code" });
  }
};

// POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;
  try {
    await UserService.resetPassword(email, code, newPassword);
  } catch (error) {
    logger.warn(`Password reset failed for ${email}: ${error.message}`);
    return res.status(400).json({ message: error.message });
  }
  logger.info(`Password reset successful for ${email}`);
  return res.status(200).json({ message: "Password has been reset successfully" });
};