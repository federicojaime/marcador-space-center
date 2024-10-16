import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaUserPlus, FaSignInAlt } from 'react-icons/fa';

const Sidebar = () => {
  return (
    <aside className="bg-gray-800 text-white w-64 min-h-screen p-4">
      <nav>
        <ul className="space-y-2">
          <li>
            <Link to="/" className="flex items-center space-x-2 p-2 rounded hover:bg-gray-700">
              <FaHome />
              <span>Inicio</span>
            </Link>
          </li>
          <li>
            <Link to="/register" className="flex items-center space-x-2 p-2 rounded hover:bg-gray-700">
              <FaUserPlus />
              <span>Registro</span>
            </Link>
          </li>
          <li>
            <Link to="/login" className="flex items-center space-x-2 p-2 rounded hover:bg-gray-700">
              <FaSignInAlt />
              <span>Fichaje</span>
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;