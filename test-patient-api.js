const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';
let authToken = '';

async function testPatientAPI() {
  console.log('🧪 Testing Patient Management API...\n');

  try {
    // Step 1: Login to get auth token
    console.log('1️⃣ Login to get auth token:');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123',
    });
    authToken = loginRes.data.data.token;
    console.log('✅ Logged in successfully\n');

    const headers = { Authorization: `Bearer ${authToken}` };

    // Step 2: Get color codes
    console.log('2️⃣ Get Color Codes:');
    const colorCodesRes = await axios.get(`${BASE_URL}/patients/color-codes`, { headers });
    console.log('✅ Color codes:', colorCodesRes.data.data.length, 'codes found');
    const colorCodeId = colorCodesRes.data.data[0]?.id;
    console.log('');

    // Step 3: Create a new patient
    console.log('3️⃣ Create New Patient:');
    const newPatient = {
      first_name: 'Jane',
      last_name: 'Doe',
      date_of_birth: '1990-05-15',
      gender: 'Female',
      phone: '555-1234567',
      email: 'jane.doe@example.com',
      address: '123 Main Street, City, State',
      emergency_contact_name: 'John Doe',
      emergency_contact_phone: '555-7654321',
      blood_type: 'O+',
      allergies: 'Penicillin',
      medical_history: 'No major medical history',
      insurance_provider: 'HealthCare Inc',
      insurance_number: 'HC123456',
      color_code_id: colorCodeId,
    };

    const createRes = await axios.post(`${BASE_URL}/patients`, newPatient, { headers });
    const createdPatient = createRes.data.data;
    console.log('✅ Patient created:', createdPatient.first_name, createdPatient.last_name, '-', createdPatient.id);
    console.log('');

    // Step 4: Get patient by ID
    console.log('4️⃣ Get Patient by ID:');
    const getRes = await axios.get(`${BASE_URL}/patients/${createdPatient.id}`, { headers });
    console.log('✅ Patient retrieved:', getRes.data.data.first_name, getRes.data.data.last_name);
    console.log('   Color Code:', getRes.data.data.color_code_name);
    console.log('');

    // Step 5: Update patient
    console.log('5️⃣ Update Patient:');
    const updateRes = await axios.put(
      `${BASE_URL}/patients/${createdPatient.id}`,
      { allergies: 'Penicillin, Sulfa drugs' },
      { headers }
    );
    console.log('✅ Patient updated:', updateRes.data.data.allergies);
    console.log('');

    // Step 6: Search patients
    console.log('6️⃣ Search Patients (by name):');
    const searchRes = await axios.get(`${BASE_URL}/patients?search=Jane`, { headers });
    console.log('✅ Found:', searchRes.data.data.total, 'patients');
    console.log('');

    // Step 7: Filter by gender
    console.log('7️⃣ Filter Patients (by gender):');
    const filterRes = await axios.get(`${BASE_URL}/patients?gender=Female`, { headers });
    console.log('✅ Female patients:', filterRes.data.data.total);
    console.log('');

    // Step 8: Get patient stats
    console.log('8️⃣ Get Patient Statistics:');
    const statsRes = await axios.get(`${BASE_URL}/patients/stats`, { headers });
    console.log('✅ Statistics:', statsRes.data.data);
    console.log('');

    // Step 9: Delete patient
    console.log('9️⃣ Delete Patient:');
    const deleteRes = await axios.delete(`${BASE_URL}/patients/${createdPatient.id}`, { headers });
    console.log('✅ Patient deleted:', deleteRes.data.data.message);
    console.log('');

    // Step 10: Try to get deleted patient (should fail)
    console.log('🔟 Try to get deleted patient:');
    try {
      await axios.get(`${BASE_URL}/patients/${createdPatient.id}`, { headers });
    } catch (error) {
      console.log('✅ Correctly rejected:', error.response.data.error);
    }
    console.log('');

    console.log('🎉 All Patient API tests passed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testPatientAPI();
