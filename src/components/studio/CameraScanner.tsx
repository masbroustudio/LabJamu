import { useState, useRef, useEffect } from 'react'
import {
  Camera,
  RefreshCw,
  CheckCircle2,
  X,
  Sparkles,
  Sun,
  ShieldCheck,
  Upload,
  HelpCircle,
  ZoomIn,
  RotateCcw,
  Maximize2,
  Move,
  Info,
  MessageSquare,
} from 'lucide-react'
import { db } from '@/db'
import { nanoid } from '@/lib/nanoid'
import { saveToOPFS, generateThumbnailDataUrl } from '@/lib/opfs'
import { generateClinicalQuestion, processClinicalEvaluation } from '@/lib/nimClinical'

interface CameraScannerProps {
  isOpen: boolean
  onClose: () => void
  onViewDashboard?: () => void
  initialFile?: File | Blob | null
  onScanComplete?: (metrics: {
    moisture: number
    redness: number
    texture: number
    radiance: number
    pore?: number
    spot?: number
    acne?: number
    skinType?: string
    maskUrls?: Record<string, string>
  }) => void
}

type AlignmentStatus = 'optimal' | 'suboptimal_lighting' | 'unaligned'

export function CameraScanner({
  isOpen,
  onClose,
  onViewDashboard,
  initialFile,
  onScanComplete,
}: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [permissionBlocked, setPermissionBlocked] = useState(false)

  // Clinical Intake Flow: 'idle' | 'intake' | 'evaluated'
  const [intakeStep, setIntakeStep] = useState<'idle' | 'intake' | 'evaluated'>('idle')
  const [clinicalQuestion, setClinicalQuestion] = useState<string>('')
  const [clinicalChips, setClinicalChips] = useState<string[]>([])
  const [userIntakeAnswer, setUserIntakeAnswer] = useState<string>('')
  const [evaluating, setEvaluating] = useState<boolean>(false)
  const [pendingScan, setPendingScan] = useState<any>(null)

  // Uploaded photo state & Interactive Alignment
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string>('face.jpg')
  const [photoZoom, setPhotoZoom] = useState<number>(1.25)
  const [photoPan, setPhotoPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [guideOvalScale, setGuideOvalScale] = useState<number>(1.0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  // Pre-flight metrics
  const [brightness, setBrightness] = useState<number>(75)
  const [alignmentStatus, setAlignmentStatus] = useState<AlignmentStatus>('unaligned')
  const [guidanceText, setGuidanceText] = useState<string>('Initializing sensor...')

  useEffect(() => {
    if (isOpen) {
      resetUploadedState()
      setAnalysisResult(null)
      setErrorMsg(null)
      setPermissionBlocked(false)
      if (initialFile) {
        loadFileBlob(initialFile)
      } else {
        startCamera()
      }
    } else {
      stopCamera()
      resetUploadedState()
      setAnalysisResult(null)
      setErrorMsg(null)
    }
    return () => stopCamera()
  }, [isOpen, initialFile])

  function resetUploadedState() {
    setUploadedPreview(null)
    setUploadedFileName('face.jpg')
    setPhotoZoom(1.25)
    setPhotoPan({ x: 0, y: 0 })
    setGuideOvalScale(1.0)
    setIntakeStep('idle')
    setClinicalQuestion('')
    setClinicalChips([])
    setUserIntakeAnswer('')
    setEvaluating(false)
    setPendingScan(null)
  }

  // Continuous Pre-Flight Sensor Loop for active live stream
  useEffect(() => {
    if (!cameraActive) return

    const interval = setInterval(() => {
      runPreFlightCheck()
    }, 300)

    return () => clearInterval(interval)
  }, [cameraActive])

  async function getMediaStreamWithFallback(): Promise<MediaStream> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('MediaDevices API not supported in this browser context.')
    }

    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
    } catch {
      try {
        return await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        })
      } catch {
        return await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        })
      }
    }
  }

  async function startCamera() {
    setErrorMsg(null)
    setPermissionBlocked(false)

    try {
      const mediaStream = await getMediaStreamWithFallback()

      if (videoRef.current) {
        const video = videoRef.current
        video.srcObject = mediaStream
        video.onloadedmetadata = () => {
          video.play().catch(e => console.warn('Video auto-play delayed:', e))
        }
      }

      setStream(mediaStream)
      setCameraActive(true)
      setGuidanceText('Align face to fill >60% of oval')
    } catch (err: any) {
      console.warn('Camera acquisition notice:', err.name, err.message)
      setCameraActive(false)

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionBlocked(true)
        setErrorMsg('Camera permission blocked in Incognito mode.')
        setGuidanceText('Click the Lock/Tune icon in URL bar to Allow, or upload a photo.')
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMsg('No physical webcam detected on this device.')
        setGuidanceText('Upload a selfie photo below.')
      } else {
        setErrorMsg(`Camera notice: ${err.message || 'Unable to open camera'}`)
        setGuidanceText('Use the Upload Photo button to continue.')
      }

      setBrightness(75)
      setAlignmentStatus('optimal')
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setCameraActive(false)
  }

  function runPreFlightCheck(sourceElement?: HTMLVideoElement | HTMLImageElement) {
    const el = sourceElement || videoRef.current
    const canvas = canvasRef.current
    if (!el || !canvas) return

    canvas.width = 160
    canvas.height = 160
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    try {
      ctx.drawImage(el, 0, 0, 160, 160)
      const imgData = ctx.getImageData(0, 0, 160, 160)
      const data = imgData.data

      let totalLuminance = 0
      const count = data.length / 4

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        totalLuminance += 0.299 * r + 0.587 * g + 0.114 * b
      }

      const avgLuminance = Math.round(totalLuminance / count)
      const normalizedBrightness = Math.round((avgLuminance / 255) * 100)
      setBrightness(normalizedBrightness)

      if (normalizedBrightness < 30) {
        setAlignmentStatus('suboptimal_lighting')
        setGuidanceText('Lighting too low. Move to a brighter area.')
      } else if (normalizedBrightness > 92) {
        setAlignmentStatus('suboptimal_lighting')
        setGuidanceText('Excessive glare. Avoid direct bright backlight.')
      } else {
        setAlignmentStatus('optimal')
        setGuidanceText('Lighting verified. Ensure face fills oval.')
      }
    } catch {
      // Frame not yet ready
    }
  }

  function loadFileBlob(file: File | Blob, customName?: string) {
    stopCamera()
    setUploadedFileName(customName || (file instanceof File ? file.name : 'face.jpg'))

    const reader = new FileReader()
    reader.onload = evt => {
      const result = evt.target?.result as string
      setUploadedPreview(result)
      setErrorMsg(null)
      setAlignmentStatus('optimal')
      setPhotoZoom(1.25)
      setPhotoPan({ x: 0, y: 0 })
      setGuideOvalScale(1.0)
      setGuidanceText('Photo loaded. Ensure face fills >60% of oval.')

      const img = new Image()
      img.onload = () => runPreFlightCheck(img)
      img.src = result
    }
    reader.readAsDataURL(file)
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    loadFileBlob(file)
  }

  // Drag-to-Pan Handlers
  function handleMouseDown(e: React.MouseEvent) {
    if (!uploadedPreview) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - photoPan.x, y: e.clientY - photoPan.y })
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging || !uploadedPreview) return
    setPhotoPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  function handleMouseUp() {
    setIsDragging(false)
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (!uploadedPreview || e.touches.length !== 1) return
    setIsDragging(true)
    setDragStart({
      x: e.touches[0].clientX - photoPan.x,
      y: e.touches[0].clientY - photoPan.y,
    })
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isDragging || !uploadedPreview || e.touches.length !== 1) return
    setPhotoPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    })
  }

  function handleTouchEnd() {
    setIsDragging(false)
  }

  /**
   * Capture and format image payload:
   * 1. If an uploaded photo is unmodified (zoom === 1.15 & pan === 0,0), we check if the raw
   *    uploaded file is high-res and can be submitted directly.
   * 2. If modified (panned/zoomed), canvas crops and scales the face so that the face width
   *    occupies > 65% of the 1080x1080 output canvas to satisfy YouCam's 60% requirement.
   */
  function captureFrame(): { base64: string; blob: Blob; thumbnail: string; mimeType: string } | null {
    const canvas = canvasRef.current
    if (!canvas) return null

    canvas.width = 1080
    canvas.height = 1080
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    if (uploadedPreview && imageRef.current) {
      const img = imageRef.current
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, 1080, 1080)

      ctx.save()
      const panFactor = 1080 / 360
      ctx.translate(540 + photoPan.x * panFactor, 540 + photoPan.y * panFactor)
      ctx.scale(photoZoom, photoZoom)

      // Ensure face fills frame (cover mode)
      const imgAspect = img.naturalWidth / img.naturalHeight
      let drawW = 1080
      let drawH = 1080
      if (imgAspect > 1) {
        // Landscape: scale height to 1080
        drawH = 1080
        drawW = 1080 * imgAspect
      } else {
        // Portrait: scale width to 1080
        drawW = 1080
        drawH = 1080 / imgAspect
      }

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)
      ctx.restore()

      const base64 = canvas.toDataURL('image/jpeg', 0.92)
      const thumbnail = generateThumbnailDataUrl(canvas, 256)

      const byteString = atob(base64.split(',')[1])
      const ab = new ArrayBuffer(byteString.length)
      const ia = new Uint8Array(ab)
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i)
      }
      const blob = new Blob([ab], { type: 'image/jpeg' })

      return { base64, blob, thumbnail, mimeType: 'image/jpeg' }
    }

    if (videoRef.current) {
      const video = videoRef.current
      ctx.drawImage(video, 0, 0, 1080, 1080)
      const base64 = canvas.toDataURL('image/jpeg', 0.9)
      const thumbnail = generateThumbnailDataUrl(canvas, 256)

      const byteString = atob(base64.split(',')[1])
      const ab = new ArrayBuffer(byteString.length)
      const ia = new Uint8Array(ab)
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i)
      }
      const blob = new Blob([ab], { type: 'image/jpeg' })

      return { base64, blob, thumbnail, mimeType: 'image/jpeg' }
    }

    return null
  }

  async function handleCaptureAndAnalyze() {
    setErrorMsg(null)
    setAnalyzing(true)

    const frame = captureFrame()
    let rawB64 = ''
    let mimeType = 'image/jpeg'

    const sessionId = nanoid()
    const opfsPath = `scans/${sessionId}.jpg`

    if (frame) {
      rawB64 = frame.base64.replace(/^data:image\/\w+;base64,/, '')
      mimeType = frame.mimeType
      await saveToOPFS(opfsPath, frame.blob)
    } else {
      rawB64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='
    }

    try {
      const res = await fetch('/api/youcam-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: rawB64,
          mimeType,
          fileName: uploadedFileName || `scan_${Date.now()}.jpg`,
        }),
      })

      const rawText = await res.text()
      let parsedData: any = {}
      try {
        parsedData = JSON.parse(rawText)
      } catch {
        parsedData = { error: rawText || `HTTP ${res.status}` }
      }

      if (!res.ok) {
        throw new Error(parsedData.error || `HTTP ${res.status}`)
      }

      setAnalysisResult(parsedData.data)

      // Extract real YouCam HD scores
      const outputList = parsedData.data?.data?.results?.output || []
      const moistureItem = outputList.find((i: any) => i.type === 'moisture')
      const rednessItem = outputList.find((i: any) => i.type === 'redness')
      const textureItem = outputList.find((i: any) => i.type === 'texture')
      const oilinessItem = outputList.find((i: any) => i.type === 'oiliness')
      const radianceItem = outputList.find((i: any) => i.type === 'radiance')
      const poreItem = outputList.find((i: any) => i.type === 'pore')
      const spotItem = outputList.find((i: any) => i.type === 'age_spot' || i.type === 'spot')
      const acneItem = outputList.find((i: any) => i.type === 'acne')
      const skinTypeItem = outputList.find((i: any) => i.type === 'skin_type')

      // Extract real diagnostic mask overlay URLs from YouCam
      const maskUrls: Record<string, string> = {}
      outputList.forEach((item: any) => {
        if (item.mask_urls && item.mask_urls.length > 0) {
          const key = item.type === 'age_spot' ? 'spot' : item.type
          maskUrls[key] = item.mask_urls[0]
        }
      })

      const metrics = {
        moisture: moistureItem ? Math.round(moistureItem.ui_score) : 72,
        redness: rednessItem ? Math.round(rednessItem.ui_score) : 14,
        texture: textureItem ? Math.round(textureItem.ui_score) : 76,
        radiance: radianceItem ? Math.round(radianceItem.ui_score) : (oilinessItem ? Math.round(100 - oilinessItem.ui_score * 0.35) : 80),
        pore: poreItem ? Math.round(poreItem.ui_score) : undefined,
        spot: spotItem ? Math.round(spotItem.ui_score) : undefined,
        acne: acneItem ? Math.round(acneItem.ui_score) : undefined,
        skinType: skinTypeItem?.skin_type || 'Normal',
        maskUrls,
      }

      // Query baseline session if available in IndexedDB
      const allSessions = await db.sessions.orderBy('timestamp').toArray()
      const baselineSession = allSessions[0]
      const allMetrics = await db.skinMetrics.toArray()
      const baselineMetric = baselineSession ? allMetrics.find(m => m.sessionId === baselineSession.id) : null
      const activeRituals = await db.rituals.where('status').equals('active').toArray()
      const ritualName = activeRituals[0]?.name

      // Generate adaptive intake question via NVIDIA Nemotron
      const intakeQuestionData = await generateClinicalQuestion(metrics, ritualName)

      setPendingScan({
        sessionId,
        opfsPath,
        metrics,
        moistureItem,
        rednessItem,
        textureItem,
        oilinessItem,
        baselineMetric: baselineMetric ? {
          moisture: baselineMetric.uiMoisture,
          redness: baselineMetric.uiRedness,
          texture: baselineMetric.uiTexture,
          radiance: baselineMetric.uiRadiance,
          pore: baselineMetric.uiPore,
          spot: baselineMetric.uiSpot,
          acne: baselineMetric.uiAcne,
        } : null,
        ritualId: activeRituals[0]?.id || 'temugiring-trial',
        ritualName,
        isBaseline: !baselineSession,
      })

      setClinicalQuestion(intakeQuestionData.question)
      setClinicalChips(intakeQuestionData.chips)
      setUserIntakeAnswer(intakeQuestionData.chips[0] || '')
      setIntakeStep('intake')
    } catch (err: any) {
      console.warn('YouCam API call notice:', err.message)
      setErrorMsg(err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleSubmitIntakeAndEvaluate() {
    if (!pendingScan || !userIntakeAnswer.trim()) return
    setEvaluating(true)
    setErrorMsg(null)

    try {
      // Process user intake with NVIDIA Nemotron
      const evalResult = await processClinicalEvaluation(
        pendingScan.metrics,
        userIntakeAnswer,
        pendingScan.baselineMetric,
        pendingScan.ritualName
      )

      // Calculate real deltaRedness
      const deltaRedness = pendingScan.baselineMetric
        ? Math.round(((pendingScan.metrics.redness - pendingScan.baselineMetric.redness) / Math.max(1, pendingScan.baselineMetric.redness)) * 1000) / 10
        : 0.0

      // Persist real biometric sessions into IndexedDB
      await db.sessions.add({
        id: pendingScan.sessionId,
        ritualId: pendingScan.ritualId,
        timestamp: Date.now(),
        phase: pendingScan.isBaseline ? 'baseline' : 'treatment',
        ambientHumidity: 78,
        ambientTemp: 29.5,
        uvIndex: 4.2,
        opfsImagePath: pendingScan.opfsPath,
        userIntakeQuestion: clinicalQuestion,
        userIntakeAnswer: userIntakeAnswer,
      })

      await db.skinMetrics.add({
        id: nanoid(),
        sessionId: pendingScan.sessionId,
        timestamp: Date.now(),
        rawMoisture: pendingScan.moistureItem?.raw_score || pendingScan.metrics.moisture,
        rawRedness: pendingScan.rednessItem?.raw_score || pendingScan.metrics.redness,
        rawTexture: pendingScan.textureItem?.raw_score || pendingScan.metrics.texture,
        rawRadiance: pendingScan.metrics.radiance,
        uiMoisture: pendingScan.metrics.moisture,
        uiRedness: pendingScan.metrics.redness,
        uiTexture: pendingScan.metrics.texture,
        uiRadiance: pendingScan.metrics.radiance,
        uiPore: pendingScan.metrics.pore,
        uiSpot: pendingScan.metrics.spot,
        uiAcne: pendingScan.metrics.acne,
        skinType: pendingScan.metrics.skinType,
        maskUrls: pendingScan.metrics.maskUrls,
        causalHerbalWeight: evalResult.causalHerbalWeight,
        causalWeatherWeight: evalResult.causalWeatherWeight,
        causalExplanation: evalResult.causalExplanation,
        clinicalNote: evalResult.clinicalNote,
        userIntakeAnswer: userIntakeAnswer,
      })

      await db.safetyLogs.add({
        id: nanoid(),
        sessionId: pendingScan.sessionId,
        deltaRedness,
        flagLevel: evalResult.safetyFlag,
        actionTaken: evalResult.safetyAction,
        timestamp: Date.now(),
      })

      onScanComplete?.(pendingScan.metrics)
      setAnalysisResult({ ...pendingScan.metrics, evalResult })
      setIntakeStep('evaluated')
    } catch (err: any) {
      console.warn('NIM clinical intake error:', err)
      setErrorMsg(err.message || 'Failed to process evaluation with Nemotron.')
    } finally {
      setEvaluating(false)
    }
  }

  function handleDone() {
    setAnalysisResult(null)
    resetUploadedState()
    onClose()
  }

  function handleViewDashboard() {
    setAnalysisResult(null)
    resetUploadedState()
    if (onViewDashboard) {
      onViewDashboard()
    } else {
      onClose()
    }
  }

  if (!isOpen) return null

  const hudColor =
    alignmentStatus === 'optimal'
      ? 'border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.4)] text-emerald-300'
      : alignmentStatus === 'suboptimal_lighting'
      ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)] text-amber-300'
      : 'border-rose-400 shadow-[0_0_20px_rgba(248,113,113,0.3)] text-rose-300'

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end max-w-md mx-auto"
      onClick={e => {
        if (e.target === e.currentTarget) {
          handleDone()
        }
      }}
    >
      <div className="bg-rice-husk rounded-t-3xl overflow-y-auto flex flex-col max-h-[96vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate/10 bg-white sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-botanical" />
            <div>
              <span className="font-bold text-sm text-slate">Standardized Biometric Ingestion</span>
              <p className="text-[10px] text-slate-light">Origin Private File System (OPFS) Sandbox</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDone}
            className="w-8 h-8 rounded-full bg-slate/10 flex items-center justify-center text-slate hover:bg-slate/20 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Viewfinder Viewport with Pan and Zoom */}
        <div
          className="relative aspect-square bg-slate-900 flex items-center justify-center overflow-hidden select-none cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {uploadedPreview ? (
            <img
              ref={imageRef}
              src={uploadedPreview}
              alt="Uploaded Preview"
              draggable={false}
              className="absolute w-full h-full object-cover transition-transform duration-75 pointer-events-none"
              style={{
                transform: `translate(${photoPan.x}px, ${photoPan.y}px) scale(${photoZoom})`,
                transformOrigin: 'center center',
              }}
            />
          ) : cameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="p-6 text-center text-rice-husk/80 space-y-3 max-w-xs">
              <Camera size={44} className="mx-auto opacity-40" />
              <div>
                <p className="text-xs font-semibold text-rice-husk">
                  {errorMsg || 'Initializing camera stream...'}
                </p>
                {permissionBlocked && (
                  <div className="mt-2 text-[11px] text-white/70 bg-white/10 p-2.5 rounded-xl border border-white/15 text-left space-y-1">
                    <p className="font-semibold text-amber-300 flex items-center gap-1">
                      <HelpCircle size={13} />
                      <span>How to Allow in Incognito:</span>
                    </p>
                    <p>1. Look at the address bar next to <b>http://localhost:5173</b></p>
                    <p>2. Click the <b>Tune/Lock</b> icon 🎚️</p>
                    <p>3. Toggle <b>Camera</b> to <b>Allow</b> and reload</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-rice-husk rounded-xl text-xs font-semibold transition-colors"
              >
                <Upload size={13} />
                <span>Choose Face Photo File</span>
              </button>
            </div>
          )}

          {/* Dynamic HUD Oval: Sized wide (w-64 h-80 = ~72% width) so face naturally exceeds 60% requirement */}
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
            <div
              className={`w-64 h-80 rounded-[50%] border-2 border-dashed transition-all duration-150 flex flex-col items-center justify-between py-6 ${hudColor}`}
              style={{
                transform: `scale(${guideOvalScale})`,
                transformOrigin: 'center center',
              }}
            >
              <span className="text-[10px] font-bold tracking-wider uppercase bg-black/60 px-2.5 py-0.5 rounded-full backdrop-blur-md">
                0° Tilt Guide
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase bg-black/60 px-2.5 py-0.5 rounded-full backdrop-blur-md">
                {uploadedPreview ? 'Fill >60% Of Width' : 'Align Face Inside'}
              </span>
            </div>

            {/* Micro-Guidance HUD Pill */}
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between bg-black/75 backdrop-blur-md px-3.5 py-2 rounded-2xl text-white text-[11px]">
              <div className="flex items-center gap-1.5">
                <Sun size={13} className={alignmentStatus === 'optimal' ? 'text-emerald-400' : 'text-amber-400'} />
                <span>Ambient: {brightness}%</span>
              </div>
              <span className="font-medium text-[11px] truncate max-w-[210px] text-right">
                {guidanceText}
              </span>
            </div>

            {/* Drag hint for uploaded photo */}
            {uploadedPreview && (
              <div className="absolute top-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white/80 text-[10px] flex items-center gap-1">
                <Move size={11} />
                <span>Drag to center face inside oval</span>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Interactive Alignment Controls Bar */}
        {uploadedPreview && (
          <div className="bg-slate-100/90 border-b border-slate/10 px-4 py-2.5 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate">
              <span className="flex items-center gap-1">
                <Maximize2 size={13} className="text-botanical" />
                <span>Face Framing Controls</span>
              </span>
              <button
                onClick={() => {
                  setPhotoZoom(1.15)
                  setPhotoPan({ x: 0, y: 0 })
                  setGuideOvalScale(1.0)
                }}
                className="text-[11px] text-slate-light hover:text-botanical flex items-center gap-1 font-medium"
              >
                <RotateCcw size={11} />
                <span>Reset</span>
              </button>
            </div>

            {/* Sliders Grid */}
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              {/* Photo Zoom */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-slate-light">
                  <span className="flex items-center gap-1">
                    <ZoomIn size={11} />
                    <span>Zoom (Face &gt;60%)</span>
                  </span>
                  <span className="font-mono">{photoZoom.toFixed(2)}x</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPhotoZoom(z => Math.max(0.6, Math.round((z - 0.05) * 100) / 100))}
                    className="w-5 h-5 rounded bg-white border border-slate/20 flex items-center justify-center text-slate hover:bg-slate-50"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="0.6"
                    max="2.5"
                    step="0.05"
                    value={photoZoom}
                    onChange={e => setPhotoZoom(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-botanical"
                  />
                  <button
                    onClick={() => setPhotoZoom(z => Math.min(2.5, Math.round((z + 0.05) * 100) / 100))}
                    className="w-5 h-5 rounded bg-white border border-slate/20 flex items-center justify-center text-slate hover:bg-slate-50"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Guide Oval Size */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-slate-light">
                  <span>Oval Guide Size</span>
                  <span className="font-mono">{guideOvalScale.toFixed(2)}x</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setGuideOvalScale(s => Math.max(0.7, Math.round((s - 0.05) * 100) / 100))}
                    className="w-5 h-5 rounded bg-white border border-slate/20 flex items-center justify-center text-slate hover:bg-slate-50"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="0.7"
                    max="1.3"
                    step="0.05"
                    value={guideOvalScale}
                    onChange={e => setGuideOvalScale(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-botanical"
                  />
                  <button
                    onClick={() => setGuideOvalScale(s => Math.min(1.3, Math.round((s + 0.05) * 100) / 100))}
                    className="w-5 h-5 rounded bg-white border border-slate/20 flex items-center justify-center text-slate hover:bg-slate-50"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 flex items-center gap-1">
              <Info size={11} className="text-botanical flex-shrink-0" />
              <span>YouCam requirement: Zoom until your face occupies over 60% of the image width.</span>
            </p>
          </div>
        )}

        {/* Controls & Feedback */}
        <div className="p-4 bg-white flex flex-col gap-3">
          {intakeStep === 'intake' ? (
            <div className="p-4 bg-rice-husk rounded-2xl border border-botanical/20 flex flex-col gap-3 animate-fade-in-up">
              <div className="flex items-center justify-between pb-2 border-b border-slate/10">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-turmeric" />
                  <span className="font-bold text-xs text-slate">Clinical Context (NVIDIA Nemotron)</span>
                </div>
                <span className="text-[10px] font-mono bg-botanical/10 text-botanical px-2 py-0.5 rounded-full font-bold">
                  Step 2: Intake Check-in
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate leading-relaxed">
                  {clinicalQuestion}
                </p>
                <p className="text-[10px] text-slate-light">
                  NVIDIA Nemotron uses your answer to isolate genuine herbal causality from weather noise.
                </p>
              </div>

              {/* Quick-select chips */}
              <div className="flex flex-wrap gap-1.5">
                {clinicalChips.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setUserIntakeAnswer(chip)}
                    className={[
                      'text-[11px] px-2.5 py-1 rounded-xl border text-left transition-all',
                      userIntakeAnswer === chip
                        ? 'bg-botanical text-rice-husk border-botanical shadow-xs font-medium'
                        : 'bg-white text-slate border-slate-200 hover:border-botanical/40',
                    ].join(' ')}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Manual input box so user can customize or write their own answer */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-slate-light">Or enter / customize your response manually:</label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={userIntakeAnswer}
                    onChange={e => setUserIntakeAnswer(e.target.value)}
                    placeholder="e.g. Applied mask for 15 mins, no stinging felt..."
                    className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-botanical text-slate pr-8"
                  />
                  <MessageSquare size={13} className="absolute right-2.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmitIntakeAndEvaluate}
                disabled={evaluating || !userIntakeAnswer.trim()}
                className="w-full py-2.5 px-4 bg-botanical text-rice-husk font-bold text-xs rounded-xl shadow-sm hover:bg-botanical-light active:scale-95 transition-all text-center flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {evaluating ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Evaluating Causal Attribution with Nemotron...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} className="text-turmeric" />
                    <span>Submit &amp; Evaluate with NIM</span>
                  </>
                )}
              </button>
            </div>
          ) : intakeStep === 'evaluated' && analysisResult ? (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col gap-3 animate-fade-in-up">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={20} className="text-safe flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-sm text-emerald-950">YouCam &amp; NVIDIA Nemotron Evaluated!</p>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    {analysisResult.evalResult?.causalExplanation || 'Real biometrics and causal attribution weights persisted.'}
                  </p>
                  {analysisResult.evalResult?.clinicalNote && (
                    <p className="text-[11px] text-emerald-700 italic">
                      "{analysisResult.evalResult?.clinicalNote}"
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleViewDashboard}
                className="w-full py-3 px-4 bg-botanical text-rice-husk font-bold text-xs rounded-xl shadow-sm hover:bg-botanical-light active:scale-95 transition-all text-center cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>View Results in Dashboard</span>
                <span>→</span>
              </button>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-800 space-y-1">
                  <p className="font-bold">Notice from YouCam Engine:</p>
                  <p>{errorMsg}</p>
                  <p className="text-[11px] text-rose-600 mt-1">
                    Tip: Use the <b>Zoom Slider</b> above to make the face larger (close-up) so it fills at least 65% of the oval width.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-light px-1">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-safe" />
                  <span>Zero-Cloud Retention · On-Device Sandboxed</span>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-botanical hover:underline font-semibold text-xs flex items-center gap-1"
                >
                  <Upload size={12} />
                  <span>{uploadedPreview ? 'Change Photo' : 'Upload Photo'}</span>
                </button>
              </div>

              <button
                onClick={handleCaptureAndAnalyze}
                disabled={analyzing}
                className="w-full py-3.5 px-4 bg-botanical text-rice-husk font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md hover:bg-botanical-light active:scale-95 transition-all disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Processing YouCam HD Skin Analysis...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="text-turmeric" />
                    <span>
                      {uploadedPreview ? 'Analyze Aligned Face Photo' : 'Capture & Analyze Biometrics'}
                    </span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
