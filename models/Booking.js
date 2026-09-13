const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingReference: {
    type: String,
    required: true,
    unique: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  chargerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Charger',
    required: true
  },
  bookingDate: {
    type: String,
    required: true
  },
  timeSlot: {
    type: String,
    required: true // e.g. "10:00 AM - 12:00 PM"
  },
  durationHours: {
    type: Number,
    default: 2
  },
  totalAmount: {
    type: Number,
    required: true
  },
  platformFee: {
    type: Number,
    default: 15
  },
  hostEarnings: {
    type: Number,
    required: true
  },
  otpCode: {
    type: String,
    required: true // 4-digit check-in verification
  },
  status: {
    type: String,
    enum: ['Confirmed', 'In-Progress', 'Completed', 'Cancelled'],
    default: 'Confirmed'
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Pending', 'Refunded'],
    default: 'Paid'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Composite unique index to enforce double-booking prevention at DB level
bookingSchema.index({ chargerId: 1, bookingDate: 1, timeSlot: 1 }, { unique: true });

module.exports = mongoose.model('Booking', bookingSchema);
