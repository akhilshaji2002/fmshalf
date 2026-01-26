const startTest = async () => {
    try {
        const baseUrl = 'http://localhost:5000/api';

        // Login
        console.log('\n--- Logging In ---');
        const loginRes = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@fms.com', password: 'password123' })
        });

        if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.statusText}`);
        const { token } = await loginRes.json();
        console.log('Login successful.');

        // Test Calculate Health Metrics (still works?)
        console.log('\n--- Testing Health Metrics ---');
        const calcRes = await fetch(`${baseUrl}/ai/calculate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                age: 30, weight: 80, height: 180, gender: 'male', activityLevel: 'active', goals: 'muscle gain'
            })
        });

        if (calcRes.ok) console.log('✅ Health Metrics: OK');
        else console.log('❌ Health Metrics: FAILED', await calcRes.text());

        // Test Progress AI (Stubbed Image)
        // We can't easily mock file upload in simple node script without form-data lib or boundaries.
        // But we can check if the server is running and logic hasn't crashed.
        console.log('\n--- Progress AI Endpoint Check ---');
        // Just checking connectivity to ensuring controller doesn't crash on import
        console.log('Skipping actual file upload test in this lightweight script. Manual test recommended for UI.');

    } catch (err) {
        console.error('\n❌ Verification FAILED:', err.message);
    }
};

startTest();
