import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
var cors = require("cors");
require("dotenv").config();

const debug = require("debug")("epartogram:server");
import http from "http";
import { grpcServer, serverCredentials } from "./rpcs/rpc";
import { auth } from "./utils/firebase";

import indexRouter from "./routes/index";
import authRouter from "./routes/auth";
import userRouter from "./routes/user";
import patientRouter from "./routes/patient";
import adminRouter from "./routes/admin";
import doctorRouter from "./routes/doctor";

import { getStaffHospitalId } from "./crud/hospital";
import { getUserByEmail } from "./crud/user";

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

app.use(async (req, res, next) => {
  const token = req.header("X-Token-Firebase");
  if (token) {
    try {
      const claims = await auth.verifyIdToken(token);
      const authUser = await auth.getUser(claims.uid);
      const uid = authUser.uid;

      const user = await getUserByEmail(authUser.email);
      req.user = user;

      const hospitalId = await getStaffHospitalId(uid);
      req.hospitalId = hospitalId;
    } catch (error) {
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
app.use("/doctor", doctorRouter);

const port = parseInt(process.env.PORT || "5005");
app.set("port", port);

const server = http.createServer(app);

grpcServer.bindAsync(
  `127.0.0.1:${process.env.GRPC_PORT}`,
  serverCredentials,
  (error, port) => {
    console.log(`grpc Server running at port ${process.env.GRPC_PORT}`);
    grpcServer.start();
  }
);

server.listen(port, () => {
  console.log(`http server running at port ${process.env.PORT}`);
});

server.on("listening", () => {
  const addr = server.address();
  const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  debug("Listening on " + bind);
});
