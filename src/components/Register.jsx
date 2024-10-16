import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';
import * as faceapi from 'face-api.js';

const Register = ({ closeModal }) => {
  const videoRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [branches, setBranches] = useState([]);
  const [formData, setFormData] = useState({
    nombre: '',
    cedula: '',
    sucursal_id: '',
    pin: '',
  });

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        startVideo();
      } catch (e) {
        console.error('Error al cargar los modelos:', e);
      }
    };

    loadModels();

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

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: {} })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => console.error('Error al acceder a la cámara:', err));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleRegistration = async (e) => {
    e.preventDefault();
    setIsCapturing(true);

    await new Promise(resolve => setTimeout(resolve, 1000));

    const detections = await faceapi.detectSingleFace(
      videoRef.current,
      new faceapi.SsdMobilenetv1Options()
    ).withFaceLandmarks().withFaceDescriptor();

    if (detections) {
      const descriptor = detections.descriptor;
      try {
        const response = await axios.post('https://codeo.site/api-marcador/api/register', {
          ...formData,
          descriptor: Array.from(descriptor),
        });

        alert(response.data.message);
        closeModal(); // Cerrar modal tras el registro
      } catch (error) {
        console.error('Error al registrar el empleado:', error);
      }
    } else {
      alert('No se detectó ningún rostro. Por favor, inténtalo de nuevo.');
    }

    setIsCapturing(false);
  };

  return (
    <div>
      {modelsLoaded ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            muted
            className="rounded-lg shadow-lg w-full"
          />
          <form onSubmit={handleRegistration} className="mt-4">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre *</label>
                <input
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cédula *</label>
                <input
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  type="text"
                  name="cedula"
                  value={formData.cedula}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Sucursal *</label>
                <select
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                <label className="block text-sm font-medium text-gray-700">PIN (4 dígitos) *</label>
                <input
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  type="password"
                  name="pin"
                  value={formData.pin}
                  onChange={handleChange}
                  required
                  maxLength={4}
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-6 w-full py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition duration-200"
              disabled={isCapturing}
            >
              {isCapturing ? 'Registrando...' : 'Registrar Empleado'}
            </button>
          </form>
        </>
      ) : (
        <p className="text-gray-700">Cargando modelos...</p>
      )}
    </div>
  );
};

export default Register;
