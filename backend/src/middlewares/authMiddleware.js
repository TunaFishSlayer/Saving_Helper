import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  try {
    // Header: Authorization: Bearer <token>
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authorization token missing"
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // User info available in req.user
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};

export default authMiddleware;
