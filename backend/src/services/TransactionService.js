import Transaction from "../models/Transaction.js";

class TransactionService {

    /* =========================
       CREATE
    ========================== */
    static async createTransaction(userId, transactionData) {
        if (!userId) {
            throw new Error("User ID is required");
        }

        const transaction = new Transaction({
            ...transactionData,
            userId
        });

        return await transaction.save();
    }

    /* =========================
       READ – LIST (FILTER + SORT + PAGINATION)
    ========================== */
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

        const query = { userId };

        if (type) query.type = type;
        if (categoryId) query.categoryId = categoryId;

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const sortOrder = order === "asc" ? 1 : -1;

        const transactions = await Transaction.find(query)
            .sort({ [sortBy]: sortOrder })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Transaction.countDocuments(query);

        return {
            data: transactions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /* =========================
       READ – SINGLE
    ========================== */
    static async getTransactionById(transactionId, userId) {
        const transaction = await Transaction.findOne({
            _id: transactionId,
            userId
        });

        if (!transaction) {
            throw new Error("Transaction not found or access denied");
        }

        return transaction;
    }

    /* =========================
       UPDATE
    ========================== */
    static async updateTransaction(transactionId, userId, updateData) {
        const transaction = await Transaction.findOneAndUpdate(
            { _id: transactionId, userId },
            updateData,
            { new: true }
        );

        if (!transaction) {
            throw new Error("Transaction not found or access denied");
        }

        return transaction;
    }

    /* =========================
       DELETE
    ========================== */
    static async deleteTransaction(transactionId, userId) {
        const transaction = await Transaction.findOneAndDelete({
            _id: transactionId,
            userId
        });

        if (!transaction) {
            throw new Error("Transaction not found or access denied");
        }

        return transaction;
    }

    /* =========================
       ANALYTICS
    ========================== */

    // Total income or expense
    static async getTotalByType(userId, type) {
        const result = await Transaction.aggregate([
            { $match: { userId, type } },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            }
        ]);

        return result[0]?.total || 0;
    }

    // Monthly income vs expense
    static async getMonthlySummary(userId, year, month) {
        return Transaction.aggregate([
            {
                $match: {
                    userId,
                    date: {
                        $gte: new Date(year, month - 1, 1),
                        $lt: new Date(year, month, 1)
                    }
                }
            },
            {
                $group: {
                    _id: "$type",
                    total: { $sum: "$amount" }
                }
            }
        ]);
    }

    // Expense by category (pie chart)
    static async getExpenseByCategory(userId) {
        return Transaction.aggregate([
            { $match: { userId, type: "expense" } },
            {
                $group: {
                    _id: "$categoryId",
                    total: { $sum: "$amount" }
                }
            }
        ]);
    }
}

export default TransactionService;
