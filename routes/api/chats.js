import express from "express";
import bodyParser from "body-parser";

import User from "../../schemas/User.js";
import Chat from "../../schemas/Chat.js";
import Message from "../../schemas/Message.js";
import router from "../registerRouter.js";

import auth from "../../middleware/auth.js";

//creating the jsonParser
const jsonParser = bodyParser.json();

router.post("/", auth, jsonParser, async (req, res, next) => {
	try {
		const users = req.body.users;

		if (users.length == 0) {
			console.log("Users array is empty");
			return res.sendStatus(400);
		}

		users.push(req.user._id);

		const chatData = {
			users: users,
			isGroupChat: true,
		};

		Chat.create(chatData)
			.then(results => res.status(200).send(results))
			.catch(error => {
				console.error(error.message);
				res.sendStatus(400);
			});
	} catch (error) {
		console.error(`Error processing the request: ${error.message}`);
		next(error);
	}
});

router.get("/", async (req, res, next) => {
	try {
		Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
			.populate("users")
			.populate("latestMessage")
			.sort({ updatedAt: -1 })
			.then(async results => {
				if (
					req.query.unreadOnly !== undefined &&
					req.query.unreadOnly == "true"
				) {
					results = results.filter(
						r =>
							r.latestMessage && !r.latestMessage.readBy.includes(req.user._id)
					);
				}

				results = await User.populate(results, {
					path: "latestMessage.sender",
				});
				res.status(200).send(results);
			})
			.catch(error => {
				console.error(error.message);
				res.sendStatus(400);
			});
	} catch (error) {
		console.error(`error processing the request: ${error.message}`);
		next(error);
	}
});

router.get("/:chatId", async (req, res, next) => {
	try {
		Chat.findOne({
			_id: req.params.chatId,
			users: { $elemMatch: { $eq: req.user._id } },
		})
			.populate("users")
			.then(results => res.status(200).send(results))
			.catch(error => {
				console.log(error);
				res.sendStatus(400);
			});
	} catch (error) {
		console.error(`error processing the request: ${error.message}`);
		next(error);
	}
});

router.put("/:chatId", jsonParser, async (req, res, next) => {
	try {
		Chat.findByIdAndUpdate(req.params.chatId, req.body)
			.then(results => res.sendStatus(204).send(results))
			.catch(error => {
				console.log(error);
				res.sendStatus(400);
			});
	} catch (error) {
		console.error(`error processing the request: ${error.message}`);
		next(error);
	}
});

router.put(
	"/:chatId/messages/markAsRead",
	jsonParser,
	async (req, res, next) => {
		Message.updateMany(
			{ chat: req.params.chatId },
			{ $addToSet: { readBy: req.user._id } }
		)
			.then(() => res.sendStatus(204))
			.catch(error => {
				console.log(error);
				res.sendStatus(400);
			});
	}
);

export default router;
