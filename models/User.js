const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['driver', 'host', 'admin'],
    default: 'driver'
  },
  vehicle: {
    make: { type: String, default: 'Tata' },
    model: { type: String, default: 'Nexon EV Max' },
    batteryCapacityKwh: { type: Number, default: 40.5 },
    connectorType: { type: String, default: 'Type-2 AC' }
  },
  walletBalance: {
    type: Number,
    default: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
