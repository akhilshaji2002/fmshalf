async function verify() {
    const API_URL = 'http://localhost:5000/api';

    try {
        // 1. Login as Coach
        console.log('Logging in as Coach...');
        const coachLoginRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Verification Coach',
                email: `v_coach_${Date.now()}@test.com`,
                password: 'password123',
                role: 'trainer',
                mobileNumber: '9999999999'
            })
        });
        const coachLogin = await coachLoginRes.json();
        const coachToken = coachLogin.token;
        const coachHeaders = { Authorization: `Bearer ${coachToken}` };

        // 2. Register a Member with Mobile Number
        console.log('Registering a Member with sensitive data...');
        const memberResRaw = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Private Member',
                email: `p_member_${Date.now()}@test.com`,
                password: 'password123',
                role: 'member',
                mobileNumber: '8888888888',
                nationalId: { idType: 'aadhar', idNumber: '1234-5678-9012' }
            })
        });
        const memberRes = await memberResRaw.json();
        const memberId = memberRes._id;
        const memberToken = memberRes.token;
        const memberHeaders = { Authorization: `Bearer ${memberToken}`, 'Content-Type': 'application/json' };

        // 3. Member Books Online Training
        console.log('Member booking Online Session...');
        const bookingResRaw = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: memberHeaders,
            body: JSON.stringify({
                coachId: coachLogin._id,
                coachName: coachLogin.name,
                date: new Date(),
                trainingType: 'online'
            })
        });
        const bookingRes = await bookingResRaw.json();
        console.log('Booking Result Training Type:', bookingRes.trainingType);

        // 4. Verify Privacy (Coach fetching members)
        console.log('Verifying Privacy: Coach fetching member list...');
        const membersListRaw = await fetch(`${API_URL}/members`, { headers: coachHeaders });
        const membersList = await membersListRaw.json();
        const privateMember = membersList.find(m => m._id === memberId);

        if (privateMember && privateMember.mobileNumber) {
            console.error('❌ PRIVACY BREACH: Coach can see member mobile number!');
        } else {
            console.log('✅ PRIVACY SUCCESS: Mobile number hidden from coach.');
        }

        // 5. Verify Privacy (Coach fetching bookings)
        console.log('Verifying Privacy: Coach fetching bookings...');
        const bookingsListRaw = await fetch(`${API_URL}/bookings`, { headers: coachHeaders });
        const bookingsList = await bookingsListRaw.json();
        const booking = bookingsList.find(b => b._id === bookingRes._id);
        const memberInBooking = booking?.member;

        if (memberInBooking && memberInBooking.mobileNumber) {
            console.error('❌ PRIVACY BREACH: Coach can see mobile number in bookings!');
        } else {
            console.log('✅ PRIVACY SUCCESS: Mobile number hidden in bookings.');
        }

        // 6. Verify Admin Access
        console.log('Logging in as Admin...');
        const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@fms.com',
                password: 'password123'
            })
        });
        const adminLogin = await adminLoginRes.json();
        const adminHeaders = { Authorization: `Bearer ${adminLogin.token}` };

        console.log('Verifying Admin: Admin fetching member list...');
        const adminMembersListRaw = await fetch(`${API_URL}/members`, { headers: adminHeaders });
        const adminMembersList = await adminMembersListRaw.json();
        const memberForAdmin = adminMembersList.find(m => m._id === memberId);

        if (memberForAdmin && memberForAdmin.mobileNumber === '8888888888') {
            console.log('✅ ADMIN SUCCESS: Admin can see mobile numbers.');
        } else {
            console.error('❌ ADMIN FAILURE: Admin cannot see mobile numbers.');
        }

    } catch (err) {
        console.error('Error during verification:', err.message);
    }
}

verify();
