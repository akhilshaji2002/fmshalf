const http = require('http');

const loginData = JSON.stringify({
    email: "api_coach@test.com",
    password: "password123"
});

function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ body: JSON.parse(body), statusCode: res.statusCode }));
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function runTests() {
    try {
        console.log('--- Logging In ---');
        const loginRes = await request({
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, loginData);

        if (loginRes.statusCode !== 200) {
            console.error('Login Failed:', loginRes.body);
            return;
        }

        const token = loginRes.body.token;
        console.log('Login Success. Token acquired.');

        console.log('\n--- Fetching Trainers (as Trainer) ---');
        const fetchRes = await request({
            hostname: 'localhost',
            port: 5000,
            path: '/api/trainers',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const coach = fetchRes.body.find(t => t.email === 'api_coach@test.com');
        console.log('Coach Data Found:', coach);

        if (coach.nationalId) {
            console.error('FAIL: Trainer can see their own (or others) sensitive nationalId via /api/trainers');
        } else {
            console.log('SUCCESS: nationalId is hidden from trainer role.');
        }

        // Now test as Admin (Assuming we can seed or know admin creds)
        console.log('\n--- Seeding Admin ---');
        await request({
            hostname: 'localhost',
            port: 5000,
            path: '/api/seed',
            method: 'POST'
        });

        console.log('Logging in as Admin...');
        const adminLoginRes = await request({
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, JSON.stringify({ email: 'admin@fms.com', password: 'password123' }));

        const adminToken = adminLoginRes.body.token;

        console.log('\n--- Fetching Trainers (as Admin) ---');
        const adminFetchRes = await request({
            hostname: 'localhost',
            port: 5000,
            path: '/api/trainers',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        const coachForAdmin = adminFetchRes.body.find(t => t.email === 'api_coach@test.com');
        console.log('Coach Data For Admin:', coachForAdmin);

        if (coachForAdmin.nationalId && coachForAdmin.nationalId.idNumber === '9999-8888-7777') {
            console.log('SUCCESS: Admin can see coach nationalId.');
        } else {
            console.error('FAIL: Admin cannot see coach nationalId.');
        }

    } catch (err) {
        console.error('Test Error:', err);
    }
}

runTests();
