import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RegisterForm from '../components/RegisterForm';
import { Modal, Button, Progress } from 'flowbite-react';
import * as faceapi from 'face-api.js';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { HiOutlineCamera, HiArrowLeft } from 'react-icons/hi';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedDescriptors, setCapturedDescriptors] = useState([]);
  const [captureCount, setCaptureCount] = useState(0);
  const videoRef = useRef(null);

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
      } catch (e) {
        console.error('Error loading models:', e);
        toast.error('Error al cargar los modelos de reconocimiento facial.');
      }
    };

    loadModels();
  }, []);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setCapturedDescriptors([]);
    setCaptureCount(0);
    startVideo();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    stopVideoStream();
  };

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: {} })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error('Error accessing camera:', err);
        toast.error('Error al acceder a la cámara.');
      });
  };

  const stopVideoStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
  };

  const handleCaptureDescriptor = async () => {
    setIsProcessing(true);
    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        setCapturedDescriptors((prev) => [...prev, detection.descriptor]);
        setCaptureCount((prev) => prev + 1);
        toast.success(`Captura de rostro ${captureCount + 1}/5 exitosa.`);
      } else {
        toast.error('No se detectó ningún rostro. Por favor, inténtelo de nuevo.');
      }
    } catch (error) {
      console.error('Error al capturar el descriptor facial:', error);
      toast.error('Error al procesar el descriptor facial.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (formData) => {
    if (capturedDescriptors.length < 5) {
      toast.error('Por favor, capture 5 imágenes faciales.');
      return;
    }

    try {
      const response = await axios.post('https://codeo.site/api-marcador/api/register', {
        ...formData,
        descriptors: capturedDescriptors.map((desc) => Array.from(desc)),
      });

      if (response.status === 200) {
        toast.success('Empleado registrado exitosamente.');
        setCapturedDescriptors([]);
        setCaptureCount(0);
      } else {
        toast.error('Error inesperado al registrar el empleado.');
      }
    } catch (error) {
      console.error('Error al registrar el empleado:', error);
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(`Error: ${error.response.data.message}`);
      } else {
        toast.error('Error al registrar el empleado.');
      }
    }
  };

  const handleGoBack = () => {
    navigate(-1); // This will take the user back to the previous page
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Registro de Empleados</h1>
        <Button color="light" onClick={handleGoBack}>
          <HiArrowLeft className="mr-2 h-5 w-5" />
          Volver
        </Button>
      </div>

      <RegisterForm
        handleOpenModal={handleOpenModal}
        handleSubmit={handleSubmit}
        captureCount={captureCount}
      />

      <Modal show={isModalOpen} size="lg" onClose={handleCloseModal}>
        <Modal.Header>Reconocimiento Facial</Modal.Header>
        <Modal.Body>
          <div className="flex flex-col items-center">
            <video
              ref={videoRef}
              autoPlay
              muted
              className="rounded-lg shadow-lg w-full mb-4"
            />
            <p className="mb-4 text-center text-gray-600">
              Por favor, mire directamente a la cámara y asegúrese de que su rostro esté bien iluminado.
            </p>
            <Button
              color={captureCount >= 5 ? "success" : "blue"}
              onClick={captureCount >= 5 ? handleCloseModal : handleCaptureDescriptor}
              disabled={isProcessing}
            >
              <HiOutlineCamera className="mr-2 h-5 w-5" />
              {captureCount >= 5 ? "Cerrar y Continuar" : (isProcessing ? 'Procesando...' : 'Capturar Rostro')}
            </Button>
            <p className="mt-4 font-semibold">
              Capturas realizadas: {captureCount} de 5
            </p>
            <Progress
              progress={(captureCount / 5) * 100}
              color="blue"
              size="lg"
              className="w-full mt-4"
            />
          </div>
        </Modal.Body>
      </Modal>

      <ToastContainer position="bottom-right" autoClose={5000} />
    </div>
  );
};

export default RegisterPage;