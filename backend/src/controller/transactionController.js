import TransactionService from "../services/TransactionService.js";
import { parseReceiptImage } from "../services/ReceiptParserService.js";



export const createTransaction = async (req, res) => {
  try {
    const transaction = await TransactionService.createTransaction(
      req.user.userId,
      req.body
    );

    res.status(201).json({
      message: "Transaction created successfully",
      data: transaction
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


export const getTransactions = async (req, res) => {
  try {
    const result = await TransactionService.getUserTransactions({
      userId: req.user.userId,
      page: Number(req.query.page),
      limit: Number(req.query.limit),
      sortBy: req.query.sortBy,
      order: req.query.order,
      type: req.query.type,
      categoryId: req.query.categoryId,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


export const getTransactionById = async (req, res) => {
  try {
    const transaction = await TransactionService.getTransactionById(
      req.params.id,
      req.user.userId
    );

    res.status(200).json(transaction);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};


export const updateTransaction = async (req, res) => {
  try {
    const transaction = await TransactionService.updateTransaction(
      req.params.id,
      req.user.userId,
      req.body
    );

    res.status(200).json({
      message: "Transaction updated successfully",
      data: transaction
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};


export const deleteTransaction = async (req, res) => {
  try {
    await TransactionService.deleteTransaction(
      req.params.id,
      req.user.userId
    );

    res.status(200).json({
      message: "Transaction deleted successfully"
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};


export const getTotalByType = async (req, res) => {
  try {
    const total = await TransactionService.getTotalByType(
      req.user.userId,
      req.query.type
    );

    res.status(200).json({ total });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getMonthlySummary = async (req, res) => {
  try {
    const summary = await TransactionService.getMonthlySummary(
      req.user.userId,
      Number(req.query.year),
      Number(req.query.month)
    );

    res.status(200).json(summary);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getExpenseByCategory = async (req, res) => {
  try {
    const data = await TransactionService.getExpenseByCategory(
      req.user.userId
    );

    res.status(200).json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const scanReceipt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No receipt file uploaded" });
    }

    const parsedData = await parseReceiptImage(req.file.path);

    res.status(200).json({
      message: "Receipt scanned successfully",
      data: parsedData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

