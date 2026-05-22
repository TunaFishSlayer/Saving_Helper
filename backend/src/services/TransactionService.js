import { prisma } from "../config/db.js";

class TransactionService {

    static async createTransaction(userId, transactionData) {
        // Verify category and user ownership
        const category = await prisma.category.findFirst({
            where: {
                id: transactionData.categoryId,
                userId
            }
        });

        if (!category) {
            throw new Error("Invalid category");
        }
        if (category.type !== transactionData.type) {
            throw new Error("Transaction type does not match category type");
        }

        // Explicitly cast date safely
        return prisma.transaction.create({
            data: {
                ...transactionData,
                userId,
                date: new Date(transactionData.date)
            }
        });
    }
    
    static async getUserTransactions({
        userId,
        page = 1,
        limit = 10,
        sortBy = "date",
        order = "desc",
        type,
        categoryId,
        startDate,
        endDate
    }) {
        if (!userId) {
            throw new Error("User ID is required");
        }

        const where = { userId };

        if (type) where.type = type;
        if (categoryId) where.categoryId = categoryId;

        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate);
            if (endDate) where.date.lte = new Date(endDate);
        }

        const parsedLimit = parseInt(limit);
        const parsedPage = parseInt(page);

        // Query database
        const transactions = await prisma.transaction.findMany({
            where,
            orderBy: {
                [sortBy]: order // Prisma natively accepts "asc" | "desc"
            },
            skip: (parsedPage - 1) * parsedLimit,
            take: parsedLimit
        });

        const total = await prisma.transaction.count({ where });

        return {
            data: transactions,
            pagination: {
                page: parsedPage,
                limit: parsedLimit,
                total,
                totalPages: Math.ceil(total / parsedLimit)
            }
        };
    }


    static async getTransactionById(transactionId, userId) {
        const transaction = await prisma.transaction.findFirst({
            where: {
                id: transactionId,
                userId
            }
        });

        if (!transaction) {
            throw new Error("Transaction not found or access denied");
        }

        return transaction;
    }

    
    static async updateTransaction(transactionId, userId, updateData) {
        // Verify existence/ownership
        const transaction = await prisma.transaction.findFirst({
            where: {
                id: transactionId,
                userId
            }
        });

        if (!transaction) {
            throw new Error("Transaction not found or access denied");
        }

        const { id, userId: uId, ...safeUpdateData } = updateData;
        if (safeUpdateData.date) {
            safeUpdateData.date = new Date(safeUpdateData.date);
        }

        // Apply atomic updates
        return prisma.transaction.update({
            where: {
                id: transactionId
            },
            data: safeUpdateData
        });
    }

    
    static async deleteTransaction(transactionId, userId) {
        const transaction = await prisma.transaction.findFirst({
            where: {
                id: transactionId,
                userId
            }
        });

        if (!transaction) {
            throw new Error("Transaction not found or access denied");
        }

        await prisma.transaction.delete({
            where: {
                id: transactionId
            }
        });

        return transaction;
    }

    
    // Total income or expense
    static async getTotalByType(userId, type) {
        const result = await prisma.transaction.aggregate({
            _sum: {
                amount: true
            },
            where: {
                userId,
                type
            }
        });

        return result._sum.amount || 0;
    }

    // Monthly income vs expense
    static async getMonthlySummary(userId, year, month) {
        const groups = await prisma.transaction.groupBy({
            by: ['type'],
            _sum: {
                amount: true
            },
            where: {
                userId,
                date: {
                    gte: new Date(year, month - 1, 1),
                    lt: new Date(year, month, 1)
                }
            }
        });

        // Map the results to match the Mongoose aggregator format for client stability
        return groups.map(group => ({
            id: group.type,
            total: group._sum.amount || 0
        }));

    }

    // Expense by category (pie chart)
    static async getExpenseByCategory(userId) {
        const groups = await prisma.transaction.groupBy({
            by: ['categoryId'],
            _sum: {
                amount: true
            },
            where: {
                userId,
                type: "expense"
            }
        });

        // Map the results to match Mongoose aggregator formats (_id: categoryId)
        return groups.map(group => ({
            id: group.categoryId,
            total: group._sum.amount || 0
        }));

    }
}

export default TransactionService;
