import express from "express";
import bodyParser from "body-parser";

import User from "../schemas/User.js";
import auth from "../middleware/auth.js";

//creating the jsonParser
const jsonParser = bodyParser.json();

const router = express.Router();

//login an user and return an auth token
router.post("/", jsonParser, async (req, res, next) => {
	try {
		const { email, password } = req.body;
		const user = await User.authenticate(email, password);
		res.status(201).send({ data: { token: user.generateAuthToken() } });
	} catch (error) {
		console.error("Error returning a token", error.message);
		next(error);
	}
});

//login the current user
router.post("/me", auth, async (req, res, next) => {
	try {
		const user = await User.findById(req.user._id);
		res.status(201).send({ data: user });
	} catch (error) {
		console.error("Error retrieving the current user ", error.message);
		next(error);
	}
});

export default router;
