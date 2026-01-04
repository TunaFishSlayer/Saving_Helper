import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    categoryId: {type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true},
    amount: {type: Number, required: true},
    description: {type: String, required: false},
    type: {type: String, enum : ['income', 'expense'], required: true},
    date: {type: Date, required: true},
    createdAt: {type: Date, default: Date.now}
})

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, categoryId: 1 });
transactionSchema.index({ userId: 1, date: 1 });


export default mongoose.model("Transaction", transactionSchema);