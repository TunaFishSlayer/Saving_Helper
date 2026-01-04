import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: {type: String, required: true, unique: true},
    passwordHash: {type: String, required: false}, 
    name: {type: String, required: true},
    createdAt: {type: Date, default: Date.now},
    resetCode: {type: String, required: false},
    resetCodeExpiry: {type: Date, required: false}
}, {
    timestamps: true
})