import express from "express";

// Importing the Database
import connectDatabase from "./startup/connectDatabase.js";
// Routes
import registerRouter from "./routes/registerRouter.js";
import loginRouter from "./routes/loginRouter.js";
import chatsApiRouter from "./routes/api/chats.js";
import messagesApiRouter from "./routes/api/messages.js";
import postsApiRouter from "./routes/api/posts.js";

const app = express();

// Connecting the database
connectDatabase();

// Registering the routers
app.use("/register", registerRouter);
app.use("/login", loginRouter);
app.use("/api/chats", chatsApiRouter);
app.use("/api/messages", messagesApiRouter);
app.use("/api/posts", postsApiRouter);

export default app;
