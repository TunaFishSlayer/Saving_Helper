import jwt from "jsonwebtoken";

export const signToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      name: user.name
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};
