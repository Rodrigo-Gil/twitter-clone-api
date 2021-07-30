import express from "express";
import bodyParser from "body-parser";

import User from "../../schemas/User.js";
import Post from "../../schemas/Post.js";

import auth from "../../middleware/auth.js";

//creating the jsonParser
const jsonParser = bodyParser.json();

const router = express.Router();

router.get("/", auth, async (req, res) => {
	const searchObj = req.query;

	if (searchObj.isReply !== undefined) {
		const isReply = searchObj.isReply == "true";
		searchObj.replyTo = { $exists: isReply };
		delete searchObj.isReply;
	}

	if (searchObj.search !== undefined) {
		searchObj.content = { $regex: searchObj.search, $options: "i" };
		delete searchObj.search;
	}

	if (searchObj.followingOnly !== undefined) {
		const followingOnly = searchObj.followingOnly == "true";

		if (followingOnly) {
			const objectIds = [];

			if (!req.user.following) {
				req.user.following = [];
			}

			req.user.following.forEach(user => {
				objectIds.push(user);
			});

			objectIds.push(req.user._id);
			searchObj.postedBy = { $in: objectIds };
		}

		delete searchObj.followingOnly;
	}

	const results = await getPosts(searchObj);
	res.status(200).send(results);
});

router.get("/:id", async (req, res) => {
	const postId = req.params.id;

	const postData = await getPosts({ _id: postId });
	postData = postData[0];

	const results = {
		postData: postData,
	};

	if (postData.replyTo !== undefined) {
		results.replyTo = postData.replyTo;
	}

	results.replies = await getPosts({ replyTo: postId });

	res.status(200).send(results);
});

router.post("/", auth, jsonParser, async (req, res) => {
	if (!req.body.content) {
		console.log("Content params not sent with request");
		return res.sendStatus(400);
	}

	const postData = {
		content: req.body.content,
		postedBy: req.user,
	};

	if (req.body.replyTo) {
		postData.replyTo = req.body.replyTo;
	}

	Post.create(postData)
		.then(async newPost => {
			newPost = await User.populate(newPost, { path: "postedBy" });
			newPost = await Post.populate(newPost, { path: "replyTo" });

			if (newPost.replyTo !== undefined) {
				await Notification.insertNotification(
					newPost.replyTo.postedBy,
					req.user._id,
					"reply",
					newPost._id
				);
			}

			res.status(201).send(newPost);
		})
		.catch(error => {
			console.log(error);
			res.sendStatus(400);
		});
});

router.put("/:id/like", auth, jsonParser, async (req, res) => {
	const postId = req.params.id;
	const userId = req.user._id;

	const isLiked = req.user.likes && req.user.likes.includes(postId);

	const option = isLiked ? "$pull" : "$addToSet";

	// Insert user like
	req.user = await User.findByIdAndUpdate(
		userId,
		{ [option]: { likes: postId } },
		{ new: true }
	).catch(error => {
		console.log(error);
		res.sendStatus(400);
	});

	// Insert post like
	const post = await Post.findByIdAndUpdate(
		postId,
		{ [option]: { likes: userId } },
		{ new: true }
	).catch(error => {
		console.log(error);
		res.sendStatus(400);
	});

	if (!isLiked) {
		await Notification.insertNotification(
			post.postedBy,
			userId,
			"postLike",
			post._id
		);
	}

	res.status(200).send(post);
});

router.post("/:id/retweet", auth, jsonParser, async (req, res) => {
	const postId = req.params.id;
	const userId = req.user._id;

	// Try and delete retweet
	const deletedPost = await Post.findOneAndDelete({
		postedBy: userId,
		retweetData: postId,
	}).catch(error => {
		console.log(error);
		res.sendStatus(400);
	});

	const option = deletedPost != null ? "$pull" : "$addToSet";

	const repost = deletedPost;

	if (repost == null) {
		repost = await Post.create({ postedBy: userId, retweetData: postId }).catch(
			error => {
				console.log(error);
				res.sendStatus(400);
			}
		);
	}

	// Insert user like
	req.user = await User.findByIdAndUpdate(
		userId,
		{ [option]: { retweets: repost._id } },
		{ new: true }
	).catch(error => {
		console.log(error);
		res.sendStatus(400);
	});

	// Insert post like
	const post = await Post.findByIdAndUpdate(
		postId,
		{ [option]: { retweetUsers: userId } },
		{ new: true }
	).catch(error => {
		console.log(error);
		res.sendStatus(400);
	});

	if (!deletedPost) {
		await Notification.insertNotification(
			post.postedBy,
			userId,
			"retweet",
			post._id
		);
	}

	res.status(200).send(post);
});

router.delete("/:id", (req, res) => {
	Post.findByIdAndDelete(req.params.id)
		.then(() => res.sendStatus(202))
		.catch(error => {
			console.log(error);
			res.sendStatus(400);
		});
});

router.put("/:id", auth, jsonParser, async (req, res) => {
	if (req.body.pinned !== undefined) {
		await Post.updateMany({ postedBy: req.user }, { pinned: false }).catch(
			error => {
				console.log(error);
				res.sendStatus(400);
			}
		);
	}

	Post.findByIdAndUpdate(req.params.id, req.body)
		.then(() => res.sendStatus(204))
		.catch(error => {
			console.log(error);
			res.sendStatus(400);
		});
});

async function getPosts(filter) {
	const results = await Post.find(filter)
		.populate("postedBy")
		.populate("retweetData")
		.populate("replyTo")
		.sort({ createdAt: -1 })
		.catch(error => console.log(error));

	results = await User.populate(results, { path: "replyTo.postedBy" });
	return await User.populate(results, { path: "retweetData.postedBy" });
}

export default router;
