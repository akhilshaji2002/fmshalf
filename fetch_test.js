const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/trainers',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('STATUS:', res.statusCode);
        console.log('BODY:', JSON.parse(body).filter(t => t.email === 'api_coach@test.com')[0]);
    });
});

req.on('error', (e) => console.error(e));
req.end();
