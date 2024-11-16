// RegisterForm.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Progress } from 'flowbite-react';
import { HiOutlineCamera, HiOutlineUserAdd } from 'react-icons/hi';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const RegisterForm = ({ handleOpenModal, handleSubmit, captureCount }) => {
  const [branches, setBranches] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        toast.error('Error al cargar las sucursales. Por favor, recarga la página.');
      }
    };

    fetchBranches();
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (formData.nombre.trim().length < 3) {
      newErrors.nombre = 'El nombre debe tener al menos 3 caracteres';
    }

    // Validar que la cédula tenga al menos 1 dígito
    if (!/^\d+$/.test(formData.cedula)) {
      newErrors.cedula = 'La cédula debe contener solo números';
    }

    if (!/^\d{4}$/.test(formData.pin)) {
      newErrors.pin = 'El PIN debe tener 4 dígitos numéricos';
    }

    const fechaNacimiento = new Date(formData.fecha_nacimiento);
    const hoy = new Date();
    const edad = hoy.getFullYear() - fechaNacimiento.getFullYear();

    if (!formData.fecha_nacimiento) {
      newErrors.fecha_nacimiento = 'La fecha de nacimiento es requerida';
    } else if (edad < 18 || edad > 100) {
      newErrors.fecha_nacimiento = 'La edad debe estar entre 18 y 100 años';
    }

    if (!formData.sucursal_id) {
      newErrors.sucursal_id = 'Debe seleccionar una sucursal';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'pin' && !/^\d{0,4}$/.test(value)) {
      return;
    }
    if (name === 'cedula' && !/^\d*$/.test(value)) {
      return;
    }
    if (name === 'nombre' && value.length > 100) {
      return;
    }

    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor, corrija los errores en el formulario.');
      return;
    }

    if (captureCount < 5) {
      toast.error('Debe completar las 5 capturas faciales.');
      return;
    }

    setIsSubmitting(true);
    try {
      await handleSubmit(formData);
      // Solo limpiar el formulario si handleSubmit no arroja error
      setFormData({
        nombre: '',
        cedula: '',
        sucursal_id: '',
        pin: '',
        fecha_nacimiento: '',
      });
      setErrors({});
    } catch (error) {
      // No necesitamos manejar el error aquí ya que se maneja en handleSubmit
      console.error('Error en el envío del formulario:', error);
    } finally {
      setIsSubmitting(false);
    }
  };


  const getFieldError = (fieldName) => (
    errors[fieldName] && (
      <span className="text-red-500 text-xs mt-1">{errors[fieldName]}</span>
    )
  );

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="bg-white shadow-md rounded-lg p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
              ${errors.nombre ? 'border-red-500' : 'border-gray-300'}`}
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ingrese el nombre completo"
              required
            />
            {getFieldError('nombre')}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cédula *
            </label>
            <input
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
              ${errors.cedula ? 'border-red-500' : 'border-gray-300'}`}
              type="text"
              name="cedula"
              value={formData.cedula}
              onChange={handleChange}
              placeholder="Ingrese los números"
              required
            />
            {getFieldError('cedula')}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Nacimiento *
            </label>
            <input
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
              ${errors.fecha_nacimiento ? 'border-red-500' : 'border-gray-300'}`}
              type="date"
              name="fecha_nacimiento"
              value={formData.fecha_nacimiento}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
              required
            />
            {getFieldError('fecha_nacimiento')}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sucursal *
            </label>
            <select
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
              ${errors.sucursal_id ? 'border-red-500' : 'border-gray-300'}`}
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
            {getFieldError('sucursal_id')}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PIN (4 dígitos) *
            </label>
            <input
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
              ${errors.pin ? 'border-red-500' : 'border-gray-300'}`}
              type="password"
              name="pin"
              value={formData.pin}
              onChange={handleChange}
              placeholder="Ingrese 4 dígitos"
              maxLength={4}
              required
            />
            {getFieldError('pin')}
          </div>

          <div className="flex items-end">
            <Button
              color="blue"
              onClick={handleOpenModal}
              className="w-full"
              disabled={isSubmitting}
              type="button"
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
          disabled={captureCount < 5 || isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin mr-2 h-5 w-5 border-b-2 border-white rounded-full" />
              Registrando...
            </div>
          ) : (
            <>
              <HiOutlineUserAdd className="mr-2 h-5 w-5" />
              Registrar Empleado
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default RegisterForm;