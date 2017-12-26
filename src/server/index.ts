import * as express from "express";
import * as bodyParser from "body-parser";
import * as cors from "cors";
import * as mongoose from "mongoose";
import * as passport from "passport";
import * as expressJwt from "express-jwt";
import * as NodeCache from "node-cache";

import { generateToken, sendToken, secret } from "./lib/jwt";
import {
	init as passportInit,
	getCurrentUser,
	createUser
} from "./lib/passport";
import axios from "axios";
import * as _ from "lodash";
/**
 * Connect to MongoDB.
 */
mongoose.Promise = Promise;
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/", {
	useMongoClient: true
});

mongoose.connection.on("error", () => {
	console.log(
		"MongoDB connection error. Please make sure MongoDB is running."
	);
	process.exit();
});

const port = Number(process.env.PORT || 3030);
const app = express(),
	router = express.Router();

// Initialize Passport
passportInit();

app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(
	bodyParser.urlencoded({
		// to support URL-encoded bodies
		extended: true
	})
);

// enable cors
const corsOption = {
	origin: true,
	methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
	credentials: true,
	exposedHeaders: ["x-auth-token"]
};
app.use(cors(corsOption));

router.post(
	"/auth/facebook",
	passport.authenticate("facebook-token", { session: false }),
	function(req, res, next) {
		if (!req.user) {
			return res.send(401, "User Not Authenticated");
		}

		// prepare token for API
		req.auth = {
			id: req.user.id
		};

		next();
	},
	generateToken,
	sendToken
);

router.post("/auth/local", createUser, generateToken, sendToken);

//token handling middleware
const authenticate = expressJwt({
	secret,
	requestProperty: "auth",
	getToken: function(req) {
		if (req.headers["x-auth-token"]) {
			return req.headers["x-auth-token"];
		}
		return null;
	}
});

router.get("/me", authenticate, getCurrentUser);

const API_URL = "https://api.coinmarketcap.com/v1/ticker?limit=10";
const myCache = new NodeCache({ stdTTL: 5 * 60, checkperiod: 60 });

// Return tickers list
router.get("/ticker", async function(req, res) {
	let tickers = myCache.get("tickers");
	if (tickers) return res.json(_.map(tickers, value => value.id));

	let response = await axios.get(API_URL);
	let { data } = response;
	myCache.set("tickers", data);
	tickers = _.map(data, value => value.id);
	res.json(tickers);
});

// Return all data 
router.get("/ticker/all", async function(req, res) {
	let tickers = myCache.get("tickers");
	if (tickers) return res.json(tickers);

	let response = await axios.get(API_URL);
	let { data } = response;
	myCache.set("tickers", data);
	res.json(data);
});

app.use("/api", router);
app.use(function(err, req, res, next) {
	if (err.name === "UnauthorizedError") {
		res.status(401).send(err.message);
	} else res.status(500).send(err.message);
});

app.listen(port);

console.log("Server running at port " + port);

export default app;
