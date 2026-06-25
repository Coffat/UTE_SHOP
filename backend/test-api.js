import axios from 'axios';
async function test() {
  try {
    // Need to login to get token first
    const loginRes = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'admin@gmail.com', // guess
      password: 'password123'
    });
    const token = loginRes.data.data.accessToken;
    
    const orderRes = await axios.get('http://localhost:3000/api/v1/admin/orders/6a1e511db2a14e2510eb526d', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(JSON.stringify(orderRes.data.data, null, 2));
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}
test();
