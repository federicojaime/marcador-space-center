import React from 'react';
import Login from '../components/Login';
import logo from '../assets/logo.png'; // Asegúrate de tener este logo en tu proyecto

const LoginPage = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <Login />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;