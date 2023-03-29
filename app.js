const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
var cors = require("cors");
require("dotenv").config();
// require("./utils/firebase");
const { auth, firestore } = require("./utils/firebase");

const indexRouter = require("./routes/index");
const authRouter = require("./routes/auth");
const userRouter = require("./routes/user");
<<<<<<< HEAD
const patientRouter = require("./routes/patient");
=======
const adminRouter = require("./routes/admin");
>>>>>>> d2716d3 (feat(admin): add admin routes)

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
	const token = req.header("X-Token-Firebase");
	if (token) {
		try {
			const claims = await auth.verifyIdToken(token);
			const user = await (await auth.getUser(claims.uid)).toJSON();
			const uid = user.uid;
			const userDoc = await firestore
				.collection("users")
				.where("uid", "==", uid)
				.get();
			// console.log(userDoc);
			const userDocData = [];
			userDoc.forEach((doc) => {
				userDocData.push({ id: doc.id, ...doc.data() });
			});
			if (userDocData.length === 0) {
				return res.status(404).json({ error: "User not found" });
			}
			if (userDocData.length !== 1) {
				return res.status(404).json({ error: "Duplicate Users Found" });
			}
			const userData = userDocData[0];
			user.role = userData.role;
			user.name = userData.name;
			user.id = userData.id;
			user.hospital = userData.hospital || "TODO FIX HOSPITAL";
			// console.log(user);
			req.user = user;
		} catch (error) {
			console.log(error);
			return res.status(400).json(error);
		}
	}
	next();
});

app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/patient", patientRouter);
app.use("/admin", adminRouter);

module.exports = app;
