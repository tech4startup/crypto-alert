import * as jwt from "jsonwebtoken";

export const secret = "ilovekitty@t4s";

export function createToken(auth) {
	return jwt.sign(
		{
			id: auth.id
		},
		secret,
		{
			expiresIn: 60 * 120
		}
	);
}

export function generateToken(req, res, next) {
	req.token = createToken(req.auth);
	next();
}

export function sendToken(req, res) {
	res.setHeader("x-auth-token", req.token);
	res.status(200).send(req.auth);
}
