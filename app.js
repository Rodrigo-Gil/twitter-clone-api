import express from "express";

// Importing the Database
import connectDatabase from "./startup/connectDatabase.js";
// Routes
import registerRouter from "./routes/registerRouter.js";

const app = express();

// Connecting the database
connectDatabase();

// Registering the routers
app.use("/register", registerRouter);

export default app;
