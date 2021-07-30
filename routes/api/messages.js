import express from "express";
import bodyParser from "body-parser";

import User from "../../schemas/User.js";
import Chat from "../../schemas/Chat.js";
import Message from "../../schemas/Message.js";

import auth from "../../middleware/auth.js";

//creating the jsonParser
const jsonParser = bodyParser.json();

const router = express.Router();

router.post("/", auth, jsonParser, async (req, res, next) => {
	if (!req.body.content || !req.body.chat) {
		console.log("Invalid data passed into request");
		return res.sendStatus(400);
	}

	const newMessage = {
		sender: req.user._id,
		content: req.body.content,
		chat: req.body.chat,
	};

	Message.create(newMessage)
		.then(async message => {
			message = await message.populate("sender").execPopulate();
			message = await message.populate("chat").execPopulate();
			message = await User.populate(message, { path: "chat.users" });

			await Chat.findByIdAndUpdate(req.body.chat, {
				latestMessage: message,
			}).catch(error => console.log(error));

			res.status(201).send(message);
		})
		.catch(error => {
			console.log(error);
			res.sendStatus(400);
		});
});

export default router;
