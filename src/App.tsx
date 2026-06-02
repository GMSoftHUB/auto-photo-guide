import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RotateCcw, Check, ChevronLeft, ChevronRight, Info, Loader2, AlertCircle } from 'lucide-react';

interface CarAngle {
  id: string;
  name: string;
  description: string;
  iconImage: string;
  cameraOverlayImage: string;
  overlayPath?: string;
  matchThreshold: number;
}

const CAR_ANGLES: CarAngle[] = [
  {
    id: 'front',
    name: 'Frontal',
    description: 'Vista frontal completa',
    iconImage: '/overlays/front.png',
    cameraOverlayImage: '/overlays/front.png',
    overlayPath: '/overlays/front.png',
    matchThreshold: 65
  },
  {
    id: 'rear',
    name: 'Trasera',
    description: 'Vista trasera completa',
    iconImage: '/overlays/rear.png',
    cameraOverlayImage: '/overlays/rear.png',
    overlayPath: '/overlays/rear.png',
    matchThreshold: 65
  },
  {
    id: 'side-left',
    name: 'Lateral Izquierda',
    description: 'Vista lateral izquierda',
    iconImage: '/overlays/left.png',
    cameraOverlayImage: '/overlays/left.png',
    overlayPath: '/overlays/left.png',
    matchThreshold: 60
  },
  {
    id: 'side-right',
    name: 'Lateral Derecha',
    description: 'Vista lateral derecha',
    iconImage: '/overlays/right.png',
    cameraOverlayImage: '/overlays/right.png',
    overlayPath: '/overlays/right.png',
    matchThreshold: 60
  }
];

type CameraStatus = 'idle' | 'requesting' | 'starting' | 'active' | 'error';

export default function App() {
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [currentAngleIndex, setCurrentAngleIndex] = useState(0);
  const [isAligned, setIsAligned] = useState(false);
  const [matchScore, setMatchScore] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const [photos, setPhotos] = useState<{ angleId: string; timestamp: number }[]>([]);
  const [showInstructions, setShowInstructions] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const currentAngle = CAR_ANGLES[currentAngleIndex];

  const startCamera = useCallback(async () => {
    setCameraStatus('requesting');
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        },
        audio: false
      });

      streamRef.current = stream;
      setCameraStatus('starting');

      setTimeout(() => {
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().then(() => {
              setCameraStatus('active');
            }).catch(() => {
              setCameraStatus('active');
            });
          };
        }
      }, 100);

    } catch (err: unknown) {
      console.error('Camera error:', err);
      setCameraStatus('error');
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setCameraError('Permiso de cámara denegado. Por favor permite el acceso a la cámara.');
        } else if (err.name === 'NotFoundError') {
          setCameraError('No se encontró ninguna cámara. Verifica que tu dispositivo tenga una.');
        } else {
          setCameraError('No se pudo acceder a la cámara. Verifica los permisos.');
        }
      } else {
        setCameraError('Error desconocido al acceder a la cámara.');
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraStatus('idle');
    setIsAligned(false);
    setMatchScore(0);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  useEffect(() => {
    if (cameraStatus !== 'active' || !showOverlay) return;

    const interval = setInterval(() => {
      const score = Math.floor(Math.random() * 30) + 70;
      setMatchScore(score);
      setIsAligned(score >= currentAngle.matchThreshold);
    }, 500);

    return () => clearInterval(interval);
  }, [cameraStatus, showOverlay, currentAngle.matchThreshold]);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        setPhotos(prev => [...prev, {
          angleId: currentAngle.id,
          timestamp: Date.now()
        }]);
      }
    }
  };

  const goToAngle = (index: number) => {
    if (index >= 0 && index < CAR_ANGLES.length) {
      setCurrentAngleIndex(index);
      setIsAligned(false);
      setMatchScore(0);
    }
  };

  const resetProgress = () => {
    setPhotos([]);
    setIsAligned(false);
    setMatchScore(0);
  };

  const getProgress = () => {
    const completed = CAR_ANGLES.filter(angle =>
      photos.some(p => p.angleId === angle.id)
    ).length;
    return Math.round((completed / CAR_ANGLES.length) * 100);
  };

  const isCameraActive = cameraStatus === 'active' || cameraStatus === 'starting';

  // Brand palette: black, white, graphite grays and electric lime
  const limeGreen = '#B6FF00';
  const limeGreenDark = '#84CC16';

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-neutral-900 border-b border-neutral-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-lime-500 rounded-xl flex items-center justify-center">
                <Camera className="w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">Guía de Fotografía</h1>
                <p className="text-neutral-400 text-sm">Auto desde todos los ángulos</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-neutral-800 rounded-full px-4 py-2">
                <span className="text-white font-medium">{getProgress()}%</span>
                <span className="text-neutral-400 text-sm ml-1">completado</span>
              </div>
              <button
                onClick={() => setShowInstructions(true)}
                className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
              >
                <Info className="w-5 h-5 text-neutral-400" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Vehicle Plate */}
        <div className="mb-6 bg-neutral-900 border border-neutral-800 rounded-2xl p-5 mobile-landscape-compact">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-lime-500 rounded-xl flex items-center justify-center text-black font-bold">
              1
            </div>

            <div>
              <h2 className="text-white font-semibold text-lg">
                Ingresa la placa del vehículo
              </h2>
              <p className="text-neutral-400 text-sm">
                Escribe la placa antes de iniciar la toma de fotografías.
              </p>
            </div>
          </div>

          <input
            type="text"
            value={vehiclePlate}
            onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
            placeholder="Ej: ABC123"
            maxLength={8}
            className="w-full bg-black border border-neutral-700 rounded-xl px-4 py-4 text-white text-xl font-semibold tracking-widest uppercase outline-none focus:border-lime-500"
          />
        </div>

        {/* Angle Selector */}
        <div className="mb-6 mobile-landscape-compact">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-lg">2. Selecciona el ángulo</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToAngle(currentAngleIndex - 1)}
                disabled={currentAngleIndex === 0}
                className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <span className="text-white font-medium px-4">
                {currentAngleIndex + 1} / {CAR_ANGLES.length}
              </span>
              <button
                onClick={() => goToAngle(currentAngleIndex + 1)}
                disabled={currentAngleIndex === CAR_ANGLES.length - 1}
                className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {CAR_ANGLES.map((angle, index) => (
              <button
                key={angle.id}
                onClick={() => goToAngle(index)}
                className={`
                  relative p-2 rounded-xl transition-all duration-300 group
                  ${currentAngleIndex === index
                    ? 'bg-lime-500 ring-2 ring-lime-400'
                    : photos.some(p => p.angleId === angle.id)
                      ? 'bg-lime-600/50 ring-2 ring-lime-400'
                      : 'bg-neutral-800 hover:bg-neutral-700'
                  }
                `}
              >
                {photos.some(p => p.angleId === angle.id) && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-lime-400 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-black" />
                  </div>
                )}
                <div className="h-12 flex items-center justify-center mb-2">
                  <img
                    src={angle.iconImage}
                    alt={angle.name}
                    className={`
                      max-h-10 object-contain transition-all duration-300
                      ${currentAngleIndex === index ? 'opacity-100 scale-105' : 'opacity-70'}
                    `}
                  />
                </div>
                <span className="text-[10px] text-white/80 font-medium block truncate">
                  {angle.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Camera View */}
        <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-neutral-800 camera-landscape-friendly">
          {/* Video Container */}
          <div className="relative aspect-[16/9] bg-neutral-900">
            {!isCameraActive ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                {cameraStatus === 'idle' && (
                  <>
                    <div className="w-24 h-24 bg-lime-500 rounded-full flex items-center justify-center mb-6">
                      <Camera className="w-12 h-12 text-black" />
                    </div>

                    <h3 className="text-white text-xl font-semibold mb-2">
                      Activar Cámara
                    </h3>

                    <p className="text-neutral-400 text-center max-w-md mb-6">
                      Presiona el botón para activar la cámara y comenzar a capturar fotos de tu vehículo
                    </p>

                    <button
                      onClick={startCamera}
                      className="px-8 py-4 bg-lime-500 text-black font-semibold rounded-xl hover:bg-lime-400 transition-colors flex items-center gap-3"
                    >
                      <Camera className="w-5 h-5" />
                      Activar Cámara
                    </button>
                  </>
                )}

                {cameraStatus === 'requesting' && (
                  <>
                    <div className="w-24 h-24 bg-lime-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
                      <Loader2 className="w-12 h-12 text-black animate-spin" />
                    </div>

                    <h3 className="text-white text-xl font-semibold mb-2">
                      Solicitando Permiso
                    </h3>

                    <p className="text-neutral-400 text-center max-w-md">
                      Por favor permite el acceso a la cámara cuando el navegador lo solicite
                    </p>
                  </>
                )}

                {cameraStatus === 'error' && (
                  <>
                    <div className="w-24 h-24 bg-neutral-700 rounded-full flex items-center justify-center mb-6">
                      <AlertCircle className="w-12 h-12 text-white" />
                    </div>

                    <h3 className="text-white text-xl font-semibold mb-2">
                      Error de Cámara
                    </h3>

                    <p className="text-neutral-400 text-center max-w-md mb-6">
                      {cameraError || 'No se pudo acceder a la cámara'}
                    </p>

                    <button
                      onClick={startCamera}
                      className="px-8 py-4 bg-lime-500 text-black font-semibold rounded-xl hover:bg-lime-400 transition-colors flex items-center gap-3"
                    >
                      <Camera className="w-5 h-5" />
                      Reintentar
                    </button>
                  </>
                )}
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                <canvas
                  ref={canvasRef}
                  className="hidden"
                />

                {/* Overlay with lime green silhouette */}
                {showOverlay && (
                  <div className="absolute inset-0 pointer-events-none">
                    <img
                      src={currentAngle.cameraOverlayImage}
                      alt={currentAngle.name}
                      className={`
                        absolute left-1/2 top-1/2
                        -translate-x-1/2 -translate-y-1/2
                        w-[78%] md:w-[68%]
                        object-contain
                        transition-all duration-300
                        ${isAligned ? 'opacity-55 scale-100' : 'opacity-30 scale-[0.98]'}
                      `}
                      style={{ mixBlendMode: 'screen' }}
                    />
                  </div>
                )}

                {/* Alignment Status */}
                <div className="absolute top-4 right-4">
                  <div
                    className={`
                      px-4 py-2 rounded-full text-sm font-semibold
                      ${isAligned
                        ? 'bg-lime-500 text-black'
                        : 'bg-black/60 text-white border border-neutral-700'
                      }
                    `}
                  >
                    {isAligned ? 'Alineado' : 'Alinea el vehículo'}
                  </div>
                </div>

                {/* Instructions */}
                <div className="absolute bottom-4 left-4 right-4 angle-card-landscape-friendly">
                  <div className="bg-black/60 backdrop-blur-lg rounded-xl p-4 border border-neutral-700">
                    <h3 className="text-lime-400 font-semibold mb-1">
                      {currentAngle.name}
                    </h3>

                    <p className="text-neutral-300 text-sm">
                      {currentAngle.description}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Camera Controls */}
          {isCameraActive && (
            <div className="bg-neutral-900 p-4 border-t border-neutral-800 camera-controls-landscape-friendly">
              <div className="flex items-center justify-center gap-6 controls-row-landscape-friendly">
                <button
                  onClick={stopCamera}
                  className="p-3 rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors"
                >
                  <RotateCcw className="w-6 h-6 text-white" />
                </button>

                <button
                  onClick={takePhoto}
                  disabled={!isAligned}
                  className={`
                    w-20 h-20 rounded-full flex items-center justify-center transition-all border-4 capture-button-landscape-friendly
                    ${isAligned
                      ? 'bg-lime-500 border-lime-400 hover:bg-lime-400 hover:scale-105'
                      : 'bg-neutral-700 border-neutral-600 cursor-not-allowed opacity-50'
                    }
                  `}
                >
                  <div className="w-16 h-16 rounded-full bg-white/20" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Photo Gallery */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-lg">Fotos Capturadas</h2>
            <button
              onClick={resetProgress}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors border border-neutral-700"
            >
              Reiniciar
            </button>
          </div>

          {photos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {CAR_ANGLES.map((angle) => {
                const hasPhoto = photos.some(p => p.angleId === angle.id);
                return (
                  <div
                    key={angle.id}
                    className={`
                      relative aspect-square rounded-lg overflow-hidden
                      ${hasPhoto ? 'ring-2 ring-lime-400' : 'bg-neutral-800'}
                    `}
                  >
                    <div className="absolute inset-0 flex items-center justify-center bg-neutral-800">
                      <svg viewBox="0 0 460 300" className="w-full h-full opacity-40">
                        <path
                          d={angle.overlayPath}
                          fill="white"
                        />
                      </svg>
                    </div>
                    {hasPhoto && (
                      <div className="absolute inset-0 bg-lime-500/20 flex items-center justify-center">
                        <Check className="w-6 h-6 text-lime-400" />
                      </div>
                    )}
                    <span className="absolute bottom-1 left-1 right-1 text-[8px] text-white/70 text-center truncate">
                      {angle.name}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-neutral-900 rounded-xl p-8 text-center border border-neutral-800">
              <Camera className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
              <p className="text-neutral-400">Aún no has capturado ninguna foto</p>
              <p className="text-neutral-500 text-sm">Activa la cámara y comienza a fotografiar tu vehículo</p>
            </div>
          )}
        </div>

        {/* Tips Section */}
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <div className="bg-neutral-900 rounded-xl p-5 border border-neutral-700">
            <div className="w-10 h-10 bg-lime-500/20 rounded-lg flex items-center justify-center mb-3">
              <Camera className="w-5 h-5 text-lime-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Buena Iluminación</h3>
            <p className="text-neutral-400 text-sm">Asegúrate de fotografiar en un lugar bien iluminado, preferiblemente con luz natural.</p>
          </div>
          <div className="bg-neutral-900 rounded-xl p-5 border border-neutral-700">
            <div className="w-10 h-10 bg-lime-500/20 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-lime-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0 3-4.03 3-9s-1.343-9-3-9" />
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2">Distancia Uniforme</h3>
            <p className="text-neutral-400 text-sm">Mantén una distancia consistente del vehículo para todas las fotografías.</p>
          </div>
          <div className="bg-neutral-900 rounded-xl p-5 border border-neutral-700">
            <div className="w-10 h-10 bg-lime-500/20 rounded-lg flex items-center justify-center mb-3">
              <Check className="w-5 h-5 text-lime-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Fondo Limpio</h3>
            <p className="text-neutral-400 text-sm">Elige un fondo simple y limpio para mejor visibilidad del vehículo.</p>
          </div>
        </div>
      </main>

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 rounded-2xl max-w-lg w-full p-6 border border-neutral-700">
            <h2 className="text-white text-xl font-bold mb-4">Cómo Usar la App</h2>
            <div className="space-y-4 text-neutral-300">
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-lime-500 rounded-full flex items-center justify-center flex-shrink-0 text-black font-bold">1</div>
                <p>Selecciona un ángulo de la lista superior</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-lime-500 rounded-full flex items-center justify-center flex-shrink-0 text-black font-bold">2</div>
                <p>Activa la cámara y apúntala hacia el vehículo</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-lime-500 rounded-full flex items-center justify-center flex-shrink-0 text-black font-bold">3</div>
                <p>La silueta verde limón te indica dónde debe estar el auto</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-lime-500 rounded-full flex items-center justify-center flex-shrink-0 text-black font-bold">4</div>
                <p>Cuando la silueta brille más y el indicador muestre "Posición Correcta", presiona el botón de captura</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-lime-500 rounded-full flex items-center justify-center flex-shrink-0 text-black font-bold">5</div>
                <p>Repite para todos los ángulos hasta completar el 100%</p>
              </div>
            </div>
            <button
              onClick={() => setShowInstructions(false)}
              className="mt-6 w-full py-3 bg-lime-500 text-black font-semibold rounded-xl hover:bg-lime-400 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Hidden Canvas for Photo Capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}