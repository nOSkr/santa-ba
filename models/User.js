import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const UserSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: [true, "Утасны дугаараа оруулна уу"],
  },
  role: {
    type: String,
    enum: ["user", "operator", "admin"],
    default: "user",
  },
  avatar: {
    url: String,
    blurHash: String,
  },
  eggCount: {
    type: Number,
    default: 0,
  },
  expoPushToken: String,
  version: String,
  password: {
    type: String,
    minlength: 4,
    required: [true, "Нууц үгээ оруулна уу"],
    select: false,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

UserSchema.pre("save", async function (next) {
  // Нууц үг өөрчлөгдөөгүй бол дараачийн middleware рүү шилж
  if (!this.isModified("password")) next();

  // Нууц үг өөрчлөгдсөн
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.getJsonWebToken = function () {
  const token = jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRESIN,
    }
  );

  return token;
};

UserSchema.methods.checkPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.generatePasswordChangeToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

export default mongoose.model("User", UserSchema);
