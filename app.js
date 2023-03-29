const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
var cors = require("cors");
require("dotenv").config();
require("./firebase");

const indexRouter = require("./routes/index");
const authRouter = require("./routes/auth");
const userRouter = require("./routes/user");

const app = express();

app.use(
	cors({
		origin: process.env.FRONTEND,
		credentials: true,
	})
);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// middleware to check if user signed in and populate req.user
app.use(async (req, res, next) => {
	const { token } = req.body;
	if (token) {
		try {
			const claims = await auth.verifyIdToken(token);
			const user = await auth.getUser(claims.uid);
			req.user = user;
		} catch (error) {
			console.log(error);
		}
	}
	next();
});

app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/user", userRouter);

module.exports = app;
