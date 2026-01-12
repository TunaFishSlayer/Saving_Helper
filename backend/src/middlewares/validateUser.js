export const validateUpdateProfile = (req, res, next) => {
  const { name } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ 
      message: "Name cannot be empty" 
    });
  }

  if (name.length > 100) {
    return res.status(400).json({ 
      message: "Name is too long" 
    });
  }

  next();
};

export const validateUpdatePassword = (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ 
      message: "Old password and new password are required" 
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      message: "New password must be at least 6 characters"
    });
  }

  if (oldPassword === newPassword) {
    return res.status(400).json({
      message: "New password must be different from old password"
    });
  }

  next();
};