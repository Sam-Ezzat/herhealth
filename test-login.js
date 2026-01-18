const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login API...');
    const response = await axios.post('http://localhost:5000/api/v1/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    console.log('Status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    // Check response structure
    if (response.data.success && response.data.data) {
      console.log('\n✓ Login successful!');
      console.log('User:', response.data.data.user);
      console.log('Token:', response.data.data.token ? 'Present' : 'Missing');
    } else {
      console.log('\n✗ Unexpected response structure');
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testLogin();
