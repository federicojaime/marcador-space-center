// src/components/RegisterForm.jsx

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Progress } from 'flowbite-react';
import { HiOutlineCamera, HiOutlineUserAdd } from 'react-icons/hi';

const RegisterForm = ({ handleOpenModal, handleSubmit, captureCount }) => {
  const [branches, setBranches] = useState([]);
  const [formData, setFormData] = useState({
    nombre: '',
    cedula: '',
    sucursal_id: '',
    pin: '',
    fecha_nacimiento: '',
  });

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await axios.get('https://codeo.site/api-marcador/api/branches');
        setBranches(response.data);
      } catch (error) {
        console.error('Error al cargar las sucursales:', error);
      }
    };

    fetchBranches();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'pin' && (isNaN(value) || value.length > 4)) {
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    handleSubmit(formData);
    // Resetear el formulario después de enviar
    setFormData({
      nombre: '',
      cedula: '',
      sucursal_id: '',
      pin: '',
      fecha_nacimiento: '',
    });
  };

  return (
    <form onSubmit={onSubmit} className="bg-white shadow-md rounded-lg p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
          <input
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cédula *</label>
          <input
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            type="text"
            name="cedula"
            value={formData.cedula}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento *</label>
          <input
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            type="date"
            name="fecha_nacimiento"
            value={formData.fecha_nacimiento}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal *</label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            name="sucursal_id"
            value={formData.sucursal_id}
            onChange={handleChange}
            required
          >
            <option value="">Seleccione una sucursal</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">PIN (4 dígitos) *</label>
          <input
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            type="password"
            name="pin"
            value={formData.pin}
            onChange={handleChange}
            maxLength={4}
            required
          />
        </div>

        <div className="flex items-end">
          <Button
            color="blue"
            onClick={handleOpenModal}
            className="w-full"
          >
            <HiOutlineCamera className="mr-2 h-5 w-5" />
            Capturar Rostro
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <Progress
          progress={(captureCount / 5) * 100}
          color="blue"
          size="lg"
          label={`Capturas de rostro: ${captureCount}/5`}
        />
      </div>

      <Button
        type="submit"
        color="success"
        className="mt-8 w-full"
        disabled={captureCount < 5}
      >
        <HiOutlineUserAdd className="mr-2 h-5 w-5" />
        Registrar Empleado
      </Button>
    </form>
  );
};

export default RegisterForm;