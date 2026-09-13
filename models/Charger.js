const mongoose = require('mongoose');

const chargerSchema = new mongoose.Schema({
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  socketType: {
    type: String,
    enum: ['Type-2 AC (7.4 kW)', '15A Industrial Socket (3.3 kW)', 'Type-2 AC (11 kW)', 'CCS2 Fast DC'],
    default: 'Type-2 AC (7.4 kW)'
  },
  powerKw: {
    type: Number,
    required: true,
    default: 7.4
  },
  pricePerHour: {
    type: Number,
    required: true
  },
  pricePerUnit: {
    type: Number,
    required: true
  },
  parkingType: {
    type: String,
    default: 'Gated Covered Parking'
  },
  amenities: [{
    type: String
  }],
  availableHours: {
    start: { type: String, default: '08:00 AM' },
    end: { type: String, default: '08:00 PM' }
  },
  isVerified: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    default: 4.8
  },
  reviewsCount: {
    type: Number,
    default: 12
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create 2dsphere index for MongoDB Geospatial queries ($near, $geoWithin)
chargerSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Charger', chargerSchema);
