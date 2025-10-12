import moongoose from "mongoose";

const budgetSchema = new moongoose.Schema({
    userId: { type: moongoose.Schema.Types.ObjectId, ref: "User" },
    totalBudget: { type: Number, required: true },
    period: { type: String, enum: ["monthly", "yearly"], required: true },
    startDate: { type: Date, required: true },
});
export default moongoose.model("Budget", budgetSchema);