async function verifyAdminManagement() {
    const API_URL = 'http://localhost:5000/api';

    try {
        console.log('Logging in as Admin...');
        const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@fms.com', password: 'password123' })
        });
        const adminLogin = await adminLoginRes.json();
        const adminHeaders = { Authorization: `Bearer ${adminLogin.token}` };

        // 1. Test Fetch All Users
        console.log('Testing: Admin fetching all users...');
        const allUsersRes = await fetch(`${API_URL}/admin/users`, { headers: adminHeaders });
        const allUsers = await allUsersRes.json();

        if (allUsers.length > 0) {
            console.log(`✅ SUCCESS: Admin fetched ${allUsers.length} users.`);
            // Verify sensitive data is present
            const member = allUsers.find(u => u.role === 'member');
            if (member && member.mobileNumber !== undefined) {
                console.log('✅ SUCCESS: Member mobile number is visible to Admin.');
            }
        } else {
            console.error('❌ FAILURE: Admin could not fetch users.');
        }

        // 2. Test Security (Non-admin access)
        console.log('Testing: Non-admin access to master list...');
        const trainerLoginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'trainer@fms.com', password: 'password123' })
        });
        const trainerLogin = await trainerLoginRes.json();

        const breachRes = await fetch(`${API_URL}/admin/users`, {
            headers: { Authorization: `Bearer ${trainerLogin.token}` }
        });

        if (breachRes.status === 403 || breachRes.status === 401) {
            console.log('✅ SUCCESS: Non-admin denied access to master list.');
        } else {
            console.error('❌ PRIVACY BREACH: Non-admin accessed master list!');
        }

        // 3. Test Password Reset
        const testUser = allUsers.find(u => u.email !== 'admin@fms.com');
        if (testUser) {
            console.log(`Testing: Admin resetting password for ${testUser.email}...`);
            const resetRes = await fetch(`${API_URL}/admin/users/${testUser._id}/reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...adminHeaders
                },
                body: JSON.stringify({ newPassword: 'resetPassword123' })
            });
            const resetData = await resetRes.json();

            if (resetRes.ok) {
                console.log('✅ SUCCESS:', resetData.message);

                // Verify login with new password
                console.log('Verifying login with new password...');
                const newLoginRes = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: testUser.email, password: 'resetPassword123' })
                });
                if (newLoginRes.ok) {
                    console.log('✅ SUCCESS: Login works with new password.');
                    // Revert password for cleanup? No, it's a test environment.
                } else {
                    console.error('❌ FAILURE: Login failed with reset password.');
                }
            } else {
                console.error('❌ FAILURE: Reset failed.');
            }
        }

    } catch (err) {
        console.error('Error during verification:', err.message);
    }
}

verifyAdminManagement();
