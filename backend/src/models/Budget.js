// backend/src/models/Budget.js
import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  period: {
    type: String,
    enum: ["custom", "weekly", "monthly", "yearly"],
    default: "monthly",
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: false
  },
  alertThreshold: {
    type: Number,
    min: 0,
    max: 100,
    default: 80 // Alert when 80% of budget is reached
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure one budget per category per user per period
budgetSchema.index({ userId: 1, categoryId: 1, period: 1, isActive: 1 });

// Update the updatedAt timestamp before saving
budgetSchema.pre("save", async function() {
  this.updatedAt = Date.now();
});

export default mongoose.model("Budget", budgetSchema);