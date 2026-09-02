const mongoose = require('mongoose')

const userSchema = mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    monthlyRevenues: { type: Number, required: true },
    monthlyCharges: { type: Number, required: true },
    leftover: Number
  },
  { timestamps: true }
)

userSchema.pre('save', function (next) {
  this.leftover = (this.monthlyRevenues || 0) - (this.monthlyCharges || 0)
  next()
})

userSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate()
  if (
    update.monthlyRevenues !== undefined ||
    update.monthlyCharges !== undefined
  ) {
    const revenue =
      update.monthlyRevenues ?? this._update.$set?.monthlyRevenues ?? 0
    const charges =
      update.monthlyCharges ?? this._update.$set?.monthlyCharges ?? 0
    update.leftover = revenue - charges
  }
  next()
})

const User = mongoose.model('User', userSchema)

module.exports = User
