const http = require('http');

async function runTests() {
    try {
        console.log('--- Logging In as Admin ---');
        const loginData = JSON.stringify({ email: 'admin@fms.com', password: 'password123' });
        const loginRes = await request({
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, loginData);

        const token = loginRes.body.token;

        console.log('--- Fetching Products ---');
        const fetchRes = await request({
            hostname: 'localhost',
            port: 5000,
            path: '/api/inventory',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const product = fetchRes.body[0];
        if (!product) {
            console.log('No products found to test update.');
            return;
        }

        console.log('Updating Product:', product.name);
        const updateData = JSON.stringify({
            name: product.name + " (Updated)",
            image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500"
        });

        const updateRes = await request({
            hostname: 'localhost',
            port: 5000,
            path: `/api/inventory/${product._id}`,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        }, updateData);

        console.log('Update Status:', updateRes.statusCode);
        console.log('Update Body:', updateRes.body);

        if (updateRes.statusCode === 200 && updateRes.body.image) {
            console.log('SUCCESS: Product updated with image URL.');
        } else {
            console.error('FAIL: Product update failed.');
        }

    } catch (err) {
        console.error('Test Error:', err);
    }
}

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

runTests();
