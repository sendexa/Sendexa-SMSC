import dotenv from 'dotenv';
dotenv.config();

console.log("SMPP Server is starting on port:", process.env.SMPP_PORT);
