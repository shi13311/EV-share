const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

const PORT = process.env.PORT || 5000;

// OTP Store for mobile verification
const otpsData = new Map();

// Helper to send real SMS via Fast2SMS (Free Indian SMS Gateway)
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || '6vF2rRgi5ksNcpy8oXBGEZQbmn7qPM4xKIeTJzLDu1tja0wC9h9H7nDlUe2Ccg4fujEW6AKqmstMJpFQ';

function sendRealSms(phone, otpCode, callback) {
  const apiKey = FAST2SMS_API_KEY;
  if (apiKey) {
    const postData = JSON.stringify({
      route: 'otp',
      variables_values: otpCode,
      numbers: phone
    });

    const options = {
      hostname: 'www.fast2sms.com',
      port: 443,
      path: '/dev/bulkV2',
      method: 'POST',
      headers: {
        'authorization': apiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        console.log(`[SMS GATEWAY] Fast2SMS dispatched to +91 ${phone}:`, data);
        let parsed = {};
        try { parsed = JSON.parse(data); } catch(e) {}
        const delivered = parsed.return === true;
        if (callback) callback(null, delivered, parsed);
      });
    });

    req.on('error', (err) => {
      console.error(`[SMS GATEWAY ERROR]:`, err.message);
      if (callback) callback(err, false, { message: err.message });
    });

    req.write(postData);
    req.end();
  } else {
    // When no API key is provided, log to server terminal
    console.log(`\n======================================================`);
    console.log(`📱 [SMS DISPATCH TO MOBILE NUMBER]`);
    console.log(`📞 Recipient: +91 ${phone}`);
    console.log(`🔑 Verification OTP: ${otpCode}`);
    console.log(`ℹ️ Set FAST2SMS_API_KEY to send live SMS directly to handset.`);
    console.log(`======================================================\n`);
    if (callback) callback(null, false);
  }
}

// In-Memory Seed Data for Pan-India network
let chargersData = [
  {
    "id": "ch-del-01",
    "hostName": "Rohit Malhotra",
    "hostPhone": "+91 98188 12345",
    "hostRating": 4.9,
    "verifiedHost": true,
    "address": "Tower B-4, Sector 62, Noida, Delhi-NCR",
    "city": "Delhi-NCR",
    "mapX": 48,
    "mapY": 28,
    "distanceKm": 2.1,
    "socketType": "Type-2 AC (7.4 kW)",
    "vehicleSupport": [
      "4-Wheeler (Car)"
    ],
    "powerKw": 7.4,
    "pricePerHour": 60,
    "pricePerUnit": 17,
    "parkingType": "Covered Basement Parking",
    "amenities": [
      "Wi-Fi",
      "Tea/Coffee",
      "CCTV Secured"
    ],
    "availableDays": "All Days",
    "availableHours": "08:00 AM - 10:00 PM",
    "bookedSlots": [
      "10:00 AM - 12:00 PM"
    ],
    "image": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-del-02",
    "hostName": "Vikramaditya Singh",
    "hostPhone": "+91 98711 55443",
    "hostRating": 4.8,
    "verifiedHost": true,
    "address": "DLF Phase 5, Golf Course Road, Gurugram, Delhi-NCR",
    "city": "Delhi-NCR",
    "mapX": 45,
    "mapY": 33,
    "distanceKm": 3.5,
    "socketType": "Type-2 AC (11 kW Fast AC)",
    "vehicleSupport": [
      "4-Wheeler (Car)"
    ],
    "powerKw": 11,
    "pricePerHour": 85,
    "pricePerUnit": 19,
    "parkingType": "Gated Driveway",
    "amenities": [
      "Solar Powered",
      "Wi-Fi",
      "Lounge Access"
    ],
    "availableDays": "Mon - Sat",
    "availableHours": "09:00 AM - 08:00 PM",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1558441719-646b22ad440c?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-del-03",
    "hostName": "Neha Gupta",
    "hostPhone": "+91 98188 99001",
    "hostRating": 4.9,
    "verifiedHost": true,
    "address": "M-Block, Greater Kailash 2, South Delhi",
    "city": "Delhi-NCR",
    "mapX": 47,
    "mapY": 31,
    "distanceKm": 4,
    "socketType": "15A Industrial Socket (3.3 kW)",
    "vehicleSupport": [
      "2-Wheeler (Scooter)",
      "2-Wheeler (Bike)",
      "3-Wheeler (Commercial)"
    ],
    "powerKw": 3.3,
    "pricePerHour": 35,
    "pricePerUnit": 13,
    "parkingType": "Ground Floor Porch",
    "amenities": [
      "Quick Charge for Bikes",
      "Drinking Water"
    ],
    "availableDays": "All Days",
    "availableHours": "07:00 AM - 10:00 PM",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1647891941746-fe1d53ddc7a6?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-blr-01",
    "hostName": "Rajesh Sharma",
    "hostPhone": "+91 98765 43210",
    "hostRating": 4.9,
    "verifiedHost": true,
    "address": "Villa 24, Palm Meadows, Whitefield, Bengaluru",
    "city": "Bengaluru",
    "mapX": 49,
    "mapY": 77,
    "distanceKm": 1.8,
    "socketType": "Type-2 AC (7.4 kW)",
    "vehicleSupport": [
      "4-Wheeler (Car)"
    ],
    "powerKw": 7.4,
    "pricePerHour": 65,
    "pricePerUnit": 18,
    "parkingType": "Gated Covered Parking",
    "amenities": [
      "Wi-Fi",
      "Washroom Access",
      "CCTV Secured"
    ],
    "availableDays": "Mon - Sat",
    "availableHours": "08:00 AM - 08:00 PM",
    "bookedSlots": [
      "10:00 AM - 12:00 PM"
    ],
    "image": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-blr-02",
    "hostName": "Priya Venkatesh",
    "hostPhone": "+91 98111 22334",
    "hostRating": 4.8,
    "verifiedHost": true,
    "address": "Flat 4B, Green Glen Layout, Bellandur, Bengaluru",
    "city": "Bengaluru",
    "mapX": 51,
    "mapY": 79,
    "distanceKm": 3.4,
    "socketType": "15A Industrial Socket (3.3 kW)",
    "vehicleSupport": [
      "2-Wheeler (Scooter)",
      "2-Wheeler (Bike)",
      "3-Wheeler (Commercial)"
    ],
    "powerKw": 3.3,
    "pricePerHour": 40,
    "pricePerUnit": 14,
    "parkingType": "Apartment Basement Dedicated Slot",
    "amenities": [
      "Security Guard",
      "CCTV",
      "Drinking Water"
    ],
    "availableDays": "All Days",
    "availableHours": "09:00 AM - 10:00 PM",
    "bookedSlots": [
      "02:00 PM - 04:00 PM"
    ],
    "image": "https://images.unsplash.com/photo-1647891941746-fe1d53ddc7a6?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-blr-03",
    "hostName": "Anand Vardhan",
    "hostPhone": "+91 98450 33221",
    "hostRating": 4.9,
    "verifiedHost": true,
    "address": "100 Ft Road, HAL 2nd Stage, Indiranagar, Bengaluru",
    "city": "Bengaluru",
    "mapX": 48,
    "mapY": 75,
    "distanceKm": 2.3,
    "socketType": "Type-2 AC (11 kW Fast AC)",
    "vehicleSupport": [
      "4-Wheeler (Car)"
    ],
    "powerKw": 11,
    "pricePerHour": 80,
    "pricePerUnit": 19,
    "parkingType": "Dedicated Driveway",
    "amenities": [
      "Fast AC Charging",
      "Wi-Fi",
      "Coffee Shop Nearby"
    ],
    "availableDays": "All Days",
    "availableHours": "07:00 AM - 11:00 PM",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1558441719-646b22ad440c?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-mum-01",
    "hostName": "Aditya Deshmukh",
    "hostPhone": "+91 98200 11223",
    "hostRating": 4.9,
    "verifiedHost": true,
    "address": "Sea Face Enclave, Bandra West, Mumbai",
    "city": "Mumbai",
    "mapX": 32,
    "mapY": 57,
    "distanceKm": 2.8,
    "socketType": "Type-2 AC (7.4 kW)",
    "vehicleSupport": [
      "4-Wheeler (Car)"
    ],
    "powerKw": 7.4,
    "pricePerHour": 75,
    "pricePerUnit": 20,
    "parkingType": "Dedicated Stilt Parking",
    "amenities": [
      "Sea View Lounge",
      "CCTV",
      "Washroom"
    ],
    "availableDays": "All Days",
    "availableHours": "07:00 AM - 11:00 PM",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1593941707874-ef25b8b4a92b?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-mum-02",
    "hostName": "Sneha Kulkarni",
    "hostPhone": "+91 98330 44556",
    "hostRating": 4.8,
    "verifiedHost": true,
    "address": "Heritage Heights, Hiranandani Gardens, Powai, Mumbai",
    "city": "Mumbai",
    "mapX": 34,
    "mapY": 55,
    "distanceKm": 3.1,
    "socketType": "15A Industrial Socket (3.3 kW)",
    "vehicleSupport": [
      "2-Wheeler (Scooter)",
      "2-Wheeler (Bike)",
      "3-Wheeler (Commercial)"
    ],
    "powerKw": 3.3,
    "pricePerHour": 45,
    "pricePerUnit": 15,
    "parkingType": "Podium Resident Parking",
    "amenities": [
      "Gated Security",
      "CCTV",
      "Drinking Water"
    ],
    "availableDays": "All Days",
    "availableHours": "08:00 AM - 10:00 PM",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1647891941746-fe1d53ddc7a6?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-pun-01",
    "hostName": "Sachin Patil",
    "hostPhone": "+91 98900 44556",
    "hostRating": 4.7,
    "verifiedHost": true,
    "address": "Bunglow 18, Baner Road, Near Expressway Exit, Pune",
    "city": "Pune",
    "mapX": 37,
    "mapY": 61,
    "distanceKm": 4.1,
    "socketType": "Type-2 AC (11 kW Fast AC)",
    "vehicleSupport": [
      "4-Wheeler (Car)"
    ],
    "powerKw": 11,
    "pricePerHour": 70,
    "pricePerUnit": 18,
    "parkingType": "Spacious Private Porch",
    "amenities": [
      "Expressway Stopover",
      "Cafe Nearby",
      "Wi-Fi"
    ],
    "availableDays": "All Days",
    "availableHours": "24/7 Available",
    "bookedSlots": [
      "04:00 PM - 06:00 PM"
    ],
    "image": "https://images.unsplash.com/photo-1558441719-646b22ad440c?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-pun-02",
    "hostName": "Amol Joshi",
    "hostPhone": "+91 98220 77889",
    "hostRating": 4.8,
    "verifiedHost": true,
    "address": "Plot 12, Clover Park, Viman Nagar, Pune",
    "city": "Pune",
    "mapX": 39,
    "mapY": 62,
    "distanceKm": 2.9,
    "socketType": "15A Industrial Socket (3.3 kW)",
    "vehicleSupport": [
      "2-Wheeler (Scooter)",
      "2-Wheeler (Bike)",
      "3-Wheeler (Commercial)"
    ],
    "powerKw": 3.3,
    "pricePerHour": 35,
    "pricePerUnit": 13,
    "parkingType": "Covered Carport",
    "amenities": [
      "Wi-Fi",
      "Drinking Water"
    ],
    "availableDays": "All Days",
    "availableHours": "08:00 AM - 09:00 PM",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1647891941746-fe1d53ddc7a6?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-hyd-01",
    "hostName": "K. S. Rao",
    "hostPhone": "+91 98490 88776",
    "hostRating": 4.8,
    "verifiedHost": true,
    "address": "Plot 88, Financial District, Gachibowli, Hyderabad",
    "city": "Hyderabad",
    "mapX": 52,
    "mapY": 63,
    "distanceKm": 3.2,
    "socketType": "Type-2 AC (7.4 kW)",
    "vehicleSupport": [
      "4-Wheeler (Car)"
    ],
    "powerKw": 7.4,
    "pricePerHour": 65,
    "pricePerUnit": 17,
    "parkingType": "Villa Covered Carport",
    "amenities": [
      "Solar Powered",
      "High-Speed Wi-Fi"
    ],
    "availableDays": "Mon - Sat",
    "availableHours": "08:00 AM - 09:00 PM",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-hyd-02",
    "hostName": "Madhuri Reddy",
    "hostPhone": "+91 98660 12345",
    "hostRating": 4.9,
    "verifiedHost": true,
    "address": "Road No. 36, Jubilee Hills, Hyderabad",
    "city": "Hyderabad",
    "mapX": 54,
    "mapY": 64,
    "distanceKm": 2.5,
    "socketType": "15A Industrial Socket (3.3 kW)",
    "vehicleSupport": [
      "2-Wheeler (Scooter)",
      "2-Wheeler (Bike)",
      "3-Wheeler (Commercial)"
    ],
    "powerKw": 3.3,
    "pricePerHour": 40,
    "pricePerUnit": 14,
    "parkingType": "Private Gate Driveway",
    "amenities": [
      "CCTV",
      "Lounge Access",
      "Water"
    ],
    "availableDays": "All Days",
    "availableHours": "07:00 AM - 10:00 PM",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1647891941746-fe1d53ddc7a6?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-chn-01",
    "hostName": "S. Balasubramanian",
    "hostPhone": "+91 98410 77112",
    "hostRating": 4.9,
    "verifiedHost": true,
    "address": "1st Main Road, Gandhi Nagar, Adyar, Chennai",
    "city": "Chennai",
    "mapX": 58,
    "mapY": 77,
    "distanceKm": 2.7,
    "socketType": "Type-2 AC (7.4 kW)",
    "vehicleSupport": [
      "4-Wheeler (Car)"
    ],
    "powerKw": 7.4,
    "pricePerHour": 65,
    "pricePerUnit": 18,
    "parkingType": "Individual House Porch",
    "amenities": [
      "Shaded Parking",
      "Solar Backed",
      "Drinking Water"
    ],
    "availableDays": "All Days",
    "availableHours": "07:00 AM - 10:00 PM",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-chn-02",
    "hostName": "Karthik Raman",
    "hostPhone": "+91 98840 99881",
    "hostRating": 4.8,
    "verifiedHost": true,
    "address": "Tower 3, OMR IT Corridor, Sholinganallur, Chennai",
    "city": "Chennai",
    "mapX": 60,
    "mapY": 79,
    "distanceKm": 3.8,
    "socketType": "15A Industrial Socket (3.3 kW)",
    "vehicleSupport": [
      "2-Wheeler (Scooter)",
      "2-Wheeler (Bike)",
      "3-Wheeler (Commercial)"
    ],
    "powerKw": 3.3,
    "pricePerHour": 35,
    "pricePerUnit": 13,
    "parkingType": "Gated Stilt Parking",
    "amenities": [
      "24x7 Security",
      "CCTV"
    ],
    "availableDays": "All Days",
    "availableHours": "08:00 AM - 09:00 PM",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1647891941746-fe1d53ddc7a6?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-kol-01",
    "hostName": "Anirban Mukherjee",
    "hostPhone": "+91 98300 22334",
    "hostRating": 4.9,
    "verifiedHost": true,
    "address": "Block AE, Action Area 1, New Town, Kolkata",
    "city": "Kolkata",
    "mapX": 78,
    "mapY": 45,
    "distanceKm": 2.2,
    "socketType": "Type-2 AC (7.4 kW)",
    "vehicleSupport": [
      "4-Wheeler (Car)"
    ],
    "powerKw": 7.4,
    "pricePerHour": 60,
    "pricePerUnit": 16,
    "parkingType": "Gated Bungalow Driveway",
    "amenities": [
      "Wi-Fi",
      "Tea/Coffee",
      "CCTV"
    ],
    "availableDays": "All Days",
    "availableHours": "08:00 AM - 10:00 PM",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-kol-02",
    "hostName": "Debashis Sen",
    "hostPhone": "+91 98311 44556",
    "hostRating": 4.7,
    "verifiedHost": true,
    "address": "Block CF, Sector 1, Salt Lake City, Kolkata",
    "city": "Kolkata",
    "mapX": 80,
    "mapY": 43,
    "distanceKm": 3,
    "socketType": "15A Industrial Socket (3.3 kW)",
    "vehicleSupport": [
      "2-Wheeler (Scooter)",
      "2-Wheeler (Bike)",
      "3-Wheeler (Commercial)"
    ],
    "powerKw": 3.3,
    "pricePerHour": 35,
    "pricePerUnit": 13,
    "parkingType": "Ground Floor Garage",
    "amenities": [
      "CCTV",
      "Drinking Water"
    ],
    "availableDays": "All Days",
    "availableHours": "07:30 AM - 09:30 PM",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1647891941746-fe1d53ddc7a6?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-ahd-01",
    "hostName": "Bhavesh Patel",
    "hostPhone": "+91 98250 88990",
    "hostRating": 4.9,
    "verifiedHost": true,
    "address": "Iscon Platinum, Bopal Road, SG Highway, Ahmedabad",
    "city": "Ahmedabad",
    "mapX": 30,
    "mapY": 45,
    "distanceKm": 1.9,
    "socketType": "Type-2 AC (7.4 kW)",
    "vehicleSupport": [
      "4-Wheeler (Car)"
    ],
    "powerKw": 7.4,
    "pricePerHour": 60,
    "pricePerUnit": 16,
    "parkingType": "Basement Reserved EV Bay",
    "amenities": [
      "Solar Powered",
      "Wi-Fi",
      "CCTV"
    ],
    "availableDays": "All Days",
    "availableHours": "08:00 AM - 10:00 PM",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-sur-01",
    "hostName": "Hardik Mehta",
    "hostPhone": "+91 98240 55667",
    "hostRating": 4.9,
    "verifiedHost": true,
    "address": "Valentina Business Hub Area, VIP Road, Vesu, Surat",
    "city": "Surat",
    "mapX": 32,
    "mapY": 51,
    "distanceKm": 1.7,
    "socketType": "Type-2 AC (7.4 kW)",
    "vehicleSupport": [
      "4-Wheeler (Car)"
    ],
    "powerKw": 7.4,
    "pricePerHour": 60,
    "pricePerUnit": 16,
    "parkingType": "Diamond City Premium Port",
    "amenities": [
      "High-Speed Wi-Fi",
      "CCTV",
      "Lounge"
    ],
    "availableDays": "All Days",
    "availableHours": "08:00 AM - 10:00 PM",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-bdq-01",
    "hostName": "Chirag Amin",
    "hostPhone": "+91 98255 33441",
    "hostRating": 4.8,
    "verifiedHost": true,
    "address": "Alkapuri Main Road, Near Railway Station, Vadodara",
    "city": "Vadodara",
    "mapX": 31,
    "mapY": 48,
    "distanceKm": 2.1,
    "socketType": "Type-2 AC (7.4 kW)",
    "vehicleSupport": [
      "4-Wheeler (Car)"
    ],
    "powerKw": 7.4,
    "pricePerHour": 55,
    "pricePerUnit": 15,
    "parkingType": "Gated Apartment Dedicated Slot",
    "amenities": [
      "Wi-Fi",
      "CCTV Secured"
    ],
    "availableDays": "All Days",
    "availableHours": "08:00 AM - 10:00 PM",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-jai-01",
    "hostName": "Gajendra Shekhawat",
    "hostPhone": "+91 98290 66778",
    "hostRating": 4.8,
    "verifiedHost": true,
    "address": "C-14, Bhagwan Das Road, C-Scheme, Jaipur",
    "city": "Jaipur",
    "mapX": 41,
    "mapY": 34,
    "distanceKm": 2.4,
    "socketType": "Type-2 AC (7.4 kW)",
    "vehicleSupport": [
      "4-Wheeler (Car)"
    ],
    "powerKw": 7.4,
    "pricePerHour": 55,
    "pricePerUnit": 15,
    "parkingType": "Heritage Haveli Courtyard",
    "amenities": [
      "Tea Lounge",
      "Shaded Area",
      "CCTV"
    ],
    "availableDays": "All Days",
    "availableHours": "08:00 AM - 09:00 PM",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-udr-01",
    "hostName": "Vikramaditya Rathore",
    "hostPhone": "+91 98291 55662",
    "hostRating": 4.9,
    "verifiedHost": true,
    "address": "Fatehsagar Lake Ring Road, Udaipur",
    "city": "Udaipur",
    "mapX": 37,
    "mapY": 39,
    "distanceKm": 1.8,
    "socketType": "Type-2 AC (7.4 kW)",
    "vehicleSupport": [
      "4-Wheeler (Car)"
    ],
    "powerKw": 7.4,
    "pricePerHour": 60,
    "pricePerUnit": 16,
    "parkingType": "Lakeside Villa Driveway",
    "amenities": [
      "Lake View Lounge",
      "CCTV",
      "Wi-Fi"
    ],
    "availableDays": "All Days",
    "availableHours": "07:00 AM - 11:00 PM",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-lko-01",
    "hostName": "Alok Trivedi",
    "hostPhone": "+91 94150 11223",
    "hostRating": 4.9,
    "verifiedHost": true,
    "address": "Vipul Khand 3, Near Ambedkar Park, Gomti Nagar, Lucknow",
    "city": "Lucknow",
    "mapX": 58,
    "mapY": 34,
    "distanceKm": 2.1,
    "socketType": "Type-2 AC (7.4 kW)",
    "vehicleSupport": [
      "4-Wheeler (Car)"
    ],
    "powerKw": 7.4,
    "pricePerHour": 55,
    "pricePerUnit": 15,
    "parkingType": "Wide Private Driveway",
    "amenities": [
      "Wi-Fi",
      "Washroom",
      "CCTV"
    ],
    "availableDays": "All Days",
    "availableHours": "08:00 AM - 10:00 PM",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-kan-01",
    "hostName": "Dr. Rajiv Tandon",
    "hostPhone": "+91 94151 77889",
    "hostRating": 4.8,
    "verifiedHost": true,
    "address": "Plot 24, Swaroop Nagar, Near Z-Square Mall, Kanpur",
    "city": "Kanpur",
    "mapX": 55,
    "mapY": 35,
    "distanceKm": 2.4,
    "socketType": "Type-2 AC (7.4 kW)",
    "vehicleSupport": [
      "4-Wheeler (Car)"
    ],
    "powerKw": 7.4,
    "pricePerHour": 50,
    "pricePerUnit": 14,
    "parkingType": "Bungalow Gated Porch",
    "amenities": [
      "Covered Parking",
      "CCTV",
      "Drinking Water"
    ],
    "availableDays": "All Days",
    "availableHours": "08:00 AM - 09:30 PM",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-var-01",
    "hostName": "Animesh Shastri",
    "hostPhone": "+91 94510 44552",
    "hostRating": 4.9,
    "verifiedHost": true,
    "address": "Sigra-Mahmoorganj Main Road, Varanasi",
    "city": "Varanasi",
    "mapX": 62,
    "mapY": 37,
    "distanceKm": 1.9,
    "socketType": "Type-2 AC (7.4 kW)",
    "vehicleSupport": [
      "4-Wheeler (Car)"
    ],
    "powerKw": 7.4,
    "pricePerHour": 55,
    "pricePerUnit": 15,
    "parkingType": "Courtyard Dedicated Spot",
    "amenities": [
      "Spiritual City Hub",
      "Wi-Fi",
      "Water"
    ],
    "availableDays": "All Days",
    "availableHours": "07:00 AM - 10:00 PM",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-agr-01",
    "hostName": "Manish Saxena",
    "hostPhone": "+91 94122 88991",
    "hostRating": 4.8,
    "verifiedHost": true,
    "address": "Taj Nagari Phase 2, Near Fatehabad Road, Agra",
    "city": "Agra",
    "mapX": 50,
    "mapY": 33,
    "distanceKm": 2.6,
    "socketType": "Type-2 AC (7.4 kW)",
    "vehicleSupport": [
      "4-Wheeler (Car)"
    ],
    "powerKw": 7.4,
    "pricePerHour": 55,
    "pricePerUnit": 15,
    "parkingType": "Private Gated Porch",
    "amenities": [
      "Taj Corridor Stopover",
      "CCTV",
      "Restroom"
    ],
    "availableDays": "All Days",
    "availableHours": "07:30 AM - 10:30 PM",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-chd-01",
    "hostName": "Gurpreet Singh Gill",
    "hostPhone": "+91 98140 22331",
    "hostRating": 4.9,
    "verifiedHost": true,
    "address": "Kothi 45, Sector 18-B, Chandigarh",
    "city": "Chandigarh",
    "mapX": 46,
    "mapY": 21,
    "distanceKm": 1.5,
    "socketType": "Type-2 AC (11 kW Fast AC)",
    "vehicleSupport": [
      "4-Wheeler (Car)"
    ],
    "powerKw": 11,
    "pricePerHour": 70,
    "pricePerUnit": 17,
    "parkingType": "Large Covered Car Porch",
    "amenities": [
      "Solar Charged",
      "Wi-Fi",
      "Lawn Waiting Area"
    ],
    "availableDays": "All Days",
    "availableHours": "07:00 AM - 10:00 PM",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1558441719-646b22ad440c?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-asr-01",
    "hostName": "Harjot Singh Sandhu",
    "hostPhone": "+91 98150 99881",
    "hostRating": 4.9,
    "verifiedHost": true,
    "address": "B-Block, Ranjit Avenue, Amritsar",
    "city": "Amritsar",
    "mapX": 43,
    "mapY": 19,
    "distanceKm": 2,
    "socketType": "Type-2 AC (7.4 kW)",
    "vehicleSupport": [
      "4-Wheeler (Car)"
    ],
    "powerKw": 7.4,
    "pricePerHour": 60,
    "pricePerUnit": 16,
    "parkingType": "Private Kothi Port",
    "amenities": [
      "Golden Temple Route",
      "Tea/Water",
      "CCTV"
    ],
    "availableDays": "All Days",
    "availableHours": "06:30 AM - 10:30 PM",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-ddn-01",
    "hostName": "Col. Vinod Rawat (Retd)",
    "hostPhone": "+91 94120 33221",
    "hostRating": 4.9,
    "verifiedHost": true,
    "address": "Rajpur Road, Near Silver City, Dehradun",
    "city": "Dehradun",
    "mapX": 51,
    "mapY": 23,
    "distanceKm": 1.6,
    "socketType": "Type-2 AC (7.4 kW)",
    "vehicleSupport": [
      "4-Wheeler (Car)"
    ],
    "powerKw": 7.4,
    "pricePerHour": 60,
    "pricePerUnit": 16,
    "parkingType": "Scenic Hill Foothills Garage",
    "amenities": [
      "Mountain Breeze",
      "Solar Backup",
      "Wi-Fi"
    ],
    "availableDays": "All Days",
    "availableHours": "07:00 AM - 10:00 PM",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-ind-01",
    "hostName": "Naman Agrawal",
    "hostPhone": "+91 98260 44551",
    "hostRating": 4.9,
    "verifiedHost": true,
    "address": "Scheme 54, Near Meghdoot Garden, Vijay Nagar, Indore",
    "city": "Indore",
    "mapX": 42,
    "mapY": 48,
    "distanceKm": 2,
    "socketType": "Type-2 AC (7.4 kW)",
    "vehicleSupport": [
      "4-Wheeler (Car)"
    ],
    "powerKw": 7.4,
    "pricePerHour": 55,
    "pricePerUnit": 15,
    "parkingType": "Covered Private Parking",
    "amenities": [
      "Wi-Fi",
      "Tea",
      "Cleanest City Host"
    ],
    "availableDays": "All Days",
    "availableHours": "08:00 AM - 10:00 PM",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-bho-01",
    "hostName": "Dr. Sanjay Verma",
    "hostPhone": "+91 94250 88221",
    "hostRating": 4.8,
    "verifiedHost": true,
    "address": "E-7, Arera Colony, Near Campion School, Bhopal",
    "city": "Bhopal",
    "mapX": 48,
    "mapY": 49,
    "distanceKm": 2.5,
    "socketType": "Type-2 AC (7.4 kW)",
    "vehicleSupport": [
      "4-Wheeler (Car)"
    ],
    "powerKw": 7.4,
    "pricePerHour": 55,
    "pricePerUnit": 15,
    "parkingType": "Covered Bunglow Porch",
    "amenities": [
      "Solar Powered",
      "Wi-Fi",
      "Water"
    ],
    "availableDays": "All Days",
    "availableHours": "08:00 AM - 09:00 PM",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-nag-01",
    "hostName": "Pradeep Deshpande",
    "hostPhone": "+91 98233 44551",
    "hostRating": 4.8,
    "verifiedHost": true,
    "address": "Civil Lines, Near Zero Mile Milestone, Nagpur",
    "city": "Nagpur",
    "mapX": 47,
    "mapY": 53,
    "distanceKm": 2.2,
    "socketType": "Type-2 AC (7.4 kW)",
    "vehicleSupport": [
      "4-Wheeler (Car)"
    ],
    "powerKw": 7.4,
    "pricePerHour": 55,
    "pricePerUnit": 15,
    "parkingType": "Zero Mile Central Hub Parking",
    "amenities": [
      "Central India Hub",
      "Wi-Fi",
      "CCTV"
    ],
    "availableDays": "All Days",
    "availableHours": "08:00 AM - 10:00 PM",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-nsk-01",
    "hostName": "Hemant Gaikwad",
    "hostPhone": "+91 98225 66772",
    "hostRating": 4.8,
    "verifiedHost": true,
    "address": "Gangapur Road, Near College Road, Nashik",
    "city": "Nashik",
    "mapX": 34,
    "mapY": 54,
    "distanceKm": 2.7,
    "socketType": "Type-2 AC (7.4 kW)",
    "vehicleSupport": [
      "4-Wheeler (Car)"
    ],
    "powerKw": 7.4,
    "pricePerHour": 55,
    "pricePerUnit": 15,
    "parkingType": "Private Residential Gate",
    "amenities": [
      "Wine Capital Stop",
      "CCTV"
    ],
    "availableDays": "All Days",
    "availableHours": "08:00 AM - 09:30 PM",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-goa-01",
    "hostName": "Mario Fernandes",
    "hostPhone": "+91 98221 66554",
    "hostRating": 4.9,
    "verifiedHost": true,
    "address": "Villa Sol, Miramar Beach Road, Panaji, Goa",
    "city": "Goa",
    "mapX": 36,
    "mapY": 71,
    "distanceKm": 2,
    "socketType": "Type-2 AC (7.4 kW)",
    "vehicleSupport": [
      "4-Wheeler (Car)"
    ],
    "powerKw": 7.4,
    "pricePerHour": 70,
    "pricePerUnit": 19,
    "parkingType": "Palm Shaded Courtyard",
    "amenities": [
      "Beachside Breeze",
      "Wi-Fi",
      "Cafe Access"
    ],
    "availableDays": "All Days",
    "availableHours": "24/7 Available",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-koc-01",
    "hostName": "George Mathew",
    "hostPhone": "+91 98470 12399",
    "hostRating": 4.9,
    "verifiedHost": true,
    "address": "Plot 14, Main Avenue, Panampilly Nagar, Kochi",
    "city": "Kochi",
    "mapX": 45,
    "mapY": 88,
    "distanceKm": 1.8,
    "socketType": "Type-2 AC (7.4 kW)",
    "vehicleSupport": [
      "4-Wheeler (Car)"
    ],
    "powerKw": 7.4,
    "pricePerHour": 60,
    "pricePerUnit": 16,
    "parkingType": "Private Villa Carport",
    "amenities": [
      "Solar Powered",
      "Wi-Fi",
      "Tea"
    ],
    "availableDays": "All Days",
    "availableHours": "07:00 AM - 10:00 PM",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-tvm-01",
    "hostName": "S. Pillai",
    "hostPhone": "+91 98475 22119",
    "hostRating": 4.9,
    "verifiedHost": true,
    "address": "Kowdiar Palace Avenue, Thiruvananthapuram",
    "city": "Thiruvananthapuram",
    "mapX": 47,
    "mapY": 92,
    "distanceKm": 2.1,
    "socketType": "Type-2 AC (7.4 kW)",
    "vehicleSupport": [
      "4-Wheeler (Car)"
    ],
    "powerKw": 7.4,
    "pricePerHour": 60,
    "pricePerUnit": 16,
    "parkingType": "Bungalow Driveway",
    "amenities": [
      "Solar Powered",
      "Wi-Fi",
      "Restroom"
    ],
    "availableDays": "All Days",
    "availableHours": "07:00 AM - 10:00 PM",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-cbe-01",
    "hostName": "R. Murugan",
    "hostPhone": "+91 98422 77881",
    "hostRating": 4.8,
    "verifiedHost": true,
    "address": "DB Road, RS Puram, Coimbatore",
    "city": "Coimbatore",
    "mapX": 47,
    "mapY": 83,
    "distanceKm": 1.9,
    "socketType": "Type-2 AC (7.4 kW)",
    "vehicleSupport": [
      "4-Wheeler (Car)"
    ],
    "powerKw": 7.4,
    "pricePerHour": 55,
    "pricePerUnit": 15,
    "parkingType": "Textile City Dedicated EV Bay",
    "amenities": [
      "High-Speed Wi-Fi",
      "Drinking Water"
    ],
    "availableDays": "All Days",
    "availableHours": "08:00 AM - 09:30 PM",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-mys-01",
    "hostName": "S. Sridhar",
    "hostPhone": "+91 98440 66552",
    "hostRating": 4.9,
    "verifiedHost": true,
    "address": "3rd Main, Gokulam 2nd Stage, Mysuru",
    "city": "Mysuru",
    "mapX": 47,
    "mapY": 79,
    "distanceKm": 2.3,
    "socketType": "Type-2 AC (7.4 kW)",
    "vehicleSupport": [
      "4-Wheeler (Car)"
    ],
    "powerKw": 7.4,
    "pricePerHour": 55,
    "pricePerUnit": 15,
    "parkingType": "Heritage City Villa Port",
    "amenities": [
      "Solar Powered",
      "Wi-Fi",
      "Garden Area"
    ],
    "availableDays": "All Days",
    "availableHours": "07:30 AM - 09:30 PM",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-vzg-01",
    "hostName": "C. H. Venkat",
    "hostPhone": "+91 98480 33445",
    "hostRating": 4.8,
    "verifiedHost": true,
    "address": "Sector 8, MVP Colony, Visakhapatnam",
    "city": "Visakhapatnam",
    "mapX": 66,
    "mapY": 66,
    "distanceKm": 2.5,
    "socketType": "Type-2 AC (7.4 kW)",
    "vehicleSupport": [
      "4-Wheeler (Car)"
    ],
    "powerKw": 7.4,
    "pricePerHour": 60,
    "pricePerUnit": 16,
    "parkingType": "Port City Gated Stilt",
    "amenities": [
      "Sea View Nearby",
      "CCTV",
      "Water"
    ],
    "availableDays": "All Days",
    "availableHours": "08:00 AM - 10:00 PM",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-pat-01",
    "hostName": "Rakesh Kumar",
    "hostPhone": "+91 94310 99881",
    "hostRating": 4.7,
    "verifiedHost": true,
    "address": "Sri Krishna Nagar, Near Kidwaipuri, Boring Road, Patna",
    "city": "Patna",
    "mapX": 68,
    "mapY": 36,
    "distanceKm": 3.1,
    "socketType": "Type-2 AC (7.4 kW)",
    "vehicleSupport": [
      "4-Wheeler (Car)"
    ],
    "powerKw": 7.4,
    "pricePerHour": 55,
    "pricePerUnit": 15,
    "parkingType": "Dedicated Gate Porch",
    "amenities": [
      "CCTV Secured",
      "Drinking Water"
    ],
    "availableDays": "All Days",
    "availableHours": "08:00 AM - 09:30 PM",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-rnc-01",
    "hostName": "Sanjay Soren",
    "hostPhone": "+91 94311 55662",
    "hostRating": 4.8,
    "verifiedHost": true,
    "address": "Kanke Road, Near CM Residence, Ranchi",
    "city": "Ranchi",
    "mapX": 71,
    "mapY": 41,
    "distanceKm": 2.2,
    "socketType": "Type-2 AC (7.4 kW)",
    "vehicleSupport": [
      "4-Wheeler (Car)"
    ],
    "powerKw": 7.4,
    "pricePerHour": 55,
    "pricePerUnit": 15,
    "parkingType": "Private Residential Compound",
    "amenities": [
      "Clean Green Zone",
      "Wi-Fi",
      "CCTV"
    ],
    "availableDays": "All Days",
    "availableHours": "08:00 AM - 09:00 PM",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-bbi-01",
    "hostName": "Soumya Ranjan Mohanty",
    "hostPhone": "+91 94370 88991",
    "hostRating": 4.9,
    "verifiedHost": true,
    "address": "Infocity Road, Patia, Near KIIT, Bhubaneswar",
    "city": "Bhubaneswar",
    "mapX": 72,
    "mapY": 53,
    "distanceKm": 1.9,
    "socketType": "Type-2 AC (7.4 kW)",
    "vehicleSupport": [
      "4-Wheeler (Car)"
    ],
    "powerKw": 7.4,
    "pricePerHour": 55,
    "pricePerUnit": 15,
    "parkingType": "Smart City Dedicated Car Port",
    "amenities": [
      "Solar Powered",
      "Wi-Fi",
      "CCTV"
    ],
    "availableDays": "All Days",
    "availableHours": "08:00 AM - 10:00 PM",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80"
  },
  {
    "id": "ch-guw-01",
    "hostName": "Bhaskar Barua",
    "hostPhone": "+91 94350 33441",
    "hostRating": 4.8,
    "verifiedHost": true,
    "address": "Bora Service, GS Road, Christian Basti, Guwahati",
    "city": "Guwahati",
    "mapX": 88,
    "mapY": 32,
    "distanceKm": 2.3,
    "socketType": "Type-2 AC (7.4 kW)",
    "vehicleSupport": [
      "4-Wheeler (Car)"
    ],
    "powerKw": 7.4,
    "pricePerHour": 60,
    "pricePerUnit": 16,
    "parkingType": "Covered Private Compound",
    "amenities": [
      "Tea Garden View Lounge",
      "Wi-Fi",
      "Water"
    ],
    "availableDays": "All Days",
    "availableHours": "07:30 AM - 09:30 PM",
    "bookedSlots": [],
    "image": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80"
  }
];

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@evshare.in').toLowerCase().trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@EVShare2026!';

// Password Hashing Security Helpers (PBKDF2 SHA-512)
function hashPassword(password, salt) {
  if (!salt) salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, hash) {
  if (!password || !salt || !hash) return false;
  const verify = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return verify === hash;
}

function sanitizeUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName || '',
    name: u.name || `${u.firstName} ${u.lastName || ''}`.trim(),
    email: u.email,
    city: u.city,
    phone: u.phone,
    role: u.role,
    businessName: u.businessName || null,
    address: u.address || null,
    status: u.status || 'Active',
    registeredAt: u.registeredAt
  };
}

// In-Memory Token Sessions Store
const authSessions = new Map();

let bookingsData = [];

let problemReportsData = [
  {
    id: "RPT-9841",
    targetCharger: "Indirapuram, Ghaziabad",
    reporter: "Siddharth Verma",
    category: "Charger Damaged / Broken",
    description: "Socket lock mechanism was slightly loose but functional.",
    date: "14 Sep 2026",
    status: "Resolved"
  },
  {
    id: "RPT-9842",
    targetCharger: "Koramangala 4th Block, Bengaluru",
    reporter: "Vikram Singh",
    category: "Blocked Parking Space",
    description: "A vehicle was parked blocking the charger driveway for 15 mins.",
    date: "15 Sep 2026",
    status: "Under Review"
  }
];

// Single Predefined Website Owner Admin seeded with hashed password
const adminPassRecord = hashPassword(ADMIN_PASSWORD);
let usersData = [
  {
    id: "usr-admin-01",
    firstName: "EV-Share",
    lastName: "Administrator",
    name: "EV-Share Administrator",
    email: ADMIN_EMAIL,
    city: "Delhi-NCR",
    phone: "9999999999",
    role: "admin",
    salt: adminPassRecord.salt,
    hash: adminPassRecord.hash,
    status: "Active",
    registeredAt: "2026-01-01T00:00:00.000Z"
  }
];

function getAuthUser(req) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  return authSessions.get(token) || null;
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Helper to parse JSON body
  const parseJsonBody = (callback) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        callback(null, payload);
      } catch (err) {
        callback(err, null);
      }
    });
  };

  // API: GET /api/chargers
  if (pathname === '/api/chargers' && method === 'GET') {
    const { city, socketType, connector, speed, hostId } = parsedUrl.query;
    let result = chargersData;
    if (hostId) {
      result = result.filter(c => c.hostId === hostId || c.hostPhone === hostId);
    }
    if (city && city !== 'All India (Pan-India Grid)') {
      result = result.filter(c => c.city && c.city.toLowerCase() === city.toLowerCase());
    }
    if (socketType && socketType !== 'all') {
      result = result.filter(c => c.socketType && c.socketType.toLowerCase().includes(socketType.toLowerCase()));
    }
    if (connector && connector !== 'all') {
      result = result.filter(c => c.socketType && c.socketType.toLowerCase().includes(connector.toLowerCase()));
    }
    return sendJson(res, 200, { success: true, count: result.length, data: result });
  }

  // API: GET /api/host/chargers (Chargers owned by authenticated host)
  if (pathname === '/api/host/chargers' && method === 'GET') {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return sendJson(res, 401, { success: false, message: 'Authentication required.' });
    }
    const hostChargers = chargersData.filter(c => 
      c.hostId === authUser.id || 
      (c.hostPhone && authUser.phone && c.hostPhone.replace(/\D/g, '').slice(-10) === authUser.phone.replace(/\D/g, '').slice(-10)) ||
      (c.hostName && authUser.name && c.hostName.toLowerCase() === authUser.name.toLowerCase())
    );
    return sendJson(res, 200, { success: true, count: hostChargers.length, chargers: hostChargers });
  }

  // API: POST /api/chargers (Create new charger by host)
  if (pathname === '/api/chargers' && method === 'POST') {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return sendJson(res, 401, { success: false, message: 'Authentication required. Please sign in.' });
    }
    if (authUser.role !== 'charger_host' && authUser.role !== 'host' && authUser.role !== 'admin') {
      return sendJson(res, 403, { success: false, message: 'Only registered Charger Hosts can list chargers.' });
    }

    parseJsonBody((err, payload) => {
      if (err) return sendJson(res, 400, { success: false, message: 'Invalid JSON payload' });
      const { 
        name,
        hostName, 
        hostPhone, 
        address, 
        city, 
        pincode,
        socketType, 
        connectors,
        powerKw, 
        pricePerHour, 
        pricePerUnit, 
        pricePerKwh,
        parkingType, 
        amenities, 
        availableDays, 
        availableHours, 
        openTime, 
        closeTime, 
        image 
      } = payload;

      const resolvedSocket = socketType || (connectors && connectors.length ? `${connectors.join(', ')} (${powerKw || 7.4} kW)` : 'Type-2 AC (7.4 kW)');
      const resolvedPower = parseFloat(powerKw) || (resolvedSocket.includes('15A') ? 3.3 : resolvedSocket.includes('11 kW') ? 11 : 7.4);
      const resolvedPrice = Number(pricePerHour) || 60;
      const resolvedUnit = Number(pricePerUnit || pricePerKwh) || Math.round(resolvedPrice / 3.5);

      const newCharger = {
        id: 'ch-' + Date.now(),
        hostId: authUser.id,
        hostName: hostName || authUser.name || 'Verified Host',
        hostPhone: hostPhone || (authUser.phone ? `+91 ${authUser.phone}` : '+91 99999 99999'),
        hostRating: 5.0,
        verifiedHost: true,
        address: address ? (pincode ? `${address} - ${pincode}` : address) : 'Residential Charging Point',
        city: city || authUser.city || 'Delhi-NCR',
        socketType: resolvedSocket,
        powerKw: resolvedPower,
        pricePerHour: resolvedPrice,
        pricePerUnit: resolvedUnit,
        parkingType: parkingType || 'Residential Dedicated Bay',
        amenities: Array.isArray(amenities) && amenities.length ? amenities : ['CCTV', 'Drinking Water', 'Wi-Fi'],
        availableDays: availableDays || 'All Days',
        availableHours: availableHours || (openTime && closeTime ? `${openTime} - ${closeTime}` : '08:00 AM - 09:00 PM'),
        vehicleSupport: resolvedSocket.includes('15A') ? ['2-Wheeler (Scooter)', '2-Wheeler (Bike)', '3-Wheeler (Commercial)'] : ['4-Wheeler (Car)'],
        status: 'Available',
        bookedSlots: [],
        image: image || 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString()
      };

      chargersData.unshift(newCharger);
      return sendJson(res, 201, { success: true, message: 'Charger listed successfully!', data: newCharger });
    });
    return;
  }

  // API: PUT /api/chargers/:id (Edit charger)
  if (pathname.startsWith('/api/chargers/') && method === 'PUT') {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return sendJson(res, 401, { success: false, message: 'Authentication required.' });
    }

    const chargerId = pathname.replace('/api/chargers/', '').trim();
    const charger = chargersData.find(c => c.id === chargerId);
    if (!charger) {
      return sendJson(res, 404, { success: false, message: 'Charger not found.' });
    }

    // Authorization check: Must be owner or admin
    const isOwner = charger.hostId === authUser.id || 
                    (charger.hostPhone && authUser.phone && charger.hostPhone.replace(/\D/g, '').slice(-10) === authUser.phone.replace(/\D/g, '').slice(-10)) ||
                    (authUser.role === 'admin' && authUser.email.toLowerCase() === ADMIN_EMAIL);
    if (!isOwner) {
      return sendJson(res, 403, { success: false, message: 'Forbidden: You do not have permission to modify this charger.' });
    }

    parseJsonBody((err, payload) => {
      if (err) return sendJson(res, 400, { success: false, message: 'Invalid JSON payload' });
      if (payload.pricePerHour !== undefined) charger.pricePerHour = Number(payload.pricePerHour);
      if (payload.pricePerUnit !== undefined) charger.pricePerUnit = Number(payload.pricePerUnit);
      if (payload.status !== undefined) charger.status = payload.status;
      if (payload.address !== undefined) charger.address = payload.address;
      if (payload.city !== undefined) charger.city = payload.city;
      if (payload.socketType !== undefined) charger.socketType = payload.socketType;
      if (payload.powerKw !== undefined) charger.powerKw = Number(payload.powerKw);
      if (payload.amenities !== undefined) charger.amenities = payload.amenities;
      if (payload.availableHours !== undefined) charger.availableHours = payload.availableHours;
      if (payload.availableDays !== undefined) charger.availableDays = payload.availableDays;
      if (payload.bookedSlots !== undefined) charger.bookedSlots = payload.bookedSlots;

      return sendJson(res, 200, { success: true, message: 'Charger updated successfully.', data: charger });
    });
    return;
  }

  // API: DELETE /api/chargers/:id (Delete charger)
  if (pathname.startsWith('/api/chargers/') && method === 'DELETE') {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return sendJson(res, 401, { success: false, message: 'Authentication required.' });
    }

    const chargerId = pathname.replace('/api/chargers/', '').trim();
    const index = chargersData.findIndex(c => c.id === chargerId);
    if (index === -1) {
      return sendJson(res, 404, { success: false, message: 'Charger not found.' });
    }

    const charger = chargersData[index];
    const isOwner = charger.hostId === authUser.id || 
                    (charger.hostPhone && authUser.phone && charger.hostPhone.replace(/\D/g, '').slice(-10) === authUser.phone.replace(/\D/g, '').slice(-10)) ||
                    (authUser.role === 'admin' && authUser.email.toLowerCase() === ADMIN_EMAIL);
    if (!isOwner) {
      return sendJson(res, 403, { success: false, message: 'Forbidden: You do not have permission to delete this charger.' });
    }

    chargersData.splice(index, 1);
    return sendJson(res, 200, { success: true, message: 'Charger deleted successfully.' });
  }

  // API: POST /api/bookings
  if (pathname === '/api/bookings' && method === 'POST') {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return sendJson(res, 401, { success: false, message: 'Please log in to book a charging station.' });
    }

    parseJsonBody((err, payload) => {
      if (err) return sendJson(res, 400, { success: false, message: 'Invalid JSON payload' });
      const { chargerId, date, timeSlot, hours = 2, paymentMethod, vehicleModel, vehicleNumber } = payload;
      const charger = chargersData.find(c => c.id === chargerId);
      
      if (!charger) {
        return sendJson(res, 404, { success: false, message: 'Charger not found' });
      }

      if (charger.bookedSlots && charger.bookedSlots.includes(timeSlot)) {
        return sendJson(res, 409, { success: false, message: 'This slot is already booked! Please select another time slot.' });
      }

      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const bookingReference = 'EVS-2026-' + Math.floor(10000 + Math.random() * 90000);
      
      if (!charger.bookedSlots) charger.bookedSlots = [];
      charger.bookedSlots.push(timeSlot);

      const chargingCost = charger.pricePerHour * Number(hours);
      const platformFee = 10.00;
      const taxes = parseFloat((chargingCost * 0.18).toFixed(2));
      const totalAmount = parseFloat((chargingCost + platformFee + taxes).toFixed(2));
      const energyEst = parseFloat((charger.powerKw * Number(hours) * 0.92).toFixed(1));

      const booking = {
        id: bookingReference,
        bookingReference,
        userId: authUser.id,
        userName: authUser.name || `${authUser.firstName} ${authUser.lastName}`.trim(),
        userPhone: authUser.phone ? `+91 ${authUser.phone}` : '',
        vehicle: vehicleModel ? `${vehicleModel} ${vehicleNumber ? `(${vehicleNumber})` : ''}` : 'Electric Vehicle',
        chargerId,
        chargerHostId: charger.hostId,
        chargerHostPhone: charger.hostPhone,
        chargerName: `${charger.address} (${charger.hostName})`,
        hostName: charger.hostName,
        hostPhone: charger.hostPhone,
        chargerAddress: charger.address,
        socketType: charger.socketType,
        city: charger.city,
        date: date || 'Today',
        timeSlot,
        hours: Number(hours),
        chargingCost,
        platformFee,
        taxes,
        totalAmount,
        amountPaid: totalAmount,
        earnings: chargingCost,
        energyDelivered: energyEst,
        paymentMethod: paymentMethod || 'UPI (Google Pay)',
        otp,
        status: 'Confirmed',
        createdAt: new Date().toISOString()
      };

      bookingsData.unshift(booking);
      return sendJson(res, 201, { success: true, message: 'Booking confirmed successfully!', data: booking });
    });
    return;
  }

  // API: GET /api/my-bookings (Driver Bookings)
  if (pathname === '/api/my-bookings' && method === 'GET') {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return sendJson(res, 401, { success: false, message: 'Authentication required.' });
    }
    const cleanUserPhone = authUser.phone ? authUser.phone.replace(/\D/g, '').slice(-10) : '';
    const userBookings = bookingsData.filter(b => 
      b.userId === authUser.id || 
      (b.userPhone && cleanUserPhone && b.userPhone.replace(/\D/g, '').slice(-10) === cleanUserPhone)
    );
    return sendJson(res, 200, { success: true, count: userBookings.length, bookings: userBookings });
  }

  // API: GET /api/host/bookings (Host incoming Bookings)
  if (pathname === '/api/host/bookings' && method === 'GET') {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return sendJson(res, 401, { success: false, message: 'Authentication required.' });
    }
    const cleanHostPhone = authUser.phone ? authUser.phone.replace(/\D/g, '').slice(-10) : '';
    const incomingBookings = bookingsData.filter(b => 
      b.chargerHostId === authUser.id ||
      (b.chargerHostPhone && cleanHostPhone && b.chargerHostPhone.replace(/\D/g, '').slice(-10) === cleanHostPhone) ||
      (b.hostName && authUser.name && b.hostName.toLowerCase() === authUser.name.toLowerCase())
    );
    return sendJson(res, 200, { success: true, count: incomingBookings.length, bookings: incomingBookings });
  }

  // API: POST /api/bookings/:id/cancel
  if (pathname.startsWith('/api/bookings/') && pathname.endsWith('/cancel') && method === 'POST') {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return sendJson(res, 401, { success: false, message: 'Authentication required.' });
    }

    const bookingId = pathname.replace('/api/bookings/', '').replace('/cancel', '').trim();
    const booking = bookingsData.find(b => b.id === bookingId || b.bookingReference === bookingId);
    if (!booking) {
      return sendJson(res, 404, { success: false, message: 'Booking not found.' });
    }

    const isAuthorized = booking.userId === authUser.id || 
                         booking.chargerHostId === authUser.id ||
                         (authUser.role === 'admin' && authUser.email.toLowerCase() === ADMIN_EMAIL);
    if (!isAuthorized) {
      return sendJson(res, 403, { success: false, message: 'Forbidden: You cannot cancel this booking.' });
    }

    booking.status = 'Cancelled';

    // Release slot from charger
    const charger = chargersData.find(c => c.id === booking.chargerId);
    if (charger && Array.isArray(charger.bookedSlots)) {
      charger.bookedSlots = charger.bookedSlots.filter(s => s !== booking.timeSlot);
    }

    return sendJson(res, 200, { success: true, message: 'Booking cancelled successfully.', booking });
  }

  // API: POST /api/check-user (Checks whether mobile number is registered)
  if (pathname === '/api/check-user' && method === 'POST') {
    parseJsonBody((err, payload) => {
      if (err) return sendJson(res, 400, { success: false, message: 'Invalid JSON payload' });
      const cleanPhone = (payload.phone || '').toString().replace(/\D/g, '').slice(-10);
      const user = usersData.find(u => u.phone.replace(/\D/g, '').slice(-10) === cleanPhone);

      if (user) {
        return sendJson(res, 200, {
          success: true,
          registered: true,
          user: sanitizeUser(user)
        });
      } else {
        return sendJson(res, 200, {
          success: true,
          registered: false,
          message: 'User is not registered. Please create an account.'
        });
      }
    });
    return;
  }

  // API: POST /api/send-otp
  if (pathname === '/api/send-otp' && method === 'POST') {
    parseJsonBody((err, payload) => {
      if (err) return sendJson(res, 400, { success: false, message: 'Invalid JSON payload' });
      const { phone } = payload;
      const cleanPhone = (phone || '').toString().replace(/\D/g, '').slice(-10);

      if (cleanPhone.length !== 10) {
        return sendJson(res, 400, { success: false, message: 'Please enter a valid 10-digit mobile number.' });
      }

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      otpsData.set(cleanPhone, {
        code: otpCode,
        expiresAt: Date.now() + 5 * 60 * 1000
      });

      sendRealSms(cleanPhone, otpCode, (err, delivered, gatewayRes) => {
        return sendJson(res, 200, {
          success: true,
          message: delivered
            ? `OTP sent successfully to +91 ${cleanPhone} via SMS!`
            : `Fast2SMS verification pending. Test OTP: ${otpCode}`,
          phone: cleanPhone,
          delivered: delivered,
          testOtp: otpCode,
          gatewayError: !delivered && gatewayRes ? gatewayRes.message : null,
          expiresInSeconds: 300
        });
      });
    });
    return;
  }

  // API: POST /api/verify-otp
  if (pathname === '/api/verify-otp' && method === 'POST') {
    parseJsonBody((err, payload) => {
      if (err) return sendJson(res, 400, { success: false, message: 'Invalid JSON payload' });
      const { phone, code } = payload;
      const cleanPhone = (phone || '').toString().replace(/\D/g, '').slice(-10);
      const enteredCode = (code || '').toString().trim();

      const record = otpsData.get(cleanPhone);
      if (!record) {
        return sendJson(res, 400, { success: false, message: 'No OTP found or expired. Please click "Request code" first.' });
      }

      if (Date.now() > record.expiresAt) {
        otpsData.delete(cleanPhone);
        return sendJson(res, 400, { success: false, message: 'OTP has expired! Please request a new code.' });
      }

      if (record.code !== enteredCode) {
        return sendJson(res, 400, { success: false, message: 'Incorrect OTP code! Please enter the code received on your phone.' });
      }

      otpsData.delete(cleanPhone);
      return sendJson(res, 200, { success: true, message: 'Mobile number verified successfully!' });
    });
    return;
  }

  // =========================================================================
  // SECURE AUTHENTICATION SYSTEM (Registration, Hashed Password Login, Sessions)
  // =========================================================================

  // API: POST /api/login
  if (pathname === '/api/login' && method === 'POST') {
    parseJsonBody((err, payload) => {
      if (err) return sendJson(res, 400, { success: false, message: 'Invalid JSON payload' });
      const identifier = (payload.email || payload.loginInput || payload.phone || '').toString().trim().toLowerCase();
      const password = (payload.password || '').toString();

      if (!identifier || !password) {
        return sendJson(res, 400, { 
          success: false, 
          message: 'Please provide both your email/phone and password.' 
        });
      }

      // Check against usersData (email or 10-digit mobile)
      const cleanPhone = identifier.replace(/\D/g, '').slice(-10);
      const user = usersData.find(u => 
        u.email.toLowerCase() === identifier || 
        (cleanPhone.length === 10 && u.phone.replace(/\D/g, '').slice(-10) === cleanPhone)
      );

      if (!user) {
        return sendJson(res, 401, { 
          success: false, 
          message: 'Invalid email or password. Please check your credentials or create an account.' 
        });
      }

      if (user.status === 'Suspended') {
        return sendJson(res, 403, { 
          success: false, 
          message: 'Your account has been suspended by platform administration. Please contact support.' 
        });
      }

      // Verify hashed password
      const isPasswordValid = verifyPassword(password, user.salt, user.hash);
      if (!isPasswordValid) {
        return sendJson(res, 401, { 
          success: false, 
          message: 'Invalid email or password. Please check your credentials or create an account.' 
        });
      }

      // Strict role enforcement: Only predefined owner can possess admin role
      const userRole = (user.email.toLowerCase() === ADMIN_EMAIL) ? 'admin' : (user.role === 'admin' ? 'driver' : user.role);

      const sessionToken = (userRole === 'admin' ? 'evs_adm_' : 'evs_usr_') + crypto.randomBytes(16).toString('hex') + Date.now().toString(36);
      const authenticatedUser = { ...user, role: userRole };
      authSessions.set(sessionToken, authenticatedUser);

      return sendJson(res, 200, {
        success: true,
        message: 'Login successful.',
        token: sessionToken,
        user: sanitizeUser(authenticatedUser)
      });
    });
    return;
  }

  // API: GET /api/me (Current Authenticated User Session)
  if (pathname === '/api/me' && method === 'GET') {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return sendJson(res, 401, { success: false, message: 'Unauthenticated session.' });
    }
    return sendJson(res, 200, {
      success: true,
      user: sanitizeUser(authUser)
    });
  }

  // API: POST /api/logout
  if (pathname === '/api/logout' && method === 'POST') {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (token) {
      authSessions.delete(token);
    }
    return sendJson(res, 200, { success: true, message: 'Logged out successfully.' });
  }

  // API: POST /api/forgot-password
  if (pathname === '/api/forgot-password' && method === 'POST') {
    parseJsonBody((err, payload) => {
      if (err) return sendJson(res, 400, { success: false, message: 'Invalid JSON payload' });
      const identifier = (payload.email || payload.phone || '').toString().trim().toLowerCase();
      if (!identifier) {
        return sendJson(res, 400, { success: false, message: 'Please provide your registered email or phone number.' });
      }
      return sendJson(res, 200, {
        success: true,
        message: 'If an account exists with this identifier, a password reset instruction has been dispatched.'
      });
    });
    return;
  }

  // API: POST /api/register (Driver or Charger Host Registration ONLY)
  if (pathname === '/api/register' && method === 'POST') {
    parseJsonBody((err, payload) => {
      if (err) return sendJson(res, 400, { success: false, message: 'Invalid JSON payload' });
      const fName = payload.firstName || (payload.fullName ? payload.fullName.split(' ')[0] : '');
      const lName = payload.lastName || (payload.fullName ? payload.fullName.split(' ').slice(1).join(' ') : '');
      const { email, city, phone, role, password, confirmPassword, businessName, address } = payload;
      const firstName = fName;
      const lastName = lName;

      if (!firstName || !email || !phone) {
        return sendJson(res, 400, { success: false, message: 'Please provide your full name, email address, and mobile number.' });
      }

      if (!password || password.length < 6) {
        return sendJson(res, 400, { success: false, message: 'Password must be at least 6 characters long.' });
      }

      if (confirmPassword && password !== confirmPassword) {
        return sendJson(res, 400, { success: false, message: 'Passwords do not match. Please re-enter your password.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return sendJson(res, 400, { success: false, message: 'Please enter a valid email address.' });
      }

      // STRICT PROTECTION 1: Prevent registering with the website owner Admin email
      if (cleanEmail === ADMIN_EMAIL) {
        return sendJson(res, 403, { 
          success: false, 
          message: 'The website owner admin identity is protected and cannot be registered publicly.' 
        });
      }

      // STRICT PROTECTION 2: Force role to only be 'driver' or 'charger_host'. Reject/Strip any attempt to assign 'admin'.
      let safeRole = 'driver';
      if (role === 'charger_host' || role === 'host' || role === 'owner') {
        safeRole = 'charger_host';
      }

      const cleanPhone = phone.toString().replace(/\D/g, '').slice(-10);
      if (cleanPhone.length !== 10) {
        return sendJson(res, 400, { success: false, message: 'Please enter a valid 10-digit mobile number.' });
      }

      const existing = usersData.find(u => 
        u.email.toLowerCase() === cleanEmail || 
        u.phone.replace(/\D/g, '').slice(-10) === cleanPhone
      );

      if (existing) {
        return sendJson(res, 409, { success: false, message: 'An account with this email address or mobile number already exists.' });
      }

      // Securely hash user password
      const passHash = hashPassword(password);

      const newUser = {
        id: 'usr-' + Date.now(),
        firstName: firstName.trim(),
        lastName: (lastName || '').trim(),
        name: `${firstName.trim()} ${(lastName || '').trim()}`.trim(),
        businessName: (businessName || '').trim() || null,
        address: (address || '').trim() || null,
        email: cleanEmail,
        city: (city || 'Delhi-NCR').trim(),
        phone: cleanPhone,
        role: safeRole, // Strictly 'driver' or 'charger_host'
        salt: passHash.salt,
        hash: passHash.hash,
        status: 'Active',
        registeredAt: new Date().toISOString()
      };

      usersData.unshift(newUser);

      // Create session for immediate auto-login
      const sessionToken = 'evs_usr_' + crypto.randomBytes(16).toString('hex') + Date.now().toString(36);
      authSessions.set(sessionToken, newUser);

      return sendJson(res, 201, {
        success: true,
        message: 'Account created successfully!',
        token: sessionToken,
        user: sanitizeUser(newUser)
      });
    });
    return;
  }

  // API: PUT /api/profile (Update Profile - Strict Protection against Privilege Escalation)
  if (pathname === '/api/profile' && (method === 'PUT' || method === 'POST')) {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return sendJson(res, 401, { success: false, message: 'Authentication required.' });
    }

    parseJsonBody((err, payload) => {
      if (err) return sendJson(res, 400, { success: false, message: 'Invalid JSON payload' });

      // Find user record in usersData
      const user = usersData.find(u => u.id === authUser.id);
      if (!user) {
        return sendJson(res, 404, { success: false, message: 'User record not found.' });
      }

      // Update editable profile attributes (role is NEVER modified through profile updates)
      if (payload.firstName) user.firstName = payload.firstName.trim();
      if (payload.lastName) user.lastName = payload.lastName.trim();
      if (payload.name) user.name = payload.name.trim();
      if (payload.city) user.city = payload.city.trim();
      if (payload.businessName) user.businessName = payload.businessName.trim();
      if (payload.phone) user.phone = payload.phone.toString().replace(/\D/g, '').slice(-10);

      // Update session record
      const updatedUser = { ...user };
      authSessions.set(req.headers['authorization'].replace(/^Bearer\s+/i, '').trim(), updatedUser);

      return sendJson(res, 200, {
        success: true,
        message: 'Profile updated successfully.',
        user: sanitizeUser(user)
      });
    });
    return;
  }

  // =========================================================================
  // PROTECTED ADMIN APIS (Owner Admin Only — 401 Unauthorized / 403 Forbidden)
  // =========================================================================

  // Helper middleware for admin verification
  const checkAdminAuth = () => {
    const authUser = getAuthUser(req);
    if (!authUser) {
      sendJson(res, 401, { 
        success: false, 
        error: 'Unauthorized',
        message: 'Authentication required. Please log in with the Platform Admin account.' 
      });
      return null;
    }

    if (authUser.role !== 'admin' || authUser.email.toLowerCase() !== ADMIN_EMAIL) {
      sendJson(res, 403, { 
        success: false, 
        error: 'Forbidden',
        message: 'Access Denied: Platform Administrator Access Only. Your account does not have administrative privileges.' 
      });
      return null;
    }

    return authUser;
  };

  // API: GET /api/admin/stats
  if (pathname === '/api/admin/stats' && method === 'GET') {
    if (!checkAdminAuth()) return;
    return sendJson(res, 200, {
      success: true,
      stats: {
        totalUsers: usersData.length,
        totalChargers: chargersData.length,
        totalBookings: bookingsData.length + 128450,
        totalRevenue: '₹1.42 Cr',
        activeChargersCount: chargersData.filter(c => c.status !== 'Offline').length,
        pendingReportsCount: problemReportsData.filter(r => r.status !== 'Resolved').length
      }
    });
  }

  // API: GET /api/admin/users
  if (pathname === '/api/admin/users' && method === 'GET') {
    if (!checkAdminAuth()) return;
    return sendJson(res, 200, {
      success: true,
      count: usersData.length,
      users: usersData.map(u => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`.trim(),
        email: u.email,
        city: u.city,
        phone: u.phone,
        role: u.role,
        status: u.status || 'Active',
        registeredAt: u.registeredAt
      }))
    });
  }

  // API: POST /api/admin/users/toggle
  if (pathname === '/api/admin/users/toggle' && method === 'POST') {
    if (!checkAdminAuth()) return;
    parseJsonBody((err, payload) => {
      if (err) return sendJson(res, 400, { success: false, message: 'Invalid JSON payload' });
      const { userId } = payload;
      const targetUser = usersData.find(u => u.id === userId);
      if (!targetUser) return sendJson(res, 404, { success: false, message: 'User not found.' });

      // Admin account cannot be disabled
      if (targetUser.role === 'admin' || targetUser.email.toLowerCase() === ADMIN_EMAIL) {
        return sendJson(res, 400, { success: false, message: 'The Platform Owner Admin account cannot be suspended.' });
      }

      targetUser.status = targetUser.status === 'Suspended' ? 'Active' : 'Suspended';
      return sendJson(res, 200, { success: true, message: `User status changed to ${targetUser.status}.`, user: targetUser });
    });
    return;
  }

  // API: GET /api/admin/chargers
  if (pathname === '/api/admin/chargers' && method === 'GET') {
    if (!checkAdminAuth()) return;
    return sendJson(res, 200, {
      success: true,
      count: chargersData.length,
      chargers: chargersData
    });
  }

  // API: POST /api/admin/chargers/toggle
  if (pathname === '/api/admin/chargers/toggle' && method === 'POST') {
    if (!checkAdminAuth()) return;
    parseJsonBody((err, payload) => {
      if (err) return sendJson(res, 400, { success: false, message: 'Invalid JSON payload' });
      const { chargerId, action } = payload;
      const targetCharger = chargersData.find(c => c.id === chargerId);
      if (!targetCharger) return sendJson(res, 404, { success: false, message: 'Charger not found.' });

      if (action === 'toggle-verification') {
        targetCharger.verifiedHost = !targetCharger.verifiedHost;
      } else if (action === 'toggle-status') {
        targetCharger.status = targetCharger.status === 'Offline' ? 'Available' : 'Offline';
      }
      return sendJson(res, 200, { success: true, message: 'Station updated successfully.', charger: targetCharger });
    });
    return;
  }

  // API: GET /api/admin/bookings
  if (pathname === '/api/admin/bookings' && method === 'GET') {
    if (!checkAdminAuth()) return;
    return sendJson(res, 200, {
      success: true,
      count: bookingsData.length,
      bookings: bookingsData
    });
  }

  // API: GET /api/admin/reports
  if (pathname === '/api/admin/reports' && method === 'GET') {
    if (!checkAdminAuth()) return;
    return sendJson(res, 200, {
      success: true,
      count: problemReportsData.length,
      reports: problemReportsData
    });
  }

  // API: POST /api/admin/reports/resolve
  if (pathname === '/api/admin/reports/resolve' && method === 'POST') {
    if (!checkAdminAuth()) return;
    parseJsonBody((err, payload) => {
      if (err) return sendJson(res, 400, { success: false, message: 'Invalid JSON payload' });
      const { reportId } = payload;
      const report = problemReportsData.find(r => r.id === reportId);
      if (!report) return sendJson(res, 404, { success: false, message: 'Report not found.' });

      report.status = 'Resolved';
      return sendJson(res, 200, { success: true, message: `Report #${reportId} marked as Resolved.`, report });
    });
    return;
  }

  // API: GET /api/stats (Public platform overview)
  if (pathname === '/api/stats' && method === 'GET') {
    return sendJson(res, 200, {
      totalChargers: chargersData.length,
      citiesCovered: 8,
      activeBookings: bookingsData.length,
      totalPowerSharedKwh: 3480,
      co2SavedKg: 1420
    });
  }

  // Serve static files
  let safePath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.join(__dirname, safePath);
  
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server Error');
      }
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Pan-India EV-Share server running at http://0.0.0.0:${PORT} (Local: http://localhost:${PORT})`);
  console.log(`[AUTH CONFIG] Platform Owner Admin configured: ${ADMIN_EMAIL}`);
});

// Secondary port 3000 listener for convenience
try {
  const server3000 = http.createServer((req, res) => server.emit('request', req, res));
  server3000.listen(3000, '0.0.0.0', () => {
    console.log(`Pan-India EV-Share server also running on http://localhost:3000`);
  }).on('error', (e) => {
    console.log('Port 3000 fallback not needed:', e.message);
  });
} catch (e) {}

