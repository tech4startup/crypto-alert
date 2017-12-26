import * as passport from "passport";
import * as FacebookTokenStrategy from "passport-facebook-token";
import { User } from "../models/user";

export function init() {
	passport.use(
		new FacebookTokenStrategy(
			{
				clientID: "YOUR-FACEBOOK-CLIENT-ID",
				clientSecret: "YOUR-FACEBOOK-CLIENT-SECRET"
			},
			function(accessToken, refreshToken, profile, done) {
				User.upsertFbUser(accessToken, refreshToken, profile)
					.then(user => done(null, user))
					.catch(err => done(err));
			}
		)
	);
}

export async function getCurrentUser(req, res) {
	let { auth: { id } } = req; 
	let user = await User.findById(id).lean();
	
	res.json(user);
}

export async function createUser(req, res, next) {
	let { name, email, password } = req.body;
	let user = await User.create({ name, email, password });
	req.auth = { id: user._id };
	next();
}
