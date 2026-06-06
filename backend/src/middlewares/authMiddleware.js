import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const deviceUuid = req.headers['x-device-uuid'];

    // If no JWT but deviceUuid header is present, treat as Guest session
    if ((!authHeader || !authHeader.startsWith("Bearer ")) && deviceUuid) {
      req.user = {
        userId: `guest_${deviceUuid}`,
        email: "offline@guest",
        name: "Offline Guest",
        isGuest: true
      };
      return next();
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authorization token missing"
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      isGuest: false
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};

export default authMiddleware;
