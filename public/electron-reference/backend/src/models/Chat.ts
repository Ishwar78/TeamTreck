import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    group_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: false,
    },
 
    message: { type: String },

// 🔥 NEW FIELDS
    // fileUrl: { type: String },    
    // fileType: { type: String },    

    seen: { type: Boolean, default: false },

    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
  },
  { timestamps: true }
);

export const Chat = mongoose.model("Chat", chatSchema);