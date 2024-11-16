// src/config/env.js
const env = {
    API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
    // Agrega otras variables de entorno según sea necesario
};

export default env;