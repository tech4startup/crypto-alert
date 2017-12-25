import { Document, Schema, Model, model } from "mongoose";
import * as bcrypt from "bcrypt";

const SALT_FACTOR = 10;

export interface IProvider {
	id: string;
	token: string;
}

export interface IUserModel extends Document {
	email: string;
	name: string;
	password: string;
}

export var UserSchema: Schema = new Schema({
	name: {
		type: String,
		required: true
	},
	email: {
		type: String,
		required: true,
		index: { unique: true }
	},
	password: {
		type: String
	},
	facebookProvider: {
		type: {
			id: String,
			token: String
		},
		select: false
	}
});

UserSchema.pre("save", function(next) {
	let user = this;

	// only hash the password if it has been modified (or is new)
	if (!user.password || !user.isModified("password")) {
		return next();
	}

	// generate a salt
	bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
		if (err) return next(err);

		// hash the password using our new salt
		bcrypt.hash(user.password, salt, function(err, hash) {
			if (err) return next(err);

			// override the cleartext password with the hashed one
			user.password = hash;
			next();
		});
	});
});

UserSchema.methods.comparePassword = function(candidatePassword) {
	return bcrypt.compareSync(candidatePassword, this.password);
};

UserSchema.set("toJSON", { getters: true, virtuals: true });

UserSchema.statics.upsertFacebookUser = async function(
	accessToken,
	refreshToken,
	profile
) {
	let user = await this.findOne({ "facebookProvider.id": profile.id });

	// if no user was found -> create new one
	if (!user) {
		user = await this.create({
			name: profile.displayName,
			email: profile.emails[0].value,
			facebookProvider: {
				id: profile.id,
				token: accessToken
			}
		});
	}
	return user;
};

export const User: Model<IUserModel> = model<IUserModel>("User", UserSchema);
