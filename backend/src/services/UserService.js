import { hashPassword, comparePassword } from "../utils/hash.js";
import { prisma } from "../config/db.js";
import { generateResetToken, verifyResetCode } from "../utils/resetCodeGen.js";

class UserService {
    static async seedDefaultCategories(userId) {
        const defaultCategories = [
            { name: "Food & Dining", type: "expense", description: "Groceries, restaurants, fast food" },
            { name: "Housing", type: "expense", description: "Rent, mortgage, home maintenance" },
            { name: "Transportation", type: "expense", description: "Gas, public transit, car maintenance" },
            { name: "Utilities", type: "expense", description: "Electricity, water, internet, phone" },
            { name: "Entertainment", type: "expense", description: "Movies, games, subscriptions" },
            { name: "Shopping", type: "expense", description: "Clothing, electronics, personal items" },
            { name: "Salary", type: "income", description: "Primary job income" },
            { name: "Side Hustle", type: "income", description: "Freelance or part-time work" },
            { name: "Gifts", type: "income", description: "Gifts and bonuses" }
        ];

        await prisma.category.createMany({
            data: defaultCategories.map(cat => ({
                ...cat,
                userId
            })),
            skipDuplicates: true
        });
    }

    static async registerUser({ email, password, name }) {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new Error("Email already in use");
        }

        const passwordHash = await hashPassword(password);
        const newUser = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
                provider: 'local'
            }
        });
        
        await this.seedDefaultCategories(newUser.id);

        const { passwordHash: ph, ...publicUser } = newUser;
        return publicUser;
    }

    static async loginLocal({ email, password }) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new Error("Invalid email or password");
        }
        if (user.provider !== 'local') {
            throw new Error("Please login using Google");
        }
        const isMatch = await comparePassword(password, user.passwordHash);
        if (!isMatch) {
            throw new Error("Invalid email or password");
        }
        
        const { passwordHash: ph, resetCode, resetCodeExpiry, ...publicUser } = user;
        return publicUser;
    }

    static async loginGoogle({ email, name, googleId }) {
        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    googleId ? { googleId } : {}
                ]
            }
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    name,
                    googleId,
                    provider: 'google'
                }
            });
            await this.seedDefaultCategories(user.id);
        }
        
        const { passwordHash: ph, resetCode, resetCodeExpiry, ...publicUser } = user;
        return publicUser;
    }

    static async getUserById(userId) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new Error("User not found");
        }
        const { passwordHash: ph, resetCode, resetCodeExpiry, ...publicUser } = user;
        return publicUser;
    }

    static async getUserByEmail(email) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new Error("User not found");
        }
        const { passwordHash: ph, resetCode, resetCodeExpiry, ...publicUser } = user;
        return publicUser;
    }

    static async getAllUsers() {
        const users = await prisma.user.findMany();
        return users.map(user => {
            const { passwordHash: ph, resetCode, resetCodeExpiry, ...publicUser } = user;
            return publicUser;
        });
    }

    static async deleteUser(userId) {
        try {
            const user = await prisma.user.delete({ where: { id: userId } });
            const { passwordHash: ph, resetCode, resetCodeExpiry, ...publicUser } = user;
            return publicUser;
        } catch (e) {
            throw new Error("User not found");
        }
    }

    static async updateUser(userId, updateData) {
        try {
            const { id, ...safeData } = updateData;
            const user = await prisma.user.update({
                where: { id: userId },
                data: safeData
            });
            const { passwordHash: ph, resetCode, resetCodeExpiry, ...publicUser } = user;
            return publicUser;
        } catch (e) {
            throw new Error("User not found");
        }
    }

    static async updatePassword(userId, oldPassword, newPassword) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new Error("User not found");
        }
        const isMatch = await comparePassword(oldPassword, user.passwordHash);
        if (!isMatch) {
            throw new Error("Old password is incorrect");
        }
        const newHashedPassword = await hashPassword(newPassword);
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newHashedPassword }
        });
        const { passwordHash: ph, resetCode, resetCodeExpiry, ...publicUser } = updatedUser;
        return publicUser;
    }

    static async requestResetPassword(email) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return null;
        }
        const token = generateResetToken();
        const updatedUser = await prisma.user.update({
            where: { email },
            data: {
                resetCode: token.code,
                resetCodeExpiry: token.expiresAt
            }
        });
        return updatedUser.resetCode;
    }

    static async resetPassword(email, code, newPassword) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new Error("User not found");
        }
        const verification = verifyResetCode(code, user.resetCode, user.resetCodeExpiry);
        if (!verification.valid) {
            if (verification.reason === 'expired') {
                await prisma.user.update({
                    where: { email },
                    data: {
                        resetCode: null,
                        resetCodeExpiry: null
                    }
                });
                throw new Error("Reset code has expired");
            }
            throw new Error("Invalid reset code");
        }
        const newHashedPassword = await hashPassword(newPassword);
        const updatedUser = await prisma.user.update({
            where: { email },
            data: {
                passwordHash: newHashedPassword,
                resetCode: null,
                resetCodeExpiry: null
            }
        });
        const { passwordHash: ph, resetCode, resetCodeExpiry, ...publicUser } = updatedUser;
        return publicUser;
    }
}

export default UserService;