const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

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
    "hostPhone": "+91 98101 23456",
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

let bookingsData = [];

let usersData = [
  {
    id: "usr-01",
    firstName: "Ayush",
    lastName: "Chauhan",
    email: "ayush@evshare.in",
    city: "Delhi-NCR",
    phone: "9810123456",
    role: "driver",
    registeredAt: "2026-09-01T10:00:00.000Z"
  },
  {
    id: "usr-02",
    firstName: "Rajesh",
    lastName: "Sharma",
    email: "rajesh.sharma@gmail.com",
    city: "Bengaluru",
    phone: "9876543210",
    role: "host",
    registeredAt: "2026-09-02T11:30:00.000Z"
  },
  {
    id: "usr-03",
    firstName: "Rohit",
    lastName: "Malhotra",
    email: "rohit.m@gmail.com",
    city: "Delhi-NCR",
    phone: "9818812345",
    role: "host",
    registeredAt: "2026-09-03T14:15:00.000Z"
  },
  {
    id: "usr-04",
    firstName: "Neha",
    lastName: "Gupta",
    email: "neha.gupta@outlook.com",
    city: "Delhi-NCR",
    phone: "9818899001",
    role: "host",
    registeredAt: "2026-09-04T09:20:00.000Z"
  },
  {
    id: "usr-05",
    firstName: "Vikramaditya",
    lastName: "Singh",
    email: "vikram.singh@yahoo.com",
    city: "Delhi-NCR",
    phone: "9871155443",
    role: "host",
    registeredAt: "2026-09-05T16:45:00.000Z"
  }
];

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API: GET /api/chargers
  if (pathname === '/api/chargers' && method === 'GET') {
    const { city, socketType } = parsedUrl.query;
    let result = chargersData;
    if (city && city !== 'All India (Pan-India Grid)') {
      result = result.filter(c => c.city.toLowerCase() === city.toLowerCase());
    }
    if (socketType && socketType !== 'all') {
      result = result.filter(c => c.socketType.toLowerCase().includes(socketType.toLowerCase()));
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, count: result.length, data: result }));
    return;
  }

  // API: POST /api/chargers
  if (pathname === '/api/chargers' && method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { hostName, hostPhone, address, city, socketType, pricePerHour } = payload;
        const newCharger = {
          id: 'ch-' + Date.now(),
          hostName: hostName || 'Verified Host',
          hostPhone: hostPhone || '+91 98101 23456',
          hostRating: 5.0,
          verifiedHost: true,
          address: address || 'Residential Port',
          city: city || 'Delhi-NCR',
          socketType: socketType || 'Type-2 AC (7.4 kW)',
          powerKw: socketType && socketType.includes('15A') ? 3.3 : 7.4,
          pricePerHour: Number(pricePerHour) || 60,
          pricePerUnit: Math.round((Number(pricePerHour) || 60) / 3.5),
          parkingType: 'Residential Dedicated Bay',
          amenities: ['CCTV', 'Drinking Water', 'Wi-Fi'],
          availableDays: 'All Days',
          availableHours: '08:00 AM - 09:00 PM',
          bookedSlots: []
        };
        chargersData.unshift(newCharger);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: newCharger }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid payload' }));
      }
    });
    return;
  }

  // API: POST /api/bookings
  if (pathname === '/api/bookings' && method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { chargerId, date, timeSlot, hours = 2 } = payload;
        const charger = chargersData.find(c => c.id === chargerId);
        
        if (!charger) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Charger not found' }));
          return;
        }

        if (charger.bookedSlots.includes(timeSlot)) {
          res.writeHead(409, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Slot already booked!' }));
          return;
        }

        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const bookingReference = 'EVB-' + Math.floor(1000 + Math.random() * 9000);
        charger.bookedSlots.push(timeSlot);

        const booking = {
          bookingReference,
          chargerId,
          chargerAddress: charger.address,
          city: charger.city,
          date,
          timeSlot,
          totalAmount: (charger.pricePerHour * hours) + 15,
          otp,
          status: 'Confirmed',
          createdAt: new Date().toISOString()
        };

        bookingsData.push(booking);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: booking }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // API: POST /api/check-user (Checks whether mobile number is registered)
  if (pathname === '/api/check-user' && method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const cleanPhone = (payload.phone || '').toString().replace(/\D/g, '').slice(-10);
        const user = usersData.find(u => u.phone.replace(/\D/g, '').slice(-10) === cleanPhone);

        if (user) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            registered: true,
            user: {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              name: `${user.firstName} ${user.lastName}`.trim(),
              email: user.email,
              city: user.city,
              phone: user.phone,
              role: user.role
            }
          }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            registered: false,
            message: 'User is not registered. Please create an account.'
          }));
        }
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // API: POST /api/send-otp (Generate & Dispatch OTP to Mobile)
  if (pathname === '/api/send-otp' && method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { phone } = payload;
        const cleanPhone = (phone || '').toString().replace(/\D/g, '').slice(-10);

        if (cleanPhone.length !== 10) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Please enter a valid 10-digit mobile number.' }));
          return;
        }

        // Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        otpsData.set(cleanPhone, {
          code: otpCode,
          expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes validity
        });

        sendRealSms(cleanPhone, otpCode, (err, delivered, gatewayRes) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: delivered
              ? `OTP sent successfully to +91 ${cleanPhone} via SMS!`
              : `Fast2SMS verification pending. Test OTP: ${otpCode}`,
            phone: cleanPhone,
            delivered: delivered,
            testOtp: otpCode,
            gatewayError: !delivered && gatewayRes ? gatewayRes.message : null,
            expiresInSeconds: 300
          }));
        });
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // API: POST /api/verify-otp (Verify Mobile OTP)
  if (pathname === '/api/verify-otp' && method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { phone, code } = payload;
        const cleanPhone = (phone || '').toString().replace(/\D/g, '').slice(-10);
        const enteredCode = (code || '').toString().trim();

        const record = otpsData.get(cleanPhone);
        if (!record) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'No OTP found or expired. Please click "Request code" first.' }));
          return;
        }

        if (Date.now() > record.expiresAt) {
          otpsData.delete(cleanPhone);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'OTP has expired! Please request a new code.' }));
          return;
        }

        if (record.code !== enteredCode) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Incorrect OTP code! Please enter the code received on your phone.' }));
          return;
        }

        // OTP Verified successfully!
        otpsData.delete(cleanPhone);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Mobile number verified successfully!' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // API: POST /api/register (Register new account)
  if (pathname === '/api/register' && method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { firstName, lastName, email, city, phone, role = 'driver' } = payload;

        if (!firstName || !email || !city || !phone) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Missing required fields (First name, email, city, mobile).' }));
          return;
        }

        const cleanPhone = phone.toString().replace(/\D/g, '').slice(-10);
        const existing = usersData.find(u => u.phone.replace(/\D/g, '').slice(-10) === cleanPhone);
        if (existing) {
          res.writeHead(409, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'User with this mobile number already exists!' }));
          return;
        }

        const newUser = {
          id: 'usr-' + Date.now(),
          firstName: firstName.trim(),
          lastName: (lastName || '').trim(),
          email: email.trim().toLowerCase(),
          city: city.trim(),
          phone: cleanPhone,
          role: role || 'driver',
          registeredAt: new Date().toISOString()
        };

        usersData.unshift(newUser);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Account created successfully!',
          user: {
            id: newUser.id,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            name: `${newUser.firstName} ${newUser.lastName}`.trim(),
            email: newUser.email,
            city: newUser.city,
            phone: newUser.phone,
            role: newUser.role
          }
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // API: GET /api/users
  if (pathname === '/api/users' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      count: usersData.length,
      data: usersData.map(u => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`.trim(),
        email: u.email,
        city: u.city,
        phone: u.phone,
        role: u.role,
        registeredAt: u.registeredAt
      }))
    }));
    return;
  }

  // API: GET /api/stats
  if (pathname === '/api/stats' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      totalChargers: chargersData.length,
      citiesCovered: 8,
      activeBookings: bookingsData.length,
      totalPowerSharedKwh: 3480,
      co2SavedKg: 1420
    }));
    return;
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
});
