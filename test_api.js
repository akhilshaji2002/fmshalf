const http = require('http');

const data = JSON.stringify({
    name: "Test Coach API",
    email: "api_coach@test.com",
    password: "password123",
    role: "trainer",
    profilePic: "https://api.dicebear.com/7.x/avataaars/svg?seed=test",
    nationalId: { idType: "aadhar", idNumber: "9999-8888-7777" },
    experience: "10",
    specializations: ["Bodybuilding", "Cardio"],
    bio: "Top tier coach for testing."
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('STATUS:', res.statusCode);
        console.log('BODY:', body);
    });
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
