import axios from 'axios';

const api = axios.create({
  baseURL: 'https://unishare-server.onrender.com', // URL ของ FastAPI Backend
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;