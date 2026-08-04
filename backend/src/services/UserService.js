import { hashPassword, comparePassword } from "../utils/hash.js";
import { prisma } from "../config/db.js";
import { generateResetToken, verifyResetCode } from "../utils/resetCodeGen.js";
import { randomUUID } from "crypto";

class UserService {
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

    static async seedUserDefaultCategories(userId) {
        const defaultCategories = [
            { name: 'Ăn uống',          type: 'expense', description: 'Nhà hàng, quán ăn, đồ ăn nhanh' },
            { name: 'Siêu thị',         type: 'expense', description: 'Mua sắm tại siêu thị, tạp hóa' },
            { name: 'Di chuyển',        type: 'expense', description: 'Grab, taxi, xăng xe, gửi xe' },
            { name: 'Hóa đơn & Tiện ích', type: 'expense', description: 'Điện, nước, internet, điện thoại' },
            { name: 'Mua sắm',          type: 'expense', description: 'Quần áo, giày dép, đồ dùng cá nhân' },
            { name: 'Sức khỏe',         type: 'expense', description: 'Thuốc, bệnh viện, phòng khám' },
            { name: 'Giải trí',         type: 'expense', description: 'Phim, karaoke, sự kiện, game' },
            { name: 'Giáo dục',         type: 'expense', description: 'Học phí, sách, khóa học' },
            { name: 'Nhà ở',            type: 'expense', description: 'Tiền thuê nhà, sửa chữa' },
            { name: 'Chi tiêu khác',    type: 'expense', description: 'Các chi tiêu chưa phân loại' },
            { name: 'Lương',            type: 'income',  description: 'Lương hàng tháng, thưởng' },
            { name: 'Làm thêm',         type: 'income',  description: 'Freelance, part-time, việc phụ' },
            { name: 'Đầu tư',           type: 'income',  description: 'Cổ phiếu, tiền gửi, tiền lãi' },
            { name: 'Kinh doanh',       type: 'income',  description: 'Thu nhập từ kinh doanh cá nhân' },
            { name: 'Thu nhập khác',    type: 'income',  description: 'Quà, tiền hỗ trợ, các khoản khác' },
        ];

        for (const cat of defaultCategories) {
            const uuid = randomUUID();
            await prisma.category.create({
                data: {
                    ...cat,
                    id: uuid,
                    clientUuid: uuid,
                    userId
                }
            });
        }
    }
}

export default UserService;