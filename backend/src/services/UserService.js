import {hashPassword, comparePassword} from "../utils/hash.js";
import User from "../models/User.js";
import { generateResetToken, verifyResetCode } from "../utils/resetCodeGen.js";

class UserService {
    static async registerUser({email, password, name}) {
        const existingUser = await User.findOne({email});
        if (existingUser) {
            throw new Error("Email already in use");
        }

        const passwordHash = await hashPassword(password);
        const newUser = new User({email, passwordHash, name, provider: 'local'});
        await newUser.save();
        return newUser;
    }

    static async loginLocal({email, password}) {
        const user = await User.findOne({email}).select('-resetCode -resetCodeExpiry');
        if (!user) {
            throw new Error("Invalid email or password");
        }
        if(user.provider !== 'local') {
            throw new Error("Please login using Google");
        }
        const isMatch = await comparePassword(password, user.passwordHash);
        if (!isMatch) {
            throw new Error("Invalid email or password");
        }
        return user;
    }

    static async loginGoogle({email,name,googleId}) {
        let user = await User.findOne({$or: [{email}, {googleId}]}).select('-resetCode -resetCodeExpiry');
        if (!user) {
            user = new User({email, name, googleId, provider: 'google'});
            await user.save();
        }
        return user;
    }

    static async getUserById(userId) {
        const user = await User.findById(userId).select('-passwordHash -resetCode -resetCodeExpiry');
        if (!user) {
            throw new Error("User not found");
        }
        return user;
    }

    static async getUserByEmail(email) {
        const user = await User.findOne({email}).select('-passwordHash -resetCode -resetCodeExpiry');
        if (!user) {
            throw new Error("User not found");
        }
        return user;
    }

    static async getAllUsers() {
        const users = await User.find().select('-passwordHash -resetCode -resetCodeExpiry');
        return users;
    }

    static async deleteUser(userId) {
        const user = await User.findByIdAndDelete(userId).select('-passwordHash -resetCode -resetCodeExpiry');
        if (!user) {
            throw new Error("User not found");
        }
        return user;
    }

    static async updateUser(userId, updateData) {
        const user = await User.findByIdAndUpdate(userId, updateData, {new: true}).select('-passwordHash -resetCode -resetCodeExpiry');
        if (!user) {
            throw new Error("User not found");
        }
        return user;
    }

    static async updatePassword(userId, oldPassword, newPassword) {
        const user = await User.findById(userId).select('-resetCode -resetCodeExpiry');
        if(!user) {
            throw new Error("User not found");
        }
        const isMatch = await comparePassword(oldPassword, user.passwordHash);
        if (!isMatch) {
            throw new Error("Old password is incorrect");
        }
        const newHashedPassword = await hashPassword(newPassword);
        user.passwordHash = newHashedPassword;
        await user.save();
        return user;
    }

    static async requestResetPassword(email) {
        const user = await User.findOne({email}).select('-passwordHash -resetCode');
        if (!user) {
            return null;
        }
        const token = generateResetToken();
        user.resetCode = token.code;
        user.resetCodeExpiry = token.expiresAt;
        await user.save();
        return user.resetCode;
    }

    static async resetPassword(email, code, newPassword) {
        const user = await User.findOne({email}).select('-passwordHash');
        if (!user) {
            throw new Error("User not found");
        }
        const verification = verifyResetCode(code, user.resetCode, user.resetCodeExpiry);
        if (!verification.valid) {
            if (verification.reason === 'expired') {
                user.resetCode = null;
                user.resetCodeExpiry = null;
                await user.save();
                throw new Error("Reset code has expired");
            }
            throw new Error("Invalid reset code");
        }
        const newHashedPassword = await hashPassword(newPassword);
        user.passwordHash = newHashedPassword;
        user.resetCode = null;
        user.resetCodeExpiry = null;
        await user.save();
        return user;
    }
}

export default UserService;