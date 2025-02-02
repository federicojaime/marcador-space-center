import React, { useRef, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import * as faceapi from 'face-api.js';
import { Button, Card } from 'flowbite-react';
import { toast } from 'react-toastify';
import LoadingSpinner from './LoadingSpinner';
import 'react-toastify/dist/ReactToastify.css';
import { HiArrowLeft } from 'react-icons/hi';
import { format, setHours, setMinutes, setSeconds } from 'date-fns';

const Login = () => {
  const videoRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognizedEmployee, setRecognizedEmployee] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [action, setAction] = useState(null);
  const [employeeStatus, setEmployeeStatus] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [branchInfo, setBranchInfo] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeZone, setTimeZone] = useState('America/Costa_Rica');
  const [isIPhone, setIsIPhone] = useState(false);

  useEffect(() => {
    // Detectar si es un iPhone
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIPhone(/iphone/.test(userAgent));

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

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [timeZone]);

  const startVideo = () => {
    const constraints = isIPhone
      ? { video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } }
      : { video: {} };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          if (isIPhone) {
            videoRef.current.play();
          }
        }
      })
      .catch((err) => {
        console.error('Error al acceder a la cámara:', err);
        toast.error('Error al acceder a la cámara. Asegúrate de dar permisos.');
      });
  };

  const formatTime = (date) => {
    return format(date, 'HH:mm:ss a');
  };

  const isBonusAvailable = () => {
    const now = new Date();
    const bonusCutoffTime = setHours(setMinutes(setSeconds(now, 0), 45), 9);
    return now <= bonusCutoffTime;
  };

  const getAvailableActions = () => {
    if (!employeeStatus) return [];

    const actions = [];

    if (!employeeStatus.checkedIn) {
      if (isBonusAvailable() && !employeeStatus.bonusCheckedIn) {
        actions.push({ label: 'Ingreso con Bono', action: 'bonus_check_in' });
      }
      actions.push({ label: 'Ingreso jornada', action: 'check_in' });
    } else if (!employeeStatus.checkedOut) {
      if (!employeeStatus.lunchStarted) {
        actions.push({ label: 'Ingreso almuerzo', action: 'lunch_start' });
      } else if (employeeStatus.lunchStarted && !employeeStatus.lunchEnded) {
        actions.push({ label: 'Salida almuerzo', action: 'lunch_end' });
      }

      /*if (employeeStatus.available101Count > 0) {
        if (!employeeStatus._101Started || (employeeStatus._101Ended && !employeeStatus._101_2Started)) {
          actions.push({ label: `Ingreso 101 (${employeeStatus.available101Count} disponible${employeeStatus.available101Count > 1 ? 's' : ''})`, action: 'start_101' });
        } else if ((employeeStatus._101Started && !employeeStatus._101Ended) || (employeeStatus._101_2Started && !employeeStatus._101_2Ended)) {
          actions.push({ label: 'Salida 101', action: 'end_101' });
        }
      }*/

      if (!employeeStatus.overtimeStarted) {
        actions.push({ label: 'Ingreso hora extra', action: 'overtime_start' });
      } else if (employeeStatus.overtimeStarted && !employeeStatus.overtimeEnded) {
        actions.push({ label: 'Salida hora extra', action: 'overtime_end' });
      }

      const lunchInProgress = employeeStatus.lunchStarted && !employeeStatus.lunchEnded;

      if (!lunchInProgress) {
        actions.push({ label: 'Salida jornada', action: 'check_out' });
      }
    }

    return actions;
  };

  const handleFaceRecognition = useCallback(async () => {
    setIsProcessing(true);

    try {
      if (isIPhone && videoRef.current.readyState !== 4) {
        await new Promise((resolve) => {
          videoRef.current.onloadeddata = resolve;
        });
      }

      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        toast.error('No se detectó ningún rostro. Por favor, inténtelo de nuevo.');
        setIsProcessing(false);
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
        setIsProcessing(false);
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

        const statusResponse = await axios.get(`https://codeo.site/api-marcador/api/employee-status/${matchedEmployee.id}`);
        setEmployeeStatus(statusResponse.data);

        const branchResponse = await axios.get(`https://codeo.site/api-marcador/api/employee-branch/${matchedEmployee.id}`);
        setBranchInfo(branchResponse.data);

        if (branchResponse.data.nombre === 'Space center OS') {
          setTimeZone('America/New_York');
        } else {
          setTimeZone('America/Costa_Rica');
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            console.error('Error al obtener la ubicación:', error);
            toast.error('No se pudo obtener tu ubicación. Por favor, activa la geolocalización.');
          }
        );

        if (statusResponse.data.checkedOut) {
          toast.success(`Bienvenido ${bestMatch.label}, has finalizado tu jornada con éxito.`);
        } else {
          toast.success(`Bienvenido ${bestMatch.label}, por favor seleccione una acción.`);
        }

        if (statusResponse.data.available101Count === 0) {
          toast.info('Ya has completado los dos 101 disponibles para hoy.');
        }
      } else {
        toast.error('No se ha reconocido su rostro. Por favor, intente de nuevo.');
        setRecognizedEmployee(null);
        setEmployeeStatus(null);
      }
    } catch (error) {
      console.error('Error durante el reconocimiento facial:', error);
      toast.error('Error al procesar el reconocimiento facial.');
    } finally {
      setIsProcessing(false);
    }
  }, [isIPhone]);

  const handleActionClick = (selectedAction) => {
    setAction(selectedAction);
  };

  const handleCheckInOut = useCallback(async () => {
    if (!pinInput) {
      toast.error('El PIN es obligatorio.');
      return;
    }

    if (!recognizedEmployee) {
      toast.error('Debe haber un empleado reconocido antes de realizar una acción.');
      return;
    }

    if (!userLocation) {
      toast.error('No se pudo obtener tu ubicación. Por favor, activa la geolocalización.');
      return;
    }

    setIsProcessing(true);

    try {
      const endpoint = `https://codeo.site/api-marcador/api/${action}`;
      console.log('Endpoint:', endpoint);

      const response = await axios.post(endpoint, {
        pin: pinInput,
        descriptor: Array.from(recognizedEmployee.descriptor),
        employee_id: recognizedEmployee.id,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude
      });

      toast.success(response.data.message);

      const statusResponse = await axios.get(`https://codeo.site/api-marcador/api/employee-status/${recognizedEmployee.id}`);
      setEmployeeStatus(statusResponse.data);

      if (action === 'check_out') {
        setRecognizedEmployee(null);
        setEmployeeStatus(null);
      }

      setPinInput('');
      setAction(null);
    } catch (error) {
      console.error(`Error al registrar ${action}:`, error);
      if (error.response) {
        toast.error(`Error al registrar ${action}: ${error.response.data.message}`);
      } else {
        toast.error(`Error al registrar ${action}: ${error.message}`);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [action, pinInput, recognizedEmployee, userLocation]);

  const handleBack = () => {
    if (action) {
      setAction(null);
      setPinInput('');
    } else if (recognizedEmployee) {
      setRecognizedEmployee(null);
      setEmployeeStatus(null);
      setBranchInfo(null);
    }
  };

  return (
    <Card className="max-w-sm mx-auto">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Fichaje de Empleados</h2>

      {modelsLoaded ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline={isIPhone}
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
              {branchInfo && (
                <p className="text-center text-md">
                  Sucursal: {branchInfo.nombre}
                </p>
              )}
              <p className="text-center text-md">
                Hora actual: {formatTime(currentTime)}
              </p>
              {employeeStatus && employeeStatus.checkedOut ? (
                <p className="text-center text-md">
                  Ya has finalizado tu jornada. No es necesario realizar más acciones hoy.
                </p>
              ) : !action ? (
                <div className="w-full">
                  <div className="relative">
                    <select
                      value={action}
                      onChange={(e) => {
                        handleActionClick(e.target.value);
                        if (e.target.value) {
                          toast.info(`Hora de fichaje: ${formatTime(new Date())}`, {
                            autoClose: 3000,
                          });
                        }
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                    >
                      <option value="">Seleccione una acción</option>
                      {getAvailableActions().map((btn) => (
                        <option key={btn.action} value={btn.action}>
                          {btn.label}
                        </option>
                      ))}
                    </select>
                  </div>
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
                    Confirmar {getAvailableActions().find(btn => btn.action === action)?.label}
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

    </Card>
  );
};

export default Login;