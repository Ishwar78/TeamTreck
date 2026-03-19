const axios = require('axios');

async function testNotification() {
  try {
    const baseURL = 'http://localhost:5000';
    
    // 1. Register a test company
    const registerRes = await axios.post(`${baseURL}/api/company/register`, {
      companyName: "Test Notification Corp",
      domain: "testnotifcorp",
      adminName: "Notif Admin",
      email: "testadmin@notifcorp.com",
      password: "password123"
    }).catch(err => err.response);

    let emailToLogin = "testadmin@notifcorp.com";
    if (registerRes.data && !registerRes.data.success && registerRes.data.message === 'Domain already exists') {
        console.log("Domain exists, reusing...");
    }

    // 2. Login
    const loginRes = await axios.post(`${baseURL}/api/auth/login`, {
      email: emailToLogin,
      password: "password123",
      role: "company_admin",
      device_id: "test-device-id-123"
    });

    const token = loginRes.data.token;
    console.log("Logged in successfully. Token length:", token.length);

    // 3. Invite a user (to send notification to)
    const testUserEmail = "testemployee@notifcorp.com";
    const inviteRes = await axios.post(`${baseURL}/api/company/invites`, {
      email: testUserEmail,
      role: "employee"
    }, {
      headers: { Authorization: `Bearer ${token}` }
    }).catch(err => console.log("Invite failed or exists", err.response?.data));
    
    // Wait, the notification endpoint looks for existing User documents.
    // If we only invite, they might not be in the User collection yet!
    // Let's get the users list.
    const usersRes = await axios.get(`${baseURL}/api/company/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const users = usersRes.data.users;
    console.log("Users in company:", users.length);

    if (users.length === 0) {
        console.log("No users to send to! Since admin gets skipped or something?");
    }

    // Send a notification to whatever users we have! If only the admin, we'll try to send to admin.
    // Wait, does `/api/company/users` return the admin? The route says `role: { $ne: 'super_admin' }` 
    // so it should return the company_admin themselves. We can notify the admin directly!
    
    if (users.length > 0) {
        const userIds = users.map(u => u._id);
        console.log("Sending to userIds:", userIds);
        
        const sendRes = await axios.post(`${baseURL}/api/company/notifications/send`, {
            userIds,
            subject: "Verification Email Test",
            message: "Hello this is a test from the newly added Notifications feature!"
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log("Notification send result:", sendRes.data);
    }

  } catch (error) {
    if (error.response) {
      console.error("Error Response:", error.response.data);
    } else {
      console.error("Error:", error.message);
    }
  }
}

testNotification();
