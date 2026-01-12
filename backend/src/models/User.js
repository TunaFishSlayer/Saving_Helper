import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: {type: String, required: true, unique: true},
    passwordHash: {type: String, required: false}, 
    name: {type: String, required: true},
    googleId: {type: String, required: false}, 
    provider: {type: String, enum: ['local', 'google'], default: 'local'},
    createdAt: {type: Date, default: Date.now},
    resetCode: {type: String, required: false},
    resetCodeExpiry: {type: Date, required: false}
}, {
    timestamps: true
})

export default mongoose.model("User", userSchema);
