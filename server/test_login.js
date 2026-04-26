const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('https://hms-kp4n.onrender.com/api/auth/login', {
      identifier: 'test@test.com',
      password: 'wrongpassword'
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.log("Error status:", err.response?.status);
    console.log("Error data:", err.response?.data);
  }
}
test();
