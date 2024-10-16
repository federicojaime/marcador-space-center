import React, { useRef, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import * as faceapi from 'face-api.js';
import { Button } from 'flowbite-react';
import { ToastContainer, toast } from 'react-toastify';
import LoadingSpinner from './LoadingSpinner';
import 'react-toastify/dist/ReactToastify.css';
import { HiArrowLeft } from 'react-icons/hi';

const Login = () => {
  const videoRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognizedEmployee, setRecognizedEmployee] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [action, setAction] = useState(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        startVideo();
      } catch (e) {
        console.error('Error al cargar los modelos:', e);
        toast.error('Error al cargar los modelos de reconocimiento facial.');
      }
    };

    loadModels();
  }, []);

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: {} })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error('Error al acceder a la cámara:', err);
        toast.error('Error al acceder a la cámara.');
      });
  };

  const handleFaceRecognition = useCallback(async () => {
    setIsProcessing(true);

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        toast.error('No se detectó ningún rostro. Por favor, inténtelo de nuevo.');
        return;
      }

      const descriptor = detection.descriptor;
      const employeesResponse = await axios.get('https://codeo.site/api-marcador/api/employees');
      const employees = employeesResponse.data;

      const labeledDescriptors = employees
        .filter(employee => employee.descriptors && Array.isArray(employee.descriptors))
        .map(employee => {
          try {
            const descriptors = employee.descriptors.map(desc => new Float32Array(desc));
            return new faceapi.LabeledFaceDescriptors(employee.nombre, descriptors);
          } catch (err) {
            console.error(`Error al procesar descriptores para ${employee.nombre}:`, err);
            return null;
          }
        })
        .filter(ld => ld !== null);

      if (labeledDescriptors.length === 0) {
        toast.error('No hay empleados con descriptores válidos.');
        return;
      }

      const maxDescriptorDistance = 0.5;
      const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, maxDescriptorDistance);
      const bestMatch = faceMatcher.findBestMatch(descriptor);

      if (bestMatch.label !== 'unknown') {
        const matchedEmployee = employees.find(emp => emp.nombre === bestMatch.label);
        setRecognizedEmployee({
          id: matchedEmployee.id,
          nombre: matchedEmployee.nombre,
          descriptor: descriptor,
        });
        toast.success(`Bienvenido ${bestMatch.label}, por favor seleccione una acción.`);
      } else {
        toast.error('No se ha reconocido su rostro. Por favor, intente de nuevo.');
        setRecognizedEmployee(null);
      }
    } catch (error) {
      console.error('Error durante el reconocimiento facial:', error);
      toast.error('Error al procesar el reconocimiento facial.');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleCheckInOut = useCallback(async () => {
    if (!pinInput) {
      toast.error('El PIN es obligatorio.');
      return;
    }

    setIsProcessing(true);

    try {
      const endpoint = `https://codeo.site/api-marcador/api/${action}`;
      const response = await axios.post(endpoint, {
        pin: pinInput,
        descriptor: Array.from(recognizedEmployee.descriptor),
      });

      toast.success(response.data.message);
      setRecognizedEmployee(null);
      setPinInput('');
      setAction(null);
    } catch (error) {
      console.error(`Error al fichar ${action}:`, error);
      toast.error(`Error al fichar ${action}: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [action, pinInput, recognizedEmployee]);

  const handleBack = () => {
    if (action) {
      setAction(null);
      setPinInput('');
    } else if (recognizedEmployee) {
      setRecognizedEmployee(null);
    }
    // If neither action nor recognizedEmployee is set, we're at the initial state
    // so there's no need to go back further
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center text-gray-800">Fichaje de Empleados</h2>

      {modelsLoaded ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            muted
            className="rounded-lg shadow-md w-full mb-4"
          />

          {!recognizedEmployee ? (
            <Button
              color="blue"
              onClick={handleFaceRecognition}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? 'Procesando...' : 'Iniciar Reconocimiento Facial'}
            </Button>
          ) : (
            <div className="space-y-4">
              <p className="text-center text-lg font-semibold">
                Bienvenido, {recognizedEmployee.nombre}
              </p>
              {!action ? (
                <div className="grid grid-cols-2 gap-4">
                  <Button color="green" onClick={() => setAction('checkin')} className="w-full">
                    Fichar Entrada
                  </Button>
                  <Button color="red" onClick={() => setAction('checkout')} className="w-full">
                    Fichar Salida
                  </Button>
                  <Button color="yellow" onClick={() => setAction('lunch_start')} className="w-full">
                    Iniciar Almuerzo
                  </Button>
                  <Button color="purple" onClick={() => setAction('lunch_end')} className="w-full">
                    Finalizar Almuerzo
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <input
                    type="password"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Ingrese su PIN (4 dígitos)"
                    maxLength={4}
                  />
                  <Button color="success" onClick={handleCheckInOut} disabled={isProcessing} className="w-full">
                    Confirmar {action.replace('_', ' ')}
                  </Button>
                </div>
              )}
              <Button color="light" onClick={handleBack} className="w-full">
                <HiArrowLeft className="mr-2 h-5 w-5" />
                Volver
              </Button>
            </div>
          )}
        </>
      ) : (
        <LoadingSpinner message="Cargando modelos de reconocimiento facial..." />
      )}
      <ToastContainer position="bottom-right" autoClose={5000} />
    </div>
  );
};

export default Login;