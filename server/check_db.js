const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const users = await mongoose.connection.db.collection('users').find({}).toArray();
        console.log('\n--- Registered Users ---');
        console.table(users.map(u => ({
            name: u.name,
            email: u.email,
            role: u.role,
            mobile: u.mobileNumber
        })));

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
};

checkData();
