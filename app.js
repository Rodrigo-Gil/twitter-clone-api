import express from "express";

// Importing the Database
import connectDatabase from "./startup/connectDatabase.js";
connectDatabase();

const app = express();

export default app;
