import { Schema, model } from "mongoose";


const subscriptionModel = new Schema({
  name: {
    type: String,
    required: [true, 'Subscription Name is required!'],
    trim: true,
    minLength: 2,
    maxLength: 100
  },

  price: {
    type: Number,
    required: [true, 'Subscription Price is required!'],
    min: [0, 'Price must be greater than 0!']
  },

  currency: {
    type: String,
    enum: ['USD', 'EUR', 'GBP'],
    default: 'USD'
  },

  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'annually'],
    default: 'monthly'
  },

  category: {
    type: String,
    enum: [
      'sports', 'news', 'entertainment',
      'lifestyle', 'technology', 'finance',
      'politics', 'other'
    ],
    required: true
  },

  paymentMethod: {
    type: String,
    required: true,
    trim: true,
  },

  status: {
    type: String,
    enum: ['active', 'canceled', 'expired'],
    default: 'active'
  },

  startDate: {
    type: Date,
    required: true,
    validate: {
      validator: (value) => value <= new Date(),
      message: 'Start date must be in the past'
    }
  },

  renewalDate: {
    type: Date,
    required: true,
    validate: {
      validator: function (value) {
        return value > this.startDate;
      },
      message: 'Renewal date must be after the start date'
    }
  },

  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  }
}, { timestamps: true });


subscriptionModel.pre('validate', function (next) {
  if (!this.renewalDate) {
    const renewalPeriods = {
      daily: 1,
      weekly: 7,
      monthly: 30,
      annually: 365
    }

    this.renewalDate = new Date(this.startDate);
    this.renewalDate.setDate(
      this.renewalDate.getDate() + renewalPeriods[this.frequency]
    );
  }

  if (this.status === 'active' && this.renewalDate < new Date()) {
    this.status = 'expired'
  }

  next();
})


const Subscription = model('Subscription', subscriptionModel);
export default Subscription;
