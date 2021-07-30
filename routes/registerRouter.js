import express from "express";
import bodyParser from "body-parser";

import User from "../schemas/User.js";

//creating the jsonParser
const jsonParser = bodyParser.json();

const router = express.Router();

//registering a new user
router.post("/", jsonParser, async (req, res, next) => {
	try {
		const newUser = new User(req.body);
		await newUser.save();
		res.status(201).send({ data: newUser });
	} catch (error) {
		console.error("Error saving the new user", error.message);
		next(error);
	}
});

//login a user and return an authentication token

export default router;
