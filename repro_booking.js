async function testBooking() {
    const API_URL = 'http://localhost:5000/api';

    try {
        // 1. Login as Admin to get a token
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@fms.com', password: 'password123' })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;
        const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        };

        // 2. Get Trainers
        const trainersRes = await fetch(`${API_URL}/trainers`, { headers });
        const trainers = await trainersRes.json();
        if (trainers.length === 0) {
            console.log('No trainers found. Please seed data.');
            return;
        }
        const coach = trainers[0];

        // 3. Attempt Booking
        console.log(`Attempting booking with coach: ${coach.name}`);
        const bookingRes = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                coachId: coach._id,
                coachName: coach.name,
                date: new Date(Date.now() + 86400000), // Tomorrow
                trainingType: 'home'
            })
        });

        const bookingData = await bookingRes.json();
        if (bookingRes.ok) {
            console.log('✅ Booking Successful:', bookingData);
        } else {
            console.error('❌ Booking Failed:', bookingData);
        }

        // 4. Check My Bookings
        const myBookingsRes = await fetch(`${API_URL}/bookings`, { headers });
        const myBookings = await myBookingsRes.json();
        console.log('My Bookings Count:', myBookings.length);
        console.log('Last Booking:', myBookings[0]);

    } catch (err) {
        console.error('Error:', err.message);
    }
}

testBooking();
