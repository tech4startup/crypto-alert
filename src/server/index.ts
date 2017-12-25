import * as express from "express";
import * as bodyParser from "body-parser";
import * as cors from "cors";
import * as mongoose from "mongoose";
import * as passport from "passport";
import * as expressJwt from "express-jwt";

import { generateToken, sendToken, secret } from "./lib/jwt";
import { init as passportInit, getCurrentUser } from "./lib/passport";

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

router.post(
	'/auth/local',
	async function (req, res){
		let { body: { name, email, password } } = req;
		
	}
)

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

app.use("/api", router);
app.use(function(err, req, res, next) {
	if (err.name === "UnauthorizedError") {
		res.status(401).send(err.message);
	}
});

app.listen(port);

console.log("Server running at port " + port);

export default app;
