import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["income", "expense"],
    required: true
  },
  description: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Unique category name per user
categorySchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model("Category", categorySchema);
