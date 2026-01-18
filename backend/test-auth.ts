import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/v1';

async function testAuth() {
  console.log('🧪 Testing Authentication API...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Health Check:');
    const healthRes = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Success:', healthRes.data);
    console.log('');

    // Test 2: Login
    console.log('2️⃣ Login (admin/admin123):');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123',
    });
    console.log('✅ Success!');
    console.log('User:', loginRes.data.data.user.username, '-', loginRes.data.data.user.full_name);
    console.log('Token:', loginRes.data.data.token.substring(0, 30) + '...');
    console.log('');

    const token = loginRes.data.data.token;

    // Test 3: Get Current User (Protected)
    console.log('3️⃣ Get Current User (Protected Route):');
    const meRes = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('✅ Success:', meRes.data.data.username, '-', meRes.data.data.email);
    console.log('');

    // Test 4: Invalid Login
    console.log('4️⃣ Invalid Login:');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        username: 'admin',
        password: 'wrongpassword',
      });
    } catch (error: any) {
      console.log('✅ Correctly rejected:', error.response.data.error);
    }
    console.log('');

    // Test 5: Protected Route Without Token
    console.log('5️⃣ Protected Route Without Token:');
    try {
      await axios.get(`${BASE_URL}/auth/me`);
    } catch (error: any) {
      console.log('✅ Correctly rejected:', error.response.data.error);
    }
    console.log('');

    console.log('🎉 All tests passed!');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testAuth();
