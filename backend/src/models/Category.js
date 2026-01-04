import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    name: {type: String, required: true, unique: true},
    type: {type: String, enum : ['income', 'expense'], required: true},
    description: {type: String, required: false},
    createdAt: {type: Date, default: Date.now}
})

export default mongoose.model("Category", categorySchema);