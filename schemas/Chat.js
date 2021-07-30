import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema(
	{
		chatName: { type: String, trim: true },
		isGroupChat: { type: Boolean, default: false },
		users: [{ type: Schema.Types.ObjectId, ref: "User" }],
		latestMessage: { type: Schema.Types.ObjectId, ref: "Message" },
	},
	{ timestamps: true }
);

const chat = mongoose.model("Chat", ChatSchema);

export default chat;
