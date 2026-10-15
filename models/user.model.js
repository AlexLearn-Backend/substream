import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";


const userSchema = new Schema({
  name : {
    type: String,
    required: [true, 'User Name is required!'],
    trim: true,
    minLength: 2,
    maxLength: 50
  },

  email: {
    type: String,
    required: [true, 'User Email is required!'],
    unique: true,
    trim: true,
    lowercase: true,
    minLength: [12, 'Email too short to be valid!'],
    maxLength: 250,
    match: [/^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/, 'Please enter a valid email address!']
  },
  
  password: {
    type: String,
    required: true,
    minLength: 6
  }
}, { timestamps: true });


userSchema.pre("save", async function () {
  try {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 15);
  } catch (e) {
    console.error(`Error hashing password: ${e.message}`);
  }
});


userSchema.methods.comparePassword = async function (password) {
  try {
    const isMatch = await bcrypt.compare(password, this.password);
    return isMatch;
  } catch (e) {
    console.error(`Error comparing password: ${e.message}`);
  }
};


userSchema.methods.changePassword = async function (current, newPass) {
  try {
    const oldIsValid = await this.comparePassword(current);

    if (!oldIsValid)
      throw new Error("The current password you entered is incorrect.");

    const isSame = await bcrypt.compare(newPass, this.password);
    if (isSame)
      throw new Error("New password cannot be the same as current password.");

    this.password = newPass;

    await this.save();
  } catch (e) {
    console.error(`Error changing password: ${e.message}`);
  }
};


const User = model('User', userSchema);
export default User;