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
    throw e;
  }
});


const isPasswordPath = (path) => path === 'password' || path.startsWith('password.');

userSchema.pre(
  ['updateOne', 'findOneAndUpdate', 'updateMany', 'replaceOne', 'findOneAndReplace'],
  async function () {
    const update = this.getUpdate();
    if (!update) return;

    // Pipelines and replacements bypass the password handling below.
    if (Array.isArray(update) || ['replaceOne', 'findOneAndReplace'].includes(this.op)) {
      throw new Error('User pipelines and replacements are not supported; use save() instead.');
    }

    const passwordUpdates = [];
    for (const [operator, value] of Object.entries(update)) {
      const fields = operator.startsWith('$') ? value : { [operator]: value };
      for (const [path, target] of Object.entries(fields || {})) {
        const renamesPassword = operator === '$rename' &&
          typeof target === 'string' && isPasswordPath(target);
        if (!isPasswordPath(path) && !renamesPassword) continue;

        if (!['updateOne', 'findOneAndUpdate'].includes(this.op) ||
            path !== 'password' || renamesPassword ||
            !['password', '$set', '$setOnInsert'].includes(operator)) {
          throw new Error('Passwords must be set using save(), updateOne(), or findOneAndUpdate().');
        }
        passwordUpdates.push(operator.startsWith('$') ? fields : update);
      }
    }

    // MongoDB can copy equality filters into upserted documents.
    if (this.getOptions().upsert && passwordUpdates.length === 0) {
      throw new Error('User upserts require an explicit password in the update.');
    }

    for (const fields of passwordUpdates) {
      if (typeof fields.password !== 'string' || fields.password.length < 6) {
        throw new Error('Password must be a string with at least 6 characters.');
      }
      fields.password = await bcrypt.hash(fields.password, 15);
    }
  }
);

// These model APIs bypass save and query middleware, including with lean writes.
userSchema.pre(['insertMany', 'bulkWrite'], async function () {
  throw new Error('User batch writes are not supported; use create() or individual updates instead.');
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
    throw e;
  }
};


const User = model('User', userSchema);
export default User;
