import logger from "../utils/logger.js";
import UserService from "../services/UserService.js";

// USER GET users/me
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await UserService.getUserById(userId);
    logger.info("Fetched profile for userId: " + userId);

    return res.status(200).json({ user });
  } catch (error) {
    logger.warn("Get profile error: " + error.message);
    return res.status(401).json({
      message: "Unauthorized"
    });
  }
};

// USER PUT users/me/update
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId; // User updates their own profile
    const { name } = req.body;
    
    // Only allow updating specific fields
    const updateData = {};
    if (name) updateData.name = name;
    
    const user = await UserService.updateUser(userId, updateData);
    
    logger.info(`User ${userId} updated their profile`);
    
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user
    });
  } catch (error) {
    logger.error("Error in updateUserProfile: " + error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// User DELETE users/me  (delete own account)
export const deleteOwnAccount = async (req, res) => {
  try {
    const userId = req.user.userId;

    await UserService.deleteUser(userId);

    logger.info(`User ${userId} deleted their own account`);

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully"
    });
  } catch (error) {
    logger.error("Error in deleteOwnAccount: " + error.message);
    const statusCode = error.message === "User not found" ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};


export const updatePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { oldPassword, newPassword } = req.body;
    await UserService.updatePassword(userId, oldPassword, newPassword);
    
    logger.info(`User ${userId} updated their password`);
    return res.status(200).json({
      success: true,
      message: "Password updated successfully"
    });
  } catch (error) {
    logger.error("Error in updatePassword: " + error.message);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};