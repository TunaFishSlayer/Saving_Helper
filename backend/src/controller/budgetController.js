// backend/src/controller/budgetController.js
import BudgetService from "../services/BudgetService.js";
import logger from "../utils/logger.js";

// CREATE BUDGET
// POST /api/budgets
export const createBudget = async (req, res) => {
  try {
    const budget = await BudgetService.createBudget(
      req.user.userId,
      req.body
    );

    logger.info(`Budget created for user ${req.user.userId}`);

    res.status(201).json({
      message: "Budget created successfully",
      data: budget
    });
  } catch (error) {
    logger.warn(`Budget creation error: ${error.message}`);
    res.status(400).json({ message: error.message });
  }
};

// GET USER BUDGETS
// GET /api/budgets
export const getBudgets = async (req, res) => {
  try {
    const options = {
      period: req.query.period,
      isActive: req.query.isActive === 'true' ? true : 
                req.query.isActive === 'false' ? false : undefined,
      categoryId: req.query.categoryId
    };

    const budgets = await BudgetService.getUserBudgets(
      req.user.userId,
      options
    );

    res.status(200).json({
      message: "Budgets retrieved successfully",
      data: budgets
    });
  } catch (error) {
    logger.warn(`Get budgets error: ${error.message}`);
    res.status(400).json({ message: error.message });
  }
};

// GET BUDGET BY ID
// GET /api/budgets/:id
export const getBudgetById = async (req, res) => {
  try {
    const budget = await BudgetService.getBudgetById(
      req.params.id,
      req.user.userId
    );

    res.status(200).json({
      message: "Budget retrieved successfully",
      data: budget
    });
  } catch (error) {
    logger.warn(`Get budget error: ${error.message}`);
    res.status(404).json({ message: error.message });
  }
};

// UPDATE BUDGET
// PUT /api/budgets/:id
export const updateBudget = async (req, res) => {
  try {
    const budget = await BudgetService.updateBudget(
      req.params.id,
      req.user.userId,
      req.body
    );

    logger.info(`Budget ${req.params.id} updated by user ${req.user.userId}`);

    res.status(200).json({
      message: "Budget updated successfully",
      data: budget
    });
  } catch (error) {
    logger.warn(`Update budget error: ${error.message}`);
    res.status(400).json({ message: error.message });
  }
};

// DELETE BUDGET
// DELETE /api/budgets/:id
export const deleteBudget = async (req, res) => {
  try {
    await BudgetService.deleteBudget(
      req.params.id,
      req.user.userId
    );

    logger.info(`Budget ${req.params.id} deleted by user ${req.user.userId}`);

    res.status(200).json({
      message: "Budget deleted successfully"
    });
  } catch (error) {
    logger.warn(`Delete budget error: ${error.message}`);
    res.status(404).json({ message: error.message });
  }
};

// DEACTIVATE BUDGET
// PATCH /api/budgets/:id/deactivate
export const deactivateBudget = async (req, res) => {
  try {
    const budget = await BudgetService.deactivateBudget(
      req.params.id,
      req.user.userId
    );

    logger.info(`Budget ${req.params.id} deactivated by user ${req.user.userId}`);

    res.status(200).json({
      message: "Budget deactivated successfully",
      data: budget
    });
  } catch (error) {
    logger.warn(`Deactivate budget error: ${error.message}`);
    res.status(404).json({ message: error.message });
  }
};

// GET BUDGET STATUS
// GET /api/budgets/:id/status
export const getBudgetStatus = async (req, res) => {
  try {
    const status = await BudgetService.getBudgetStatus(
      req.params.id,
      req.user.userId
    );

    res.status(200).json({
      message: "Budget status retrieved successfully",
      data: status
    });
  } catch (error) {
    logger.warn(`Get budget status error: ${error.message}`);
    res.status(404).json({ message: error.message });
  }
};

// GET BUDGET OVERVIEW
// GET /api/budgets/overview
export const getBudgetOverview = async (req, res) => {
  try {
    const overview = await BudgetService.getBudgetOverview(
      req.user.userId,
      req.query.period
    );

    res.status(200).json({
      message: "Budget overview retrieved successfully",
      data: overview
    });
  } catch (error) {
    logger.warn(`Get budget overview error: ${error.message}`);
    res.status(400).json({ message: error.message });
  }
};

// GET BUDGET ALERTS
// GET /api/budgets/alerts

export const getBudgetAlerts = async (req, res) => {
  try {
    const alerts = await BudgetService.checkBudgetAlerts(req.user.userId);

    res.status(200).json({
      message: "Budget alerts retrieved successfully",
      data: {
        count: alerts.length,
        alerts
      }
    });
  } catch (error) {
    logger.warn(`Get budget alerts error: ${error.message}`);
    res.status(400).json({ message: error.message });
  }
};