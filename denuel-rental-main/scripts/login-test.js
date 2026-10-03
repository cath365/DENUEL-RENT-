const http = require('http');
const data = JSON.stringify({ email: 'admin@denuel.local', password: 'Admin#1234' });

const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
  },
};

const req = http.request(options, (res) => {
  console.log('statusCode:', res.statusCode);
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => {
    console.log('body:', body);
  });
});

req.on('error', (err) => {
  console.error('request error:', err.message);
});

req.write(data);
req.end();