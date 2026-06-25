import TransactionService from "../services/TransactionService.js";
import { parseReceiptImage } from "../services/ReceiptParserService.js";
import ExcelJS from "exceljs";



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

    const categories = req.body.categories;
    const parsedData = await parseReceiptImage(req.file.path, categories);

    res.status(200).json({
      message: "Receipt scanned successfully",
      data: parsedData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const exportTransactions = async (req, res) => {
  try {
    let transactions;
    if (req.body && Array.isArray(req.body.transactions)) {
      transactions = req.body.transactions;
    } else {
      transactions = await TransactionService.getUserTransactionsForExport({
        userId: req.user.userId,
        type: req.query.type,
        categoryId: req.query.categoryId,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      });
    }

    // Format data into rows
    const rows = transactions.map(t => {
      const d = new Date(t.date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = String(d.getFullYear()).slice(-2);
      
      let categoryName = "Unknown";
      if (t.category && typeof t.category === 'object' && t.category.name) {
        categoryName = t.category.name;
      } else if (t.categoryName) {
        categoryName = t.categoryName;
      } else if (typeof t.category === 'string') {
        categoryName = t.category;
      }

      return {
        "Date": `${day}/${month}/${year}`,
        "Description": t.description || "",
        "Category": categoryName,
        "Type": t.type === 'income' ? 'Income' : 'Expense',
        "Amount (VND)": t.amount
      };
    });

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Transactions");

    // Add columns
    worksheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Description", key: "description", width: 30 },
      { header: "Category", key: "category", width: 20 },
      { header: "Type", key: "type", width: 12 },
      { header: "Amount (VND)", key: "amount", width: 18 }
    ];

    // Add rows
    rows.forEach(row => {
      worksheet.addRow({
        date: row["Date"],
        description: row["Description"],
        category: row["Category"],
        type: row["Type"],
        amount: row["Amount (VND)"]
      });
    });

    // Style header row to look modern and premium
    const headerRow = worksheet.getRow(1);
    headerRow.font = { name: "Segoe UI", bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F46E5" } // Indigo background matching UI theme
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 26;

    // Apply currency formatting to Amount column
    worksheet.getColumn(5).numFmt = '#,##0';

    // Write worksheet to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Send response with file attachment headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.xlsx"');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

