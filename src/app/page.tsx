"use client";

import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";

// Conditions matching the model outputs
const CONDITIONS = [
  { 
    id: "melanoma", 
    ar: "ميلانوما (سرطان الخلايا الصبغية)", 
    en: "Melanoma", 
    tr: "Melanom (Malign Melanom)", 
    color: "bg-red-500" 
  },
  { 
    id: "bcc", 
    ar: "سرطان الخلايا القاعدية (BCC)", 
    en: "Basal Cell Carcinoma (BCC)", 
    tr: "Bazal Hücreli Karsinom (BCC)", 
    color: "bg-orange-500" 
  },
  { 
    id: "scc", 
    ar: "سرطان الخلايا الحرشفية (SCC)", 
    en: "Squamous Cell Carcinoma (SCC)", 
    tr: "Skuamöz Hücreli Karsinom (SCC)", 
    color: "bg-yellow-500" 
  },
  { 
    id: "seborrheic_keratosis", 
    ar: "تقران زهمي (حميد)", 
    en: "Seborrheic Keratosis (Benign)", 
    tr: "Seboreik Keratoz (İyi Huylu)", 
    color: "bg-green-500" 
  },
  { 
    id: "congenital_melanocytic_nevus", 
    ar: "شامة صبغية خلقية (حميدة)", 
    en: "Congenital Melanocytic Nevus (Benign)", 
    tr: "Konjenital Melanositik Nevüs (İyi Huylu)", 
    color: "bg-teal-500" 
  }
];

// Helper to translate conditions
const getConditionName = (id: string, lang: "ar" | "en" | "tr") => {
  const cond = CONDITIONS.find(c => c.id === id);
  if (!cond) return id;
  if (lang === "ar") return cond.ar;
  if (lang === "tr") return cond.tr;
  return cond.en;
};

const getConditionColor = (id: string) => {
  return CONDITIONS.find(c => c.id === id)?.color || "bg-blue-500";
};

interface ScanHistoryItem {
  id: string;
  date: string;
  prediction: string;
  confidence: number;
  imageThumbnail: string; // Base64 thumbnail
  patientId?: string;
  patientAge?: string;
  patientSex?: "male" | "female" | "";
  lesionLocation?: string;
  clinicalNotes?: string;
  biopsyStatus?: string;
  asymmetryIndex?: number;
  jddSubmitted?: boolean;
  lesionDetected?: boolean;
  clinicianName?: string;
}

export default function DermoAIPage() {
  const [lang, setLang] = useState<"ar" | "en" | "tr">("ar");
  const [litertLoaded, setLitertLoaded] = useState(false);
  const [litertLoading, setLitertLoading] = useState(true);
  const [modelCompiling, setModelCompiling] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [results, setResults] = useState<{
    prediction: string;
    confidence: number;
    top3: Array<{ condition: string; confidence: number }>;
  } | null>(null);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  // Clinician Documentation States
  const [patientId, setPatientId] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientSex, setPatientSex] = useState<"male" | "female" | "">("");
  const [lesionLocation, setLesionLocation] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [biopsyStatus, setBiopsyStatus] = useState("not_biopsied");
  const [asymmetryIndex, setAsymmetryIndex] = useState<number | null>(null);
  const [showContour, setShowContour] = useState(true);

  // Database settings & status
  const [webhookUrl, setWebhookUrl] = useState("https://script.google.com/macros/s/AKfycbzz7flXhvHQxUwoWWkexNals42mvNdVMkFutKHyb6qGeXR2vqU8mSuLK5jdWrgo_BsEpQ/exec");
  const [showWebhookInput, setShowWebhookInput] = useState(false);
  const [clinicianName, setClinicianName] = useState("");
  const [lesionDetected, setLesionDetected] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Refs
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const lesionMaskRef = useRef<Uint8Array | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const modelRef = useRef<any>(null); // LiteRT compiled model reference
  const litertLibRef = useRef<any>(null); // LiteRT core module reference

  // Redirect LiteRT C++ stderr logs to console.info to prevent Next.js dev overlay
  useEffect(() => {
    if (typeof window !== "undefined") {
      const originalError = console.error;
      console.error = (...args) => {
        const msg = args.join(" ").toLowerCase();
        if (
          msg.includes("litert") ||
          msg.includes("tensorflow") ||
          msg.includes("xnnpack") ||
          msg.includes("accelerator") ||
          msg.includes("registry") ||
          msg.includes("environment") ||
          msg.includes("compiled_model") ||
          msg.includes(".cc:") ||
          msg.includes(".h:")
        ) {
          console.info("[LiteRT Native Log]:", ...args);
          return;
        }
        originalError.apply(console, args);
      };
      return () => {
        console.error = originalError;
      };
    }
  }, []);

  // Load Scan History and Webhook URL from localStorage on client-side mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("dermoai_scan_history");
      if (stored) {
        try {
          setHistory(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse history:", e);
        }
      }

      const storedWebhook = localStorage.getItem("dermoai_jdd_webhook");
      if (storedWebhook) {
        setWebhookUrl(storedWebhook);
      } else {
        setWebhookUrl("https://script.google.com/macros/s/AKfycbzz7flXhvHQxUwoWWkexNals42mvNdVMkFutKHyb6qGeXR2vqU8mSuLK5jdWrgo_BsEpQ/exec");
      }

      const storedName = localStorage.getItem("dermoai_clinician_name");
      if (storedName) {
        setClinicianName(storedName);
      }
    }
  }, []);

  // Draw the segmented border contour on top of the image
  useEffect(() => {
    if (showContour && capturedImage && overlayCanvasRef.current && lesionMaskRef.current) {
      const canvas = overlayCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Clear first
        ctx.clearRect(0, 0, 224, 224);
        
        // Draw outline glowing contour
        ctx.strokeStyle = "#0d9488"; // Teal-600
        ctx.lineWidth = 3;
        ctx.shadowColor = "#2dd4bf"; // Teal-400
        ctx.shadowBlur = 6;
        ctx.beginPath();
        
        const mask = lesionMaskRef.current;
        const width = 224;
        const height = 224;
        
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            if (mask[y * width + x] === 1) {
              const isBorder = 
                mask[(y - 1) * width + x] === 0 || 
                mask[(y + 1) * width + x] === 0 || 
                mask[y * width + (x - 1)] === 0 || 
                mask[y * width + (x + 1)] === 0;
              
              if (isBorder) {
                ctx.rect(x, y, 1.5, 1.5);
              }
            }
          }
        }
        ctx.stroke();
      }
    }
  }, [showContour, capturedImage, results]);

  // Initialize LiteRT.js client-side
  useEffect(() => {
    async function initLiteRt() {
      try {
        setLitertLoading(true);
        console.log("Loading LiteRT.js from CDN...");
        
        // Bypass Next.js/Turbopack import interceptor by using a runtime function constructor
        const importModule = new Function("url", "return import(url)");
        const litert = await importModule("https://cdn.jsdelivr.net/npm/@litertjs/core@2.5.2/+esm");
        litertLibRef.current = litert;
        
        // Compile the WASM runtime pointing to CDN hosted WASM files
        await litert.loadLiteRt("https://cdn.jsdelivr.net/npm/@litertjs/core@2.5.2/wasm/");
        setLitertLoaded(true);
        console.log("LiteRT WebAssembly runtime loaded.");
        
        // Load and Compile TFLite Model
        setModelCompiling(true);
        console.log("Compiling TFLite model...");
        
        // Load model statically from the Next.js public directory
        // Use the float16 version for fast loading and reduced download latency
        const compiledModel = await litert.loadAndCompile("/models/dermoai_model_float16.tflite", {
          accelerator: "webgpu" // Fallback to webgl or cpu is handled automatically by LiteRT
        });
        
        modelRef.current = compiledModel;
        console.log("TFLite Model compiled successfully.");
      } catch (err: any) {
        console.error("Failed to initialize LiteRT.js:", err);
      } finally {
        setLitertLoading(false);
        setModelCompiling(false);
      }
    }
    
    initLiteRt();
  }, []);

  // Enumerate cameras
  const getCameras = async () => {
    try {
      const devicesList = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devicesList.filter(device => device.kind === "videoinput");
      setDevices(videoDevices);
      
      // Default to rear camera if available
      const backCam = videoDevices.find(device => 
        device.label.toLowerCase().includes("back") || 
        device.label.toLowerCase().includes("environment")
      );
      if (backCam) {
        setSelectedDevice(backCam.deviceId);
      } else if (videoDevices.length > 0) {
        setSelectedDevice(videoDevices[0].deviceId);
      }
    } catch (e) {
      console.error("Error enumerating devices:", e);
    }
  };

  // Start Camera Stream
  const startCamera = async (deviceId?: string) => {
    setCameraError(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    const targetDevice = deviceId || selectedDevice;
    const constraints: MediaStreamConstraints = {
      video: targetDevice 
        ? { deviceId: { exact: targetDevice } }
        : { facingMode: "environment" } // default to back camera
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      await getCameras(); // Enumerate cameras once permission is granted
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError(lang === "ar" 
        ? "تعذر تشغيل الكاميرا. يرجى التحقق من أذونات الموقع/الكاميرا."
        : lang === "tr"
          ? "Kameraya erişilemedi. Lütfen site izinlerini kontrol edin."
          : "Failed to access camera. Please check permissions."
      );
      setCameraActive(false);
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Switch Camera Device
  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deviceId = e.target.value;
    setSelectedDevice(deviceId);
    if (cameraActive) {
      startCamera(deviceId);
    }
  };

  // Preprocess image and run LiteRT inference
  const processImage = async (imageSrc: string) => {
    if (!modelRef.current || !litertLibRef.current) {
      alert(
        lang === "ar" 
          ? "جاري تحميل النموذج، يرجى المحاولة بعد قليل." 
          : lang === "tr" 
            ? "Model yükleniyor, lütfen biraz bekleyin." 
            : "Model is still loading. Please wait."
      );
      return;
    }

    setIsProcessing(true);
    try {
      const img = new Image();
      img.src = imageSrc;
      await new Promise((resolve) => (img.onload = resolve));

      // 1. Draw image to canvas and resize to 224x224
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, 224, 224);

      // 2. Preprocess pixels (Resize and Normalize)
      // PyTorch normalizes to range [0, 1] then subtracts mean and divides by std
      // mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
      const imgData = ctx.getImageData(0, 0, 224, 224);
      const data = imgData.data; // RGBA values

      // 2. Perform Lesion Segmentation & Asymmetry Calculation
      // Calculate baseline skin brightness from the outer 20-pixel border
      let borderSum = 0;
      let borderCount = 0;
      const width = 224;
      const height = 224;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (x < 20 || x > width - 20 || y < 20 || y > height - 20) {
            const idx = (y * width + x) * 4;
            const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
            borderSum += gray;
            borderCount++;
          }
        }
      }
      const baselineSkin = borderSum / borderCount;
      const threshold = baselineSkin * 0.85; // 85% of normal skin intensity represents the dark lesion

      // Compute lesion mask and center of mass
      let sumX = 0;
      let sumY = 0;
      let count = 0;
      const mask = new Uint8Array(width * height);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          if (gray < threshold) {
            mask[y * width + x] = 1;
            sumX += x;
            sumY += y;
            count++;
          }
        }
      }

      let computedAsymmetry = 0;
      const isLesion = count > 50;
      setLesionDetected(isLesion);

      if (isLesion) { // Ensure there is an actual lesion detected
        lesionMaskRef.current = mask;
        const cx = Math.round(sumX / count);
        const cy = Math.round(sumY / count);

        let nonOverlapCount = 0;
        let unionCount = 0;
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            if (mask[y * width + x] === 1) {
              unionCount++;
              const hx = 2 * cx - x;
              if (hx < 0 || hx >= width || mask[y * width + hx] !== 1) {
                nonOverlapCount++;
              }
              const vy = 2 * cy - y;
              if (vy < 0 || vy >= height || mask[vy * width + x] !== 1) {
                nonOverlapCount++;
              }
            }
          }
        }
        computedAsymmetry = unionCount > 0 
          ? Math.min(100, Math.round((nonOverlapCount / (unionCount * 2)) * 100))
          : 0;
        setAsymmetryIndex(computedAsymmetry);
      } else {
        lesionMaskRef.current = null;
        setAsymmetryIndex(null);
      }

      // 3. Preprocess pixels (HWC format and normalisation)
      const floatData = new Float32Array(1 * 224 * 224 * 3); 
      const mean = [0.485, 0.456, 0.406];
      const std = [0.229, 0.224, 0.225];

      for (let i = 0; i < 224 * 224; i++) {
        const r = data[i * 4] / 255.0;
        const g = data[i * 4 + 1] / 255.0;
        const b = data[i * 4 + 2] / 255.0;

        floatData[i * 3] = (r - mean[0]) / std[0];
        floatData[i * 3 + 1] = (g - mean[1]) / std[1];
        floatData[i * 3 + 2] = (b - mean[2]) / std[2];
      }

      // 3. Create LiteRT input tensor
      const { Tensor } = litertLibRef.current;
      const inputTensor = new Tensor(floatData, [1, 224, 224, 3]);

      // 4. Run local inference
      console.log("Running on-device inference...");
      const outputTensors = await modelRef.current.run(inputTensor);

      // 5. Read output and convert to probabilities (softmax)
      // Transfer output tensor to WASM runtime memory
      const outputData = (await outputTensors[0].moveTo("wasm")).toTypedArray();
      
      // Calculate softmax over the 5 outputs
      const expValues = Array.from(outputData).map(val => Math.exp(val as number));
      const sumExp = expValues.reduce((a, b) => a + b, 0);
      const probabilities = expValues.map(val => (val as number) / sumExp);

      // Sort outputs
      const resultsArray = CONDITIONS.map((cond, idx) => ({
        condition: cond.id,
        confidence: probabilities[idx]
      })).sort((a, b) => b.confidence - a.confidence);

      const prediction = resultsArray[0].condition;
      const confidence = resultsArray[0].confidence;

      setResults({
        prediction,
        confidence,
        top3: resultsArray.slice(0, 3)
      });

      // 6. Save to local scan history
      // Create a small thumbnail to save in history
      const thumbnailCanvas = document.createElement("canvas");
      thumbnailCanvas.width = 64;
      thumbnailCanvas.height = 64;
      const thumbCtx = thumbnailCanvas.getContext("2d");
      if (thumbCtx) {
        thumbCtx.drawImage(img, 0, 0, 64, 64);
        const thumbnailData = thumbnailCanvas.toDataURL("image/jpeg", 0.7);

        const newHistoryItem: ScanHistoryItem = {
          id: Math.random().toString(36).substring(2, 9),
          date: new Date().toLocaleDateString(lang === "ar" ? "ar-JO" : lang === "tr" ? "tr-TR" : "en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          }),
          prediction,
          confidence,
          imageThumbnail: thumbnailData,
          asymmetryIndex: computedAsymmetry || undefined,
          patientId: "",
          patientAge: "",
          patientSex: "",
          lesionLocation: "",
          clinicalNotes: "",
          biopsyStatus: "not_biopsied",
          lesionDetected: isLesion,
          clinicianName: clinicianName || undefined
        };

        // Clear input form fields for the new scan
        setPatientId("");
        setPatientAge("");
        setPatientSex("");
        setLesionLocation("");
        setClinicalNotes("");
        setBiopsyStatus("not_biopsied");
        setSubmitMessage(null);
        setCurrentHistoryId(newHistoryItem.id);

        const updatedHistory = [newHistoryItem, ...history.slice(0, 19)]; // Limit to last 20 items
        setHistory(updatedHistory);
        localStorage.setItem("dermoai_scan_history", JSON.stringify(updatedHistory));
      }

    } catch (err) {
      console.error("Inference processing error:", err);
      alert(
        lang === "ar" 
          ? "فشل تحليل الصورة. يرجى التأكد من جودة الإضاءة ووضوح الآفة." 
          : lang === "tr" 
            ? "Resim analizi başarısız oldu. Lütfen ışık kalitesini ve lezyon netliğini kontrol edin." 
            : "Inference failed. Check image clarity."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Capture image from video stream
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Draw centered square crop from the video feed to match the dermoscopy ring
        const size = Math.min(video.videoWidth, video.videoHeight);
        const sx = (video.videoWidth - size) / 2;
        const sy = (video.videoHeight - size) / 2;
        
        canvas.width = 224;
        canvas.height = 224;
        ctx.drawImage(video, sx, sy, size, size, 0, 0, 224, 224);
        
        const imageSrc = canvas.toDataURL("image/jpeg", 0.9);
        setCapturedImage(imageSrc);
        stopCamera();
        processImage(imageSrc);
      }
    }
  };

  // Handle image upload fallback
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const imageSrc = event.target.result as string;
          setCapturedImage(imageSrc);
          stopCamera();
          processImage(imageSrc);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset scan state
  const resetScan = () => {
    setCapturedImage(null);
    setResults(null);
    startCamera();
  };

  // Clear Scan History
  const clearHistory = () => {
    if (confirm(lang === "ar" ? "هل أنت متأكد من مسح كافة السجلات؟" : "Are you sure you want to clear your local history?")) {
      setHistory([]);
      localStorage.removeItem("dermoai_scan_history");
    }
  };

  // Save/Update case details in local Scan History
  const saveCaseDetails = () => {
    if (!currentHistoryId) return;

    const updatedHistory = history.map(item => {
      if (item.id === currentHistoryId) {
        return {
          ...item,
          patientId,
          patientAge,
          patientSex,
          lesionLocation,
          clinicalNotes,
          biopsyStatus,
          clinicianName: clinicianName || undefined
        };
      }
      return item;
    });

    setHistory(updatedHistory);
    localStorage.setItem("dermoai_scan_history", JSON.stringify(updatedHistory));
    
    alert(
      lang === "ar" 
        ? "تم حفظ تفاصيل الحالة بنجاح!" 
        : lang === "tr" 
          ? "Vaka detayları başarıyla kaydedildi!" 
          : "Case details saved successfully!"
    );
  };

  // Load a historic case into the active view
  const selectHistoryItem = (id: string) => {
    const item = history.find(h => h.id === id);
    if (item) {
      setCurrentHistoryId(item.id);
      setResults({
        prediction: item.prediction,
        confidence: item.confidence,
        top3: [
          { condition: item.prediction, confidence: item.confidence },
          ...CONDITIONS.filter(c => c.id !== item.prediction).slice(0, 2).map(c => ({ condition: c.id, confidence: 0 }))
        ]
      });
      setCapturedImage(item.imageThumbnail);
      setPatientId(item.patientId || "");
      setPatientAge(item.patientAge || "");
      setPatientSex(item.patientSex || "");
      setLesionLocation(item.lesionLocation || "");
      setClinicalNotes(item.clinicalNotes || "");
      setBiopsyStatus(item.biopsyStatus || "not_biopsied");
      setAsymmetryIndex(item.asymmetryIndex ?? null);
      setLesionDetected(item.lesionDetected !== false);
      if (item.clinicianName) {
        setClinicianName(item.clinicianName);
      }
      
      // Clear mask ref since it's an old image loaded from thumbnail
      lesionMaskRef.current = null;
      setSubmitMessage(null);
    }
  };

  // Submit case details to Google Apps Script Webhook
  const submitCaseToDatabase = async () => {
    if (!currentHistoryId) return;
    const item = history.find(h => h.id === currentHistoryId);
    if (!item) return;

    if (!webhookUrl) {
      setSubmitMessage({
        type: "error",
        text: lang === "ar" 
          ? "يرجى إدخال رابط Webhook الخاص بك في قسم الإعدادات أولاً." 
          : lang === "tr" 
            ? "Lütfen önce ayarlardan Webhook URL'nizi girin." 
            : "Please enter your Webhook URL in settings first."
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const payload = {
        authToken: "wraikat_dermoai_secure_2026",
        clinicianName: clinicianName || "unknown",
        lesionDetected: item.lesionDetected !== false,
        caseId: item.id,
        date: item.date,
        prediction: item.prediction,
        confidence: item.confidence,
        asymmetryIndex: item.asymmetryIndex || asymmetryIndex,
        patientId,
        patientAge,
        patientSex,
        lesionLocation,
        clinicalNotes,
        biopsyStatus,
        imageThumbnail: item.imageThumbnail
      };

      const response = await fetch(webhookUrl, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setSubmitMessage({
          type: "success",
          text: lang === "ar" 
            ? "تم إرسال الحالة لقاعدة البيانات بنجاح!" 
            : lang === "tr" 
              ? "Vaka veritabanına başarıyla gönderildi!" 
              : "Case successfully sent to database!"
        });

        // Mark as submitted in local state & localStorage
        const updatedHistory = history.map(h => {
          if (h.id === currentHistoryId) {
            return { ...h, jddSubmitted: true };
          }
          return h;
        });
        setHistory(updatedHistory);
        localStorage.setItem("dermoai_scan_history", JSON.stringify(updatedHistory));
      } else {
        throw new Error("HTTP error " + response.status);
      }
    } catch (err) {
      console.error("Submission error:", err);
      setSubmitMessage({
        type: "error",
        text: lang === "ar" 
          ? "فشل الإرسال. يرجى التحقق من رابط Webhook والاتصال بالإنترنت." 
          : lang === "tr" 
            ? "Gönderim hatası. Lütfen Webhook URL'sini ve internetinizi kontrol edin." 
            : "Submission error. Please check Webhook URL and internet connection."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download case package as local JSON file
  const downloadJsonPackage = () => {
    if (!currentHistoryId) return;
    const item = history.find(h => h.id === currentHistoryId);
    if (!item) return;

    const payload = {
      clinicianName: clinicianName || "unknown",
      lesionDetected: item.lesionDetected !== false,
      caseId: item.id,
      date: item.date,
      prediction: item.prediction,
      confidence: item.confidence,
      asymmetryIndex: item.asymmetryIndex || asymmetryIndex,
      patientId,
      patientAge,
      patientSex,
      lesionLocation,
      clinicalNotes,
      biopsyStatus,
      imageThumbnail: item.imageThumbnail
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `dermoai_case_${item.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-teal-500 selection:text-white" dir={lang === "ar" ? "rtl" : "ltr"}>
      <canvas ref={canvasRef} className="hidden" width={224} height={224} />
      
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-50 px-4 py-4 flex justify-between items-center max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3">
          {/* Custom Generated Medical-AI Icon */}
          <img 
            src="/images/dermoai-icon.png" 
            alt="DermoAI Logo" 
            className="w-12 h-12 rounded-xl object-cover shadow-lg shadow-teal-500/20 border border-teal-500/20"
          />
          <div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-2xl font-black tracking-tight font-inter bg-gradient-to-r from-teal-400 to-emerald-300 bg-clip-text text-transparent">DermoAI</h1>
              <span className="text-[10px] bg-teal-500/10 text-teal-300 px-2 py-0.5 rounded-full font-bold border border-teal-500/20 font-inter">v{lang === "ar" ? "١.٠" : "1.0"}</span>
            </div>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
              {lang === "ar" 
                ? "تطوير د. أسامة الوريكات (جلدية وتناسلية وليزر)" 
                : lang === "tr"
                  ? "Dr. Osama Alwreikat tarafından geliştirilmiştir (Dermatoloji ve Lazer)"
                  : "Created by Dr. Osama Alwreikat (Skin, Venereology & Laser)"}
            </p>
          </div>
        </div>

        {/* Trilingual Language Selector */}
        <div className="flex gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg select-none">
          <button 
            onClick={() => setLang("ar")} 
            className={`px-2 py-1 text-[10px] rounded-md font-semibold transition ${lang === "ar" ? "bg-teal-500 text-white" : "text-slate-400 hover:text-slate-200"}`}
          >
            عربي
          </button>
          <button 
            onClick={() => setLang("en")} 
            className={`px-2 py-1 text-[10px] rounded-md font-semibold transition ${lang === "en" ? "bg-teal-500 text-white" : "text-slate-400 hover:text-slate-200"}`}
          >
            EN
          </button>
          <button 
            onClick={() => setLang("tr")} 
            className={`px-2 py-1 text-[10px] rounded-md font-semibold transition ${lang === "tr" ? "bg-teal-500 text-white" : "text-slate-400 hover:text-slate-200"}`}
          >
            TR
          </button>
        </div>
      </header>

      {/* Intro Tagline Banner */}
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/40 to-slate-950 border border-slate-900 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl" />
          
          <blockquote className="text-sm md:text-base font-medium italic text-slate-300 leading-relaxed font-cairo select-none">
            {lang === "ar" 
              ? "«دمج دقة التشخيص السريري بالذكاء الاصطناعي مع الخصوصية التامة للبيانات — تحليل فوري محلي بالكامل دون رفع صور المرضى للسحابة.»"
              : lang === "tr"
                ? "“Klinik dermatoloji uzmanlığını güvenli, cihaz içi yapay zeka ile birleştirdik — hasta gizliliğini korumak adına bulut sunuculara veri aktarımı olmadan, anında yerel analiz.”"
                : "“Bridging clinical dermatology expertise with secure, on-device artificial intelligence — instant local inference with zero cloud data transfer, ensuring absolute patient privacy.”"
            }
          </blockquote>
          
          <div className="mt-4 flex items-center gap-2">
            <span className="w-4 h-[1px] bg-teal-500/40" />
            <span className="text-[11px] font-bold text-teal-400 tracking-wide uppercase font-inter">
              {lang === "ar" ? "رؤية المطور السريري" : lang === "tr" ? "Klinik Geliştirici Vizyonu" : "Clinical Creator Vision"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <main className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Scanner & Results (8 Columns) */}
        <section className="md:col-span-8 flex flex-col gap-6 w-full">
          
          {/* Card Viewport */}
          <div className="bg-slate-900/60 border border-slate-900 rounded-3xl overflow-hidden relative shadow-2xl backdrop-blur-md">
            
            {/* Model Loading State */}
            {litertLoading && (
              <div className="absolute inset-0 z-40 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-14 h-14 rounded-full border-4 border-slate-800 border-t-teal-500 animate-spin mb-4" />
                <h3 className="text-lg font-bold">
                  {lang === "ar" ? "جاري تحميل محرك الذكاء الاصطناعي..." : lang === "tr" ? "Yapay Zeka Motoru Başlatılıyor..." : "Initializing AI Engine..."}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mt-2">
                  {lang === "ar" 
                    ? "يقوم المتصفح بتحميل وتجهيز محرك الـ WebAssembly والشبكة العصبية محلياً على جهازك لتوفير أمان تام لبياناتك."
                    : lang === "tr"
                      ? "Tarayıcınız, %100 gizlilik sağlamak için WebAssembly yapay zeka motorunu ve sinir ağını yerel olarak cihazınızda yükler."
                      : "The browser is loading the WebAssembly AI runtime locally on your device to ensure 100% privacy."
                  }
                </p>
              </div>
            )}

            {/* Model Compiling State */}
            {modelCompiling && !litertLoading && (
              <div className="absolute inset-0 z-40 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-14 h-14 rounded-full border-4 border-slate-800 border-t-emerald-500 animate-spin mb-4" />
                <h3 className="text-lg font-bold">
                  {lang === "ar" ? "جاري تجميع الشبكة العصبية (WebGPU)..." : lang === "tr" ? "Sinir Ağı Derleniyor (WebGPU)..." : "Compiling Neural Network (WebGPU)..."}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mt-2">
                  {lang === "ar" 
                    ? "نقوم بتهيئة النموذج على معالج الرسوميات بجهازك لتشغيل التحليل بسرعة فائقة."
                    : lang === "tr"
                      ? "Gerçek zamanlı hızlandırma için EfficientNet modelini cihazınızın grafik işlemcisinde (GPU) derliyoruz."
                      : "Compiling the EfficientNet model on your device's GPU for real-time acceleration."
                  }
                </p>
              </div>
            )}

            {/* Title inside card */}
            <div className="p-5 border-b border-slate-950/40 flex justify-between items-center bg-slate-950/20">
              <span className="text-sm font-bold flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
                {lang === "ar" ? "عدسة الفحص المباشر" : "Dermoscopy Viewfinder"}
              </span>

              {capturedImage && results && (
                <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showContour}
                    onChange={(e) => setShowContour(e.target.checked)}
                    className="rounded border-slate-800 text-teal-600 focus:ring-teal-500 bg-slate-950 w-4 h-4"
                  />
                  <span>
                    {lang === "ar" ? "تحديد حدود الآفة (AI)" : lang === "tr" ? "Lezyon Sınırı (AI)" : "Lesion Contour (AI)"}
                  </span>
                </label>
              )}

              {cameraActive && devices.length > 1 && (
                <select 
                  onChange={handleDeviceChange}
                  value={selectedDevice}
                  className="bg-slate-950/80 border border-slate-800 text-xs rounded-lg px-2 py-1 max-w-[150px] outline-none"
                >
                  {devices.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${device.deviceId.substring(0, 5)}`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Video Preview & Overlay */}
            <div className="relative aspect-square w-full max-w-lg mx-auto bg-slate-950 flex items-center justify-center overflow-hidden">
              
              {/* Live Video */}
              {cameraActive && !capturedImage && (
                <video 
                  ref={videoRef}
                  autoPlay 
                  playsInline 
                  muted 
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}

              {/* Static Captured Image */}
              {capturedImage && (
                <>
                  <img 
                    src={capturedImage} 
                    alt="Captured skin lesion" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {showContour && (
                    <canvas 
                      ref={overlayCanvasRef} 
                      width={224} 
                      height={224} 
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
                    />
                  )}
                </>
              )}

              {/* Camera Error Message */}
              {cameraError && !capturedImage && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-slate-950">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-3">
                    ⚠️
                  </div>
                  <p className="text-sm font-semibold max-w-xs">{cameraError}</p>
                </div>
              )}

              {/* Fallback Static Upload Prompt */}
              {!cameraActive && !capturedImage && !cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-slate-950">
                  <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-2xl">
                    📷
                  </div>
                  <button 
                    onClick={() => startCamera()}
                    className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold text-sm transition duration-200 shadow-lg shadow-teal-600/20"
                  >
                    {lang === "ar" ? "تشغيل الكاميرا للفحص" : "Start Dermoscopy Camera"}
                  </button>
                  
                  <span className="text-xs text-slate-500 my-3 font-semibold">
                    {lang === "ar" ? "أو" : "OR"}
                  </span>

                  <label className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-bold cursor-pointer transition duration-200">
                    <span>{lang === "ar" ? "تحميل صورة من الملفات" : "Upload Lesion Photo"}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>
              )}

              {/* Dermoscopy Target Circle Overlay (Visible only when scanning or capturing) */}
              {((cameraActive && !capturedImage) || (isProcessing && capturedImage)) && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-64 h-64 border-2 border-dashed border-teal-500/40 rounded-full flex items-center justify-center relative">
                    <div className="w-[240px] h-[240px] border border-white/10 rounded-full" />
                    
                    {/* Glowing circular overlay indicating targeted area */}
                    <div className="absolute inset-0 rounded-full bg-teal-500/5 animate-pulse" />
                    
                    {/* Target corner marks */}
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-teal-400" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-teal-400" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-teal-400" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-teal-400" />
                  </div>
                  
                  {/* Realtime Scanning Indicator */}
                  {isProcessing && (
                    <div className="absolute top-0 bottom-0 left-0 right-0 bg-teal-500/10 flex items-center justify-center">
                      <div className="w-full h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent absolute top-0 animate-bounce" />
                    </div>
                  )}
                </div>
              )}

              {/* Processing Overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center z-10">
                  <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-teal-500 animate-spin mb-3" />
                  <p className="text-sm font-bold tracking-wide">
                    {lang === "ar" ? "جاري تحليل الآفة الجلدية..." : lang === "tr" ? "Lezyon Analiz Ediliyor..." : "Analyzing Lesion..."}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Panel controls */}
            <div className="p-6 bg-slate-950/40 border-t border-slate-950/40 flex justify-between items-center">
              {cameraActive && !capturedImage ? (
                <>
                  <button 
                    onClick={stopCamera}
                    className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold hover:bg-slate-800 transition duration-200"
                  >
                    {lang === "ar" ? "إلغاء الكاميرا" : lang === "tr" ? "Kamerayı Kapat" : "Cancel"}
                  </button>
                  
                  <button 
                    onClick={captureImage}
                    className="w-16 h-16 rounded-full bg-white flex items-center justify-center border-4 border-slate-800 focus:scale-95 active:scale-90 transition duration-150"
                  >
                    <div className="w-12 h-12 rounded-full bg-teal-600 hover:bg-teal-500" />
                  </button>

                  <label className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-bold cursor-pointer transition duration-200">
                    <span>{lang === "ar" ? "ملف" : lang === "tr" ? "Dosya" : "File"}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      className="hidden" 
                    />
                  </label>
                </>
              ) : (
                capturedImage && (
                  <button 
                    onClick={resetScan}
                    className="w-full py-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 font-bold text-sm transition duration-200"
                  >
                    {lang === "ar" ? "إجراء فحص جديد" : lang === "tr" ? "Yeni Tarama Yap" : "Scan Another Lesion"}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Results Display */}
          {results && (
            <div className="bg-slate-900/60 border border-slate-900 rounded-3xl p-6 flex flex-col gap-6 shadow-xl backdrop-blur-md animate-fade-in">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  📊 {lang === "ar" ? "نتائج التصنيف وتوقعات النموذج" : lang === "tr" ? "Model Tahmin Sonuçları" : "Model Prediction Results"}
                </h3>
              </div>

              {/* Diagnosis Output Card */}
              <div className="bg-slate-950/40 border border-slate-900/50 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">
                    {lang === "ar" ? "التشخيص الأرجح للنموذج" : lang === "tr" ? "Birincil Yapay Zeka Tahmini" : "Primary AI Prediction"}
                  </span>
                  <span className="text-lg font-extrabold block mt-1 text-teal-400">
                    {getConditionName(results.prediction, lang)}
                  </span>
                </div>
                {asymmetryIndex !== null && (
                  <div className="text-right sm:text-center">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">
                      {lang === "ar" ? "مؤشر عدم التماثل (A)" : lang === "tr" ? "Asimetri İndeksi (A)" : "Asymmetry Index (A)"}
                    </span>
                    <span className="text-lg font-extrabold text-teal-300 block mt-1 font-mono">
                      {asymmetryIndex}%
                    </span>
                  </div>
                )}
                <div className="text-right">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">
                    {lang === "ar" ? "مستوى الثقة" : lang === "tr" ? "Güven Seviyesi" : "Confidence Level"}
                  </span>
                  <span className="text-2xl font-black text-white block mt-1 font-mono">
                    {(results.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Differential Diagnosis List */}
              <div className="flex flex-col gap-4">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                  {lang === "ar" ? "التشخيصات المقارنة (أعلى 3)" : lang === "tr" ? "En Olası 3 Ayırıcı Tanı" : "Top 3 Differentials"}
                </span>

                <div className="flex flex-col gap-3">
                  {results.top3.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-200">{getConditionName(item.condition, lang)}</span>
                        <span className="font-mono text-slate-400">{(item.confidence * 100).toFixed(1)}%</span>
                      </div>
                      {/* Progress bar container */}
                      <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getConditionColor(item.condition)} rounded-full`}
                          style={{ width: `${item.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed flex flex-col gap-2">
                <div className="flex items-center gap-2 font-bold">
                  ⚠️ {lang === "ar" ? "إخلاء مسؤولية طبي هام" : lang === "tr" ? "Önemli Tıbbi Sorumluluk Reddi" : "Important Clinical Disclaimer"}
                </div>
                <div>
                  {lang === "ar"
                    ? "تحليل الذكاء الاصطناعي هذا هو أداة تعليمية واستقصائية مساعدة فقط، ولا يمكن اعتباره تشخيصاً طبياً نهائياً. تم تطوير هذه الأداة لتكون عوناً ومساعداً للأطباء لتسهيل عملهم الاستقصائي وليس لاستبدالهم؛ ويبقى القرار الطبي النهائي والكلمة الأخيرة دائماً للطبيب المعالج بصرف النظر عن نتائج التطبيق."
                    : lang === "tr"
                      ? "Bu yerel yapay zeka analiz modeli yalnızca eğitsel ve tarama amaçlı bir yardımcı araçtır. Kesin bir tıbbi tanı teşkil etmez. Bu araç, hekimlerin tanı iş akışına yardımcı olmak amacıyla geliştirilmiş olup, hekimlerin yerini almayı amaçlamaz. Nihai klinik karar, uygulamanın çıktısından bağımsız olarak her zaman tedaviyi yürüten hekime aittir."
                      : "This local AI classification model is designed strictly as an educational and screening assistant. It is NOT a definitive medical diagnosis. This tool is built to assist clinicians in their diagnostic workflow, not to replace them. The final clinical decision always rests solely with the attending physician, regardless of the app's output."
                  }
                </div>
              </div>
            </div>
          )}

          {/* Clinician Case Documentation Form */}
          {results && currentHistoryId && (
            <div className="bg-slate-900/60 border border-slate-900 rounded-3xl p-6 flex flex-col gap-5 shadow-xl backdrop-blur-md animate-fade-in">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold flex items-center gap-2 text-teal-400">
                  📋 {lang === "ar" ? "توثيق الحالة السريرية" : lang === "tr" ? "Klinik Vaka Belgeleme" : "Clinical Case Documentation"}
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">
                  {lang === "ar" 
                    ? "املأ تفاصيل الحالة لبناء قاعدة البيانات ومشاركتها" 
                    : lang === "tr" 
                      ? "Veritabanını oluşturmak ve vakaları paylaşmak için detayları doldurun" 
                      : "Fill in case details to build the JDD and share cases"}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Patient ID */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    {lang === "ar" ? "رمز المريض (أرقام/حروف)" : lang === "tr" ? "Hasta Kodu (Anonim)" : "Patient Code (Anonymous)"}
                  </label>
                  <input 
                    type="text" 
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    placeholder="e.g. PT-402"
                    className="bg-slate-950/60 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-sm outline-none transition"
                  />
                </div>

                {/* Patient Age */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    {lang === "ar" ? "العمر" : lang === "tr" ? "Yaş" : "Age"}
                  </label>
                  <input 
                    type="number" 
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    placeholder="e.g. 45"
                    className="bg-slate-950/60 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-sm outline-none transition"
                  />
                </div>

                {/* Patient Sex */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    {lang === "ar" ? "الجنس" : lang === "tr" ? "Cinsiyet" : "Sex"}
                  </label>
                  <select 
                    value={patientSex}
                    onChange={(e) => setPatientSex(e.target.value as any)}
                    className="bg-slate-950/60 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-sm outline-none transition"
                  >
                    <option value="">--</option>
                    <option value="male">{lang === "ar" ? "ذكر" : lang === "tr" ? "Erkek" : "Male"}</option>
                    <option value="female">{lang === "ar" ? "أنثى" : lang === "tr" ? "Kadın" : "Female"}</option>
                  </select>
                </div>

                {/* Lesion Location */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    {lang === "ar" ? "موقع الآفة" : lang === "tr" ? "Lezyon Bölgesi" : "Lesion Location"}
                  </label>
                  <select 
                    value={lesionLocation}
                    onChange={(e) => setLesionLocation(e.target.value)}
                    className="bg-slate-950/60 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-sm outline-none transition"
                  >
                    <option value="">--</option>
                    <option value="Face/Neck">{lang === "ar" ? "الوجه / الرقبة" : lang === "tr" ? "Yüz / Boyun" : "Face / Neck"}</option>
                    <option value="Trunk">{lang === "ar" ? "الجذع (الظهر/البطن)" : lang === "tr" ? "Gövde" : "Trunk"}</option>
                    <option value="Upper Extremity">{lang === "ar" ? "الأطراف العلوية" : lang === "tr" ? "Üst Ekstremite" : "Upper Extremity"}</option>
                    <option value="Lower Extremity">{lang === "ar" ? "الأطراف السفلية" : lang === "tr" ? "Alt Ekstremite" : "Lower Extremity"}</option>
                    <option value="Acral">{lang === "ar" ? "الأطراف (اليدين/القدمين)" : lang === "tr" ? "Akral (El/Ayak)" : "Acral"}</option>
                    <option value="Other">{lang === "ar" ? "مواقع أخرى" : lang === "tr" ? "Diğer" : "Other"}</option>
                  </select>
                </div>
              </div>

              {/* Biopsy Status */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                  {lang === "ar" ? "حالة الخزعة / الفحص النسيجي" : lang === "tr" ? "Biyopsi / Patoloji Durumu" : "Biopsy / Pathology Status"}
                </label>
                <select 
                  value={biopsyStatus}
                  onChange={(e) => setBiopsyStatus(e.target.value)}
                  className="bg-slate-950/60 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-sm outline-none transition"
                >
                  <option value="not_biopsied">{lang === "ar" ? "لم تؤخذ خزعة" : lang === "tr" ? "Biyopsi Yapılmadı" : "Not Biopsied"}</option>
                  <option value="pending">{lang === "ar" ? "بانتظار النتيجة" : lang === "tr" ? "Sonuç Bekleniyor" : "Pending Results"}</option>
                  <option value="benign">{lang === "ar" ? "خزعة حميدة مؤكدة" : lang === "tr" ? "Doğrulanmış İyi Huylu" : "Confirmed Benign"}</option>
                  <option value="malignant">{lang === "ar" ? "خزعة خبيثة مؤكدة" : lang === "tr" ? "Doğrulanmış Kötü Huylu" : "Confirmed Malignant"}</option>
                </select>
              </div>

              {/* Clinical Notes */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                  {lang === "ar" ? "ملاحظات سريرية وأنماط الديرموسكوب" : lang === "tr" ? "Klinik Notlar ve Dermoskopi Bulguları" : "Clinical Notes & Dermoscopic Patterns"}
                </label>
                <textarea 
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  rows={2}
                  placeholder={lang === "ar" ? "الوصف السريري للآفة، شبكة الأوعية الصبغية..." : "Lesion appearance, pigment network structure..."}
                  className="bg-slate-950/60 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-sm outline-none resize-none transition"
                />
              </div>

              {/* Quality Alert if no lesion detected */}
              {!lesionDetected && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-start gap-2.5 leading-relaxed">
                  <span className="text-sm mt-0.5">⚠️</span>
                  <div>
                    {lang === "ar"
                      ? "تنبيه الجودة: لم يتم اكتشاف آفة جلدية صالحة في هذه الصورة. يرجى محاذاة العدسة وإعادة المحاولة. تم إيقاف الحفظ والمشاركة لحماية جودة قاعدة البيانات."
                      : lang === "tr"
                        ? "Kalite Uyarısı: Bu resimde geçerli bir lezyon tespit edilemedi. Lütfen lensi hizalayın. Veritabanı kalitesini korumak için kaydetme ve gönderme engellendi."
                        : "Quality Alert: No valid lesion detected in this image. Please align your lens. Saving and database submissions are disabled to maintain database quality."}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <button 
                  onClick={saveCaseDetails}
                  disabled={!lesionDetected}
                  className="py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 disabled:bg-slate-950/20 disabled:text-slate-600 disabled:border-slate-950/20 font-bold text-xs transition cursor-pointer disabled:cursor-not-allowed"
                >
                  💾 {lang === "ar" ? "حفظ محلياً" : lang === "tr" ? "Yerel Kaydet" : "Save Locally"}
                </button>

                <button 
                  onClick={downloadJsonPackage}
                  disabled={!lesionDetected}
                  className="py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 disabled:bg-slate-950/20 disabled:text-slate-600 disabled:border-slate-950/20 font-bold text-xs transition cursor-pointer disabled:cursor-not-allowed"
                >
                  📥 {lang === "ar" ? "تحميل ملف الحالة" : lang === "tr" ? "Dosya İndir" : "Export JSON"}
                </button>

                <button 
                  onClick={submitCaseToDatabase}
                  disabled={isSubmitting || !lesionDetected}
                  className="py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:bg-slate-900 disabled:text-slate-600 disabled:border-slate-900/40 font-bold text-xs transition shadow-md shadow-teal-500/10 cursor-pointer disabled:cursor-not-allowed"
                >
                  🚀 {isSubmitting 
                    ? (lang === "ar" ? "جاري الإرسال..." : "Sending...") 
                    : (lang === "ar" ? "مشاركة بقاعدة البيانات" : lang === "tr" ? "Veritabanına Gönder" : "Submit to Database")}
                </button>
              </div>

              {submitMessage && (
                <div className={`p-3 rounded-xl text-xs font-semibold leading-relaxed border ${
                  submitMessage.type === "success" 
                    ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300" 
                    : "bg-red-500/5 border-red-500/20 text-red-300"
                }`}>
                  {submitMessage.text}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Right Side: Scan History & Guidelines (4 Columns) */}
        <section className="md:col-span-4 flex flex-col gap-6 w-full">
          
          {/* Database Webhook Settings */}
          <div className="bg-slate-900/60 border border-slate-900 rounded-3xl p-5 shadow-xl backdrop-blur-md flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                ⚙️ {lang === "ar" ? "إعدادات قاعدة البيانات" : lang === "tr" ? "Veritabanı Ayarları" : "Database Settings"}
              </h3>
              <button 
                onClick={() => setShowWebhookInput(!showWebhookInput)}
                className="text-[10px] text-slate-500 hover:text-slate-300 font-bold transition cursor-pointer select-none"
              >
                {showWebhookInput ? (lang === "ar" ? "إخفاء" : "Hide") : (lang === "ar" ? "تعديل" : "Edit")}
              </button>
            </div>

            {/* Connection Status Badge */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-300 text-xs font-bold leading-none">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {lang === "ar" 
                  ? "متصل بقاعدة البيانات المشتركة" 
                  : lang === "tr"
                    ? "Ortak Veritabanına Bağlandı"
                    : "Connected to JDD Database"}
              </span>
            </div>

            {/* Clinician Name ID Input */}
            <div className="flex flex-col gap-1.5 mt-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                {lang === "ar" ? "اسم الطبيب / معرّف عيادتك" : lang === "tr" ? "Hekim Adı / Klinik Kimliği" : "Clinician Name / Clinic ID"}
              </label>
              <input 
                type="text" 
                value={clinicianName}
                onChange={(e) => {
                  const val = e.target.value;
                  setClinicianName(val);
                  localStorage.setItem("dermoai_clinician_name", val);
                }}
                placeholder="e.g. Dr. Osama Alwreikat"
                className="bg-slate-950/60 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-xs outline-none transition"
              />
            </div>

            {/* Hidden Webhook Input (Visible only if clicked Edit) */}
            {showWebhookInput && (
              <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-slate-800 animate-fade-in">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  {lang === "ar" ? "رابط Webhook (Google Script URL)" : "Google Apps Script URL"}
                </label>
                <input 
                  type="text" 
                  value={webhookUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    setWebhookUrl(val);
                    localStorage.setItem("dermoai_jdd_webhook", val);
                  }}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="bg-slate-950/60 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-[10px] outline-none transition font-mono"
                />
              </div>
            )}
          </div>

          {/* History Panel */}
          <div className="bg-slate-900/60 border border-slate-900 rounded-3xl p-5 shadow-xl backdrop-blur-md">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                📜 {lang === "ar" ? "سجل الفحوصات المحلية" : lang === "tr" ? "Yerel Tarama Geçmişi" : "Local Scan History"}
              </h3>
              {history.length > 0 && (
                <button 
                  onClick={clearHistory}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold"
                >
                  {lang === "ar" ? "مسح" : lang === "tr" ? "Temizle" : "Clear"}
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 font-medium">
                {lang === "ar" ? "لا يوجد سجلات فحص سابقة في هذا المتصفح." : lang === "tr" ? "Bu tarayıcıda kayıtlı tarama geçmişi bulunmamaktadır." : "No previous scan history in this browser."}
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                {history.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => selectHistoryItem(item.id)}
                    className={`cursor-pointer bg-slate-950/40 hover:bg-slate-950 border p-3 flex gap-3 items-center justify-between transition duration-200 ${
                      currentHistoryId === item.id 
                        ? "border-teal-500 bg-slate-950 shadow-md shadow-teal-500/5" 
                        : "border-slate-900/40"
                    }`}
                  >
                    <div className="flex gap-2.5 items-center">
                      <img 
                        src={item.imageThumbnail} 
                        alt="Thumbnail" 
                        className="w-10 h-10 rounded-lg object-cover border border-slate-800 bg-slate-900"
                      />
                      <div className="text-right">
                        <span className="text-xs font-bold text-teal-400 block max-w-[130px] truncate flex items-center gap-1">
                          {getConditionName(item.prediction, lang)}
                          {item.jddSubmitted && (
                            <span className="text-[10px] text-emerald-400 font-normal" title="Submitted to JDD">✓</span>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                          {item.date}
                        </span>
                      </div>
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-mono font-bold text-slate-300">
                        {(item.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Creator & Other Projects Panel */}
          <div className="bg-slate-900/60 border border-slate-900 rounded-3xl p-5 shadow-xl backdrop-blur-md flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              👨‍⚕️ {lang === "ar" ? "عن المطور والمشاريع الأخرى" : lang === "tr" ? "Geliştirici ve Diğer Projeler" : "Creator & Other Projects"}
            </h3>
            
            {/* About Creator Bio */}
            <div className="text-xs text-slate-300 leading-relaxed">
              <p className="font-bold text-teal-400">
                {lang === "ar" ? "د. أسامة الوريكات" : "Dr. Osama Alwreikat"}
              </p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                {lang === "ar" 
                  ? "طبيب أمراض جلدية وتناسلية وليزر | عمان، الأردن" 
                  : lang === "tr"
                    ? "Deri ve Zührevi Hastalıklar Uzmanı | Amman, Ürdün"
                    : "Skin, Venereology & Laser Specialist | Amman, Jordan"}
              </p>
              <p className="mt-2 text-slate-300">
                {lang === "ar" 
                  ? "خريج أكاديمية غولهانة الطبية العسكرية التركية (GATA) في أنقرة. متخصّص في زراعة الخلايا الصبغية للبهاق وعلاجات ندبات حب الشباب."
                  : lang === "tr"
                    ? "Ankara Gülhane Askeri Tıp Akademisi (GATA) mezunudur. Vitiligo cerrahisi, melanosit transplantasyonu ve sivilce izi tedavilerinde uzmanlaşmıştır."
                    : "Graduate of the Turkish Military Medical Academy (GATA) in Ankara. Specialized in micro-vitiligo surgery, melanocyte transplant, and advanced acne scar reconstruction."
                }
              </p>
            </div>

            {/* Explore other projects links */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-900/60">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                {lang === "ar" ? "استكشف منتجات أخرى" : lang === "tr" ? "Diğer Projeleri Keşfet" : "Explore Other Projects"}
              </span>
              
              {/* Link to Dermosce */}
              <a 
                href="https://dermosce.wraikat.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 hover:bg-slate-950 border border-slate-900/40 hover:border-slate-800 transition duration-200 group text-xs text-right"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 group-hover:bg-teal-500 group-hover:text-white transition duration-200">
                    📚
                  </div>
                  <div className="text-right">
                    <span className="font-bold block text-slate-200 group-hover:text-teal-400 transition duration-200">Dermosce</span>
                    <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                      {lang === "ar" ? "منصة التدريب على امتحانات الجلدية" : lang === "tr" ? "Dermatoloji OSCE Sınavı Eğitim Platformu" : "Dermatology OSCE Training Platform"}
                    </span>
                  </div>
                </div>
                <span className="text-slate-600 group-hover:text-teal-400 transition duration-200 text-xs">➔</span>
              </a>

              {/* Link to Main Portfolio */}
              <a 
                href="https://wraikat.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 hover:bg-slate-950 border border-slate-900/40 hover:border-slate-800 transition duration-200 group text-xs text-right"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition duration-200">
                    🌐
                  </div>
                  <div className="text-right">
                    <span className="font-bold block text-slate-200 group-hover:text-emerald-400 transition duration-200">
                      {lang === "ar" ? "الموقع الشخصي" : lang === "tr" ? "Resmi Web Sitesi" : "Official Website"}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">wraikat.com</span>
                  </div>
                </div>
                <span className="text-slate-600 group-hover:text-emerald-400 transition duration-200 text-xs">➔</span>
              </a>
            </div>
          </div>

          {/* Guidelines/How-To Panel */}
          <div className="bg-slate-900/60 border border-slate-900 rounded-3xl p-5 shadow-xl backdrop-blur-md text-xs text-slate-300 leading-relaxed flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              🔎 {lang === "ar" ? "تعليمات الفحص الصحيح" : lang === "tr" ? "Doğru Tarama Kılavuzu" : "How to Scan Correctly"}
            </h3>

            <ul className="flex flex-col gap-3 list-decimal list-inside pr-1">
              <li>
                <span className="font-semibold text-teal-400">{lang === "ar" ? "استخدام المنظار (Dermoscope):" : lang === "tr" ? "Dermoskop Kullanımı:" : "Use a Dermoscope:"}</span>{" "}
                {lang === "ar"
                  ? "تأكد من تركيب العدسة المكبرة المخصصة للأمراض الجلدية على كاميرا الهاتف."
                  : lang === "tr"
                    ? "Telefon kamerasının üzerine uygun profesyonel dermoskop merceğini yerleştirdiğinizden emin olun."
                    : "Securely mount your professional smartphone-compatible dermoscope over the camera lens."
                }
              </li>
              <li>
                <span className="font-semibold text-teal-400">{lang === "ar" ? "الإضاءة والتوسيط:" : lang === "tr" ? "Hizalama ve Işık:" : "Lighting & Alignment:"}</span>{" "}
                {lang === "ar"
                  ? "وسط الشامة أو الآفة الجلدية داخل دائرة التوجيه تماماً لتسهيل تعرف النموذج عليها."
                  : lang === "tr"
                    ? "Modelin lezyonu kolayca tanımlayabilmesi için hedef beni/lezyonu vizör dairesinin tam ortasına getirin."
                    : "Center the target mole/lesion completely inside the viewport target circle."
                }
              </li>
              <li>
                <span className="font-semibold text-teal-400">{lang === "ar" ? "الوضوح البؤري:" : lang === "tr" ? "Doğru Odaklama:" : "Optimal Focus:"}</span>{" "}
                {lang === "ar"
                  ? "تجنب الصور المهتزة أو ذات التركيز الضعيف. يفضل النقر على الشاشة لضبط التركيز."
                  : lang === "tr"
                    ? "Bulanık veya titrek fotoğraflardan kaçının. Net odaklama için ekrana dokunarak manuel odak yapın."
                    : "Ensure the camera focus is razor-sharp. Tap to focus manually if needed."
                }
              </li>
            </ul>
          </div>
        </section>

      </main>

      {/* Hidden SEO Metadata for Search Indexers & AI Search Engines */}
      <div className="sr-only" aria-hidden="true">
        <h2>DermoAI - ذكاء اصطناعي لتصنيف شامات الجلد وسرطان الجلد | د. أسامة الوريكات</h2>
        <p>تطوير الدكتور أسامة الوريكات، أخصائي أمراض الجلدية والتناسلية والليزر في عمان الأردن. خريج أكاديمية غولهانة (GATA) في أنقرة. متخصص في جراحة البهاق وزراعة الخلايا الصبغية وتجميل ندب حب الشباب.</p>
        <p>الكلمات المفتاحية: أخصائي جلدية عمان، دكتور جلدية الأردن، تشخيص سرطان الجلد بالذكاء الاصطناعي، فحص شامة سرطانية، melanoma classification, basal cell carcinoma diagnosis, squamous cell carcinoma screening, GATA dermatologist amman, vitiligo surgery jordan.</p>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 mt-12 py-6 text-center text-xs text-slate-500 max-w-5xl mx-auto w-full">
        <p>
          © {new Date().getFullYear()} DermoAI. Developed under{" "}
          <a href="https://wraikat.com" className="text-teal-400 hover:underline">
            wraikat.com
          </a>{" "}
          portfolio. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
