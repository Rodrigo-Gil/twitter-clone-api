import mongoose from "mongoose";
import uniqueValidator from "mongoose-unique-validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const saltRounds = 14;
const jwtSecretKey = "superSecretKey";

const UserSchema = new mongoose.Schema(
	{
		firstName: { type: String, required: true, trim: true },
		lastName: { type: String, required: true, trim: true },
		username: { type: String, required: true, trim: true, unique: true },
		email: { type: String, required: true, trim: true, unique: true },
		password: { type: String, maxLength: 70, required: true },
		profilePic: { type: String, default: "/images/profilePic.jpeg" },
		coverPhoto: { type: String },
		likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
		retweets: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
		following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
		followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
	},
	{ timestamps: true }
);

// Added a method to create a token for the loggedIn user
UserSchema.methods.generateAuthToken = function () {
	const payload = { uid: this._id };
	return jwt.sign(payload, jwtSecretKey);
};

UserSchema.statics.authenticate = async function (email, password) {
	const user = await this.findOne({ email: email });

	const badHash = `$2b$${saltRounds}$invalidusernameaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`;
	const hashedPassword = user ? user.password : badHash;
	const passwordDidMatch = await bcrypt.compare(password, hashedPassword);

	return passwordDidMatch ? user : null;
};

UserSchema.pre("save", async function (next) {
	// Only encrypt if the password property is being changed.
	if (!this.isModified("password")) return next();

	this.password = await bcrypt.hash(this.password, saltRounds);
	next();
});

UserSchema.pre("findOneAndUpdate", async function (next) {
	//handling the password update
	if (this._update.password) {
		this._update.password = await bcrypt.hash(
			this._update.password,
			saltRounds
		);
	}
	next();
});

//deleting sensitive information on json responses
UserSchema.methods.toJSON = function () {
	const obj = this.toObject();
	delete obj.password;
	delete obj.__v;
	return obj;
};

//registering the validator plugin for the email
UserSchema.plugin(uniqueValidator, {
	message: function (props) {
		if (props.path === "email") {
			return `The email address '${props.value}' is already registered.`;
		} else {
			return `The ${props.path} must be unique. '${props.value}' is already in use.`;
		}
	},
});

const User = mongoose.model("User", UserSchema);
export default User;
