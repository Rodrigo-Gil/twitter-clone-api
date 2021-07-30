import mongoose from "mongoose";

const connectDatabase = async function () {
	await mongoose
		.connect("mongodb://localhost:27017/twitter_api", {
			useNewUrlParser: true,
			useCreateIndex: true,
			useFindAndModify: false,
			useUnifiedTopology: true,
		})
		.then(() => {
			console.log("Successfully connected to the Database ...");
		})
		.catch(err => {
			console.error("Error connecting to the Database ...", err.message);
			process.exit(1);
		});
};

export default connectDatabase;
