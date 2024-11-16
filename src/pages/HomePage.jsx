import { Link } from 'react-router-dom';
import { FaUserPlus, FaClock } from 'react-icons/fa';  // Iconos agregados

const HomePage = () => {
  return (
    <div className="container mx-auto px-4 py-12 flex flex-col items-center">
      <h1 className="text-4xl font-extrabold text-center mb-12 text-gray-900">Bienvenido a Space Center</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Card 1 */}
        <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 p-8 flex flex-col items-center text-center">
          <FaClock className="text-green-600 text-6xl mb-6" /> {/* Icono */}
          <h2 className="text-3xl font-semibold mb-4 text-green-600">Fichaje</h2>
          <p className="mb-6 text-gray-700">Ficha tu entrada y salida.</p>
          <Link
            to="/login"
            className="inline-block bg-green-600 text-white font-medium px-6 py-3 rounded-md hover:bg-green-700 transition-colors duration-300"
          >
            Ir a Fichaje
          </Link>
        </div>
        {/* Card 2 */}
        <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 p-8 flex flex-col items-center text-center">
          <FaUserPlus className="text-green-600 text-6xl mb-6" /> {/* Icono */}
          <h2 className="text-3xl font-semibold mb-4 text-green-600">Registro de Empleados</h2>
          <p className="mb-6 text-gray-700">Si aún no te registraste, ingresá acá.</p>
          <Link
            to="/register"
            className="inline-block bg-green-600 text-white font-medium px-6 py-3 rounded-md hover:bg-green-700 transition-colors duration-300"
          >
            Ir a Registro
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

