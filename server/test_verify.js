const startTest = async () => {
    try {
        const baseUrl = 'http://localhost:5000/api';

        // 1. Seed DB (idempotent-ish, checks existence)
        console.log('--- 1. Seeding DB ---');
        const seedRes = await fetch(`${baseUrl}/seed`, { method: 'POST' });
        const seedData = await seedRes.json();
        console.log('Seed Response:', seedData);

        // 2. Login
        console.log('\n--- 2. Logging In ---');
        const loginRes = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@fms.com', password: 'password123' })
        });

        if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.statusText}`);
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Login successful, got token.');

        // 3. Test Calculate Health Metrics
        console.log('\n--- 3. Testing AI Health Metrics ---');
        const calcRes = await fetch(`${baseUrl}/ai/calculate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                age: 30,
                weight: 80,
                height: 180,
                gender: 'male',
                activityLevel: 'active',
                goals: 'muscle gain'
            })
        });

        if (!calcRes.ok) {
            const err = await calcRes.text();
            throw new Error(`AI calculation failed: ${err}`);
        }

        const calcData = await calcRes.json();
        console.log('AI Response:', calcData);

        if (calcData.bmi && calcData.tdee) {
            console.log('\n✅ Verification SUCCEEDED: Health metrics received.');
        } else {
            console.log('\n❌ Verification FAILED: Missing fields in response.');
        }

    } catch (err) {
        console.error('\n❌ Verification FAILED:', err.message);
    }
};

startTest();
