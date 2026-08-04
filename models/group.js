const mongoose = require("mongoose");
const crypto = require("crypto");

const memberSchema = mongoose.Schema({
  nickname: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  owner: { type: Boolean },
  share: Number,
});

const groupSchema = mongoose.Schema({
  name: { type: String, required: true },
  imageUrl: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  members: [memberSchema],
});

const CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function generateCode() {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += CODE_CHARS[crypto.randomInt(CODE_CHARS.length)];
  }
  return code;
}

groupSchema.pre("validate", async function (next) {
  if (this.code) return next();
  let unique = false;
  while (!unique) {
    this.code = generateCode();
    const existing = await Group.findOne({ code: this.code });
    if (!existing) unique = true;
  }
  next();
});

const Group = mongoose.model("Group", groupSchema);

module.exports = Group;
