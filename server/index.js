import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';

import swaggerUi from "swagger-ui-express";

import swaggerSpec from './swagger.js';

import todoRoute from "./routes/todoRoutes.js";
import usersRoute from "./routes/usersRoutes.js";

const app = express();
dotenv.config()

app.use(express.json()); // Built-in body-parser for parsing JSON
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(cookieParser()); // Enable cookie parsing


app.use("/service/todo", todoRoute)
app.use("/service/user", usersRoute)

// api documentation endpoint
app.use("/todolist/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Todo List Management API",
}))

mongoose.set("strictQuery", true)

// Start the server
mongoose.connect(process.env.CONNECTION_URL)
    .then(() => app.listen(process.env.PORT, () => console.log(`Server running on port: ${process.env.PORT}`)))
    .catch((error) => console.log(error.message));