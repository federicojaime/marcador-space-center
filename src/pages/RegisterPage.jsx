// RegisterPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RegisterForm from '../components/RegisterForm';
import { Modal, Button, Progress } from 'flowbite-react';
import * as faceapi from 'face-api.js';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import { HiOutlineCamera, HiArrowLeft } from 'react-icons/hi';
import 'react-toastify/dist/ReactToastify.css';
import './RegisterPage.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedDescriptors, setCapturedDescriptors] = useState([]);
  const [captureCount, setCaptureCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const videoRef = useRef(null);

  const showToast = (type, message, options = {}) => {
    toast.dismiss(); // Descarta toasts previos
    const defaultOptions = {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: false,
      className: 'camera-toast',
      style: {
        zIndex: 100000,
        fontSize: '14px',
        backgroundColor: 'white',
        color: 'black',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        margin: '8px'
      }
    };
    
    toast[type](message, { ...defaultOptions, ...options });
  };

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (e) {
        console.error('Error al cargar los modelos:', e);
        showToast('error', 'Error al cargar los modelos de reconocimiento facial.');
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
        console.error('Error al acceder a la cámara:', err);
        showToast('error', 'Error al acceder a la cámara.');
      });
  };

  const stopVideoStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
  };

  const analyzeImage = async (detection) => {
    const messages = [];

    // Verificar ángulo
    const landmarks = detection.landmarks;
    const leftEye = landmarks.getLeftEye()[0];
    const rightEye = landmarks.getRightEye()[0];
    const angleRad = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
    const angleDeg = angleRad * (180 / Math.PI);
    if (Math.abs(angleDeg) > 10) {
      messages.push("Endereza tu cabeza. Mira directamente a la cámara.");
    }

    // Verificar iluminación
    const brightness = await getImageBrightness(videoRef.current);
    if (brightness < 50) {
      messages.push("La imagen está muy oscura. Mejora la iluminación.");
    } else if (brightness > 200) {
      messages.push("La imagen está muy brillante. Reduce la iluminación.");
    }

    // Verificar posición
    const faceBox = detection.detection.box;
    const imageArea = videoRef.current.videoWidth * videoRef.current.videoHeight;
    const faceArea = faceBox.width * faceBox.height;
    const faceRatio = faceArea / imageArea;
    if (faceRatio < 0.15) {
      messages.push("Acércate un poco más a la cámara.");
    } else if (faceRatio > 0.65) {
      messages.push("Aléjate un poco de la cámara.");
    }

    // Verificar expresión
    const expressions = detection.expressions;
    const neutralExpression = expressions.neutral;
    if (neutralExpression < 0.7) {
      messages.push("Mantén una expresión neutral, como para una foto de identificación.");
    }

    return messages;
  };

  const getImageBrightness = async (videoElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let r, g, b, avg;
    let colorSum = 0;
    for (let x = 0, len = data.length; x < len; x += 4) {
      r = data[x];
      g = data[x + 1];
      b = data[x + 2];
      avg = Math.floor((r + g + b) / 3);
      colorSum += avg;
    }
    return Math.floor(colorSum / (canvas.width * canvas.height));
  };

  const handleCaptureDescriptor = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.SsdMobilenetv1Options())
        .withFaceLandmarks()
        .withFaceExpressions()
        .withFaceDescriptors();

      if (detections.length === 0) {
        showToast('warning', 'No se detectó ningún rostro. Asegúrate de estar frente a la cámara.', {
          autoClose: 3000,
        });
        return;
      }

      if (detections.length > 1) {
        showToast('warning', 'Se detectó más de un rostro. Asegúrate de que solo tú estés en la imagen.', {
          autoClose: 3000,
        });
        return;
      }

      const detection = detections[0];
      const analysisMessages = await analyzeImage(detection);

      if (analysisMessages.length > 0) {
        showToast('info', analysisMessages.join(' '), { 
          autoClose: 3000,
        });
        return;
      }

      setCapturedDescriptors(prev => [...prev, detection.descriptor]);
      setCaptureCount(prev => prev + 1);
      showToast('success', `Captura ${captureCount + 1}/5 realizada con éxito`, {
        autoClose: 2000,
        style: {
          backgroundColor: '#10B981',
          color: 'white'
        }
      });

    } catch (error) {
      console.error('Error al capturar el descriptor facial:', error);
      showToast('error', 'Error al procesar el descriptor facial.', {
        autoClose: 3000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (formData) => {
    if (isSubmitting) return;

    if (capturedDescriptors.length < 5) {
      showToast('error', 'Por favor, capture 5 imágenes faciales.');
      return;
    }

    setIsSubmitting(true);
    showToast('info', 'Registrando empleado...', {
      autoClose: false,
      toastId: 'submit-loading'
    });

    try {
      const response = await axios.post('https://codeo.site/api-marcador/api/register', {
        ...formData,
        descriptors: capturedDescriptors.map((desc) => Array.from(desc)),
      });

      if (response.status === 201 || response.status === 200) {
        setCapturedDescriptors([]);
        setCaptureCount(0);
        toast.dismiss('submit-loading');

        showToast(
          'success',
          <div className="toast-content">
            <h3 className="toast-title">¡Registro Exitoso!</h3>
            <div className="toast-body">
              <p>{formData.nombre} ha sido registrado correctamente</p>
              <div className="info-section">
                <ul>
                  <li>✓ Ya puede comenzar a fichar</li>
                  <li>✓ Use su PIN y reconocimiento facial</li>
                  <li>✓ Respete los horarios establecidos</li>
                </ul>
              </div>
            </div>
          </div>,
          {
            autoClose: 8000,
            className: 'success-toast'
          }
        );
      }
    } catch (error) {
      toast.dismiss('submit-loading');
      showToast(
        'error',
        <div>
          <strong>Error en el registro</strong>
          <p>{error.response?.data?.message || 'Error al registrar el empleado'}</p>
        </div>,
        {
          autoClose: 5000,
        }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <>
      <div className="register-page-container">
        <div className="header-container">
          <h1 className="page-title">Registro de Empleados</h1>
          <Button color="light" onClick={handleGoBack} className="back-button">
            <HiArrowLeft className="mr-2 h-5 w-5" />
            Volver
          </Button>
        </div>

        <RegisterForm
          handleOpenModal={handleOpenModal}
          handleSubmit={handleSubmit}
          captureCount={captureCount}
          isSubmitting={isSubmitting}
        />

        <Modal
          show={isModalOpen}
          size="lg"
          onClose={handleCloseModal}
          className="facial-recognition-modal"
        >
          <Modal.Header>Reconocimiento Facial</Modal.Header>
          <Modal.Body>
            <div className="modal-content">
              <video
                ref={videoRef}
                autoPlay
                muted
                className="video-preview"
              />
              <p className="instructions">
                Por favor, mire directamente a la cámara y asegúrese de que su rostro esté bien iluminado.
              </p>
              <Button
                color={captureCount >= 5 ? "success" : "blue"}
                onClick={captureCount >= 5 ? handleCloseModal : handleCaptureDescriptor}
                disabled={isProcessing || !modelsLoaded}
                className="capture-button"
              >
                <HiOutlineCamera className="mr-2 h-5 w-5" />
                {!modelsLoaded ? 'Cargando modelos...' :
                  captureCount >= 5 ? "Cerrar y Continuar" :
                    (isProcessing ? 'Procesando...' : 'Capturar Rostro')}
              </Button>
              <p className="capture-count">
                Capturas realizadas: {captureCount} de 5
              </p>
              <Progress
                progress={(captureCount / 5) * 100}
                color="blue"
                size="lg"
                className="capture-progress"
              />
            </div>
          </Modal.Body>
        </Modal>
      </div>

      <ToastContainer
        position="top-center"
        autoClose={3000}
        limit={1}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick={true}
        rtl={false}
        pauseOnFocusLoss={false}
        draggable={false}
        pauseOnHover={true}
        theme="light"
      />
    </>
  );
};

export default RegisterPage;