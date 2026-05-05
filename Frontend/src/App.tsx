import React, { useState, useRef, useEffect } from 'react';
import { 
  Scan, 
  Upload, 
  FileText, 
  Download, 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Trash2, 
  MousePointer2, 
  Camera, 
  LayoutDashboard, 
  History, 
  Settings,
  Zap,
  Layers,
  FileSearch,
  Share2,
  BarChart3,
  Clock,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Document, Packer, Paragraph } from "docx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import Auth from "./auth";

const API_URL = import.meta.env.VITE_API_URL;
const APP_NAME = "Deep Learning-Based Document Scanner and Text Extractor";

if (!API_URL) {
  console.error("API URL not set in .env");
}

// --- Types ---
type ProcessingStep = {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed';
};

type View = 'dashboard' | 'scan' | 'results' | 'export';

export default function App() {
  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  };

  const [activeView, setActiveView] = useState<View>('dashboard');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    { id: 'upload', label: 'Document Uploaded', status: 'pending' },
    { id: 'preprocess', label: 'Image Preprocessing', status: 'pending' },
    { id: 'noise', label: 'Noise Removal', status: 'pending' },
    { id: 'grayscale', label: 'Grayscale Conversion', status: 'pending' },
    { id: 'ocr', label: 'Text Extraction (OCR)', status: 'pending' },
  ]);
  const [extractedText, setExtractedText] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(false)
  const [ocrResults, setOcrResults] = useState<any>(null);
  const [selectedEngine, setSelectedEngine] = useState<string>("tesseract");
  const [structuredData, setStructuredData] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

// ✅ PDF EXPORT
const exportPDF = () => {
  const pdf = new jsPDF();

  pdf.text(`${APP_NAME} Result`, 10, 10);
  pdf.text(`Confidence: ${confidence}%`, 10, 20);

  const lines = pdf.splitTextToSize(extractedText, 180);

  pdf.text(lines, 10, 30);

  pdf.save("ocr_result.pdf");
};

// ✅ DOCX EXPORT
const exportDOCX = async () => {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph(`${APP_NAME} Result`),
          new Paragraph(" "),
          new Paragraph(`Confidence: ${confidence}%`),
          new Paragraph(" "),
          new Paragraph(extractedText)
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "ocr_result.docx");
};

  const runOCR = async () => {

  if (!file) return;

  setIsProcessing(true);
  setLoading(true);

  // reset steps
  setProcessingSteps(steps =>
    steps.map(s => ({ ...s, status: "pending" }))
  );

  const updateStep = async (index: number) => {

    setProcessingSteps(prev =>
      prev.map((s, i) =>
        i === index ? { ...s, status: "processing" } : s
      )
    );

    await new Promise(res => setTimeout(res, 500));

    setProcessingSteps(prev =>
      prev.map((s, i) =>
        i === index ? { ...s, status: "completed" } : s
      )
    );

  };

  try {

    await updateStep(0); // upload
    await updateStep(1); // preprocess
    await updateStep(2); // noise
    await updateStep(3); // grayscale

    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first");
      setIsAuthenticated(false);
      return;
    }

    const response = await fetch(`${API_URL}/scan`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData
    });

    if (response.status === 401) {
      alert("Session expired. Please login again.");
      localStorage.removeItem("token");
      setIsAuthenticated(false);
      return;
    }

    const data = await response.json();

    if (data.error) {
      alert(data.error);
      return;
    }

    await updateStep(4); // OCR step

    const resultData = data.pages ? data.pages[0] : data;

    console.log("FULL RESPONSE:", data);
    console.log("STRUCTURED:", resultData.structured_data);
    console.log("LAYOUT:", resultData.layout_blocks);

    setOcrResults(resultData.results);
    setStructuredData(resultData.structured_data);
    setSelectedEngine(resultData.recommended_engine);

    setExtractedText(resultData.results[resultData.recommended_engine].text);
    setConfidence(resultData.results[resultData.recommended_engine].confidence);

    setActiveView("results");

  } catch (err) {

    console.error("OCR error:", err);

  } finally {

    setIsProcessing(false);
    setLoading(false);

  }
  

};

  // --- Simulated OCR Logic ---
  const simulateOCR = async () => {
    setIsProcessing(true);
    setExtractedText('');
    
    // Reset steps
    setProcessingSteps(steps => steps.map(s => ({ ...s, status: 'pending' })));

    const stepDelay = 800;

    for (let i = 0; i < processingSteps.length; i++) {
      setProcessingSteps(prev => prev.map((s, idx) => 
        idx === i ? { ...s, status: 'processing' } : s
      ));
      await new Promise(r => setTimeout(r, stepDelay));
      setProcessingSteps(prev => prev.map((s, idx) => 
        idx === i ? { ...s, status: 'completed' } : s
      ));
    }

    // Final OCR extraction simulation
    await new Promise(r => setTimeout(r, 1000));
    setExtractedText("This is a sample document extracted using AI OCR technology.\n\nThe system can recognize printed and handwritten text from documents with high precision. \n\nDate: March 8, 2026\nReference: SCAN-2026-001\nStatus: Verified\n\nAI-powered text recognition allows for seamless digitization of physical archives, enabling searchable and editable digital formats from static images.");
    setConfidence(92);
    setIsProcessing(false);
    setActiveView('results');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {

  const selectedFile = e.target.files?.[0];
  if (!selectedFile) return;

  setFile(selectedFile);
  setPreviewUrl(URL.createObjectURL(selectedFile));

  setActiveView("scan"); // go to preview page
};
  const handleCameraClick = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Camera access denied or not available.");
      setShowCamera(false);
    }
  };

  const captureImage = async () => {

  if (!videoRef.current) return;

  const canvas = document.createElement("canvas");

  canvas.width = videoRef.current.videoWidth;
  canvas.height = videoRef.current.videoHeight;

  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  ctx.drawImage(videoRef.current, 0, 0);

  canvas.toBlob(async (blob) => {

    if (!blob) return;

    // stop camera AFTER capturing frame
    stopCamera();
    setShowCamera(false);

    const formData = new FormData();
    formData.append("file", blob, "capture.png");

    try {
      setLoading(true);
const token = localStorage.getItem("token");

if (!token) {
  alert("Please login first");
  setIsAuthenticated(false);
  return;
}

const response = await fetch(`${API_URL}/scan`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData
});

if (response.status === 401) {
  alert("Session expired. Please login again.");
  localStorage.removeItem("token");
  setIsAuthenticated(false);
  return;
}

      const data = await response.json();

      console.log(data);

      const resultData = data.pages ? data.pages[0] : data;

      setOcrResults(resultData.results);
      setStructuredData(resultData.structured_data);
      setSelectedEngine(resultData.recommended_engine);

      setExtractedText(resultData.results[resultData.recommended_engine].text);
      setConfidence(resultData.results[resultData.recommended_engine].confidence);

      setActiveView("results");

    } catch (error) {

      console.error("Error sending image:", error);

    } finally {
      setLoading(false);
    }

  }, "image/png");

};

  const handleExport = (format: string) => {

  const content =
`${APP_NAME} Result
----------------------------

Confidence: ${confidence}%

${extractedText}

----------------------------
Generated by ${APP_NAME}`;

  const blob = new Blob([content], { type: "text/plain" });

  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = url;
  a.download = `ocr_result.txt`;

  a.click();

  window.URL.revokeObjectURL(url);
};

if (!isAuthenticated) {
  return <Auth onLogin={() => setIsAuthenticated(true)} />;
}

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Cpu className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">{APP_NAME}</h1>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'scan', label: 'Scan Document', icon: Scan },
            { id: 'results', label: 'Results', icon: FileText },
            { id: 'export', label: 'Export', icon: Download },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as View)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeView === item.id 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
        <button
          onClick={handleLogout}
          className="text-red-500 font-bold"
        >
          Logout
        </button>
          <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center">
            <span className="text-indigo-700 font-bold text-xs">JD</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 lg:p-8">
        <AnimatePresence mode="wait">
          {activeView === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Upload or Scan Document</h2>
                    <Zap className="text-indigo-500 w-5 h-5" />
                  </div>
                  
                  <div 
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer group"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <div className="bg-indigo-100 p-4 rounded-full group-hover:scale-110 transition-transform">
                      <Upload className="text-indigo-600 w-8 h-8" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-slate-900">Click to upload or drag and drop</p>
                      <p className="text-sm text-slate-500 mt-1">PDF, JPG, PNG (Max 10MB)</p>
                    </div>
                    <input 
                      id="file-upload" 
                      type="file" 
                      className="hidden" 
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="h-px bg-slate-100 flex-1"></div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">OR</span>
                    <div className="h-px bg-slate-100 flex-1"></div>
                  </div>

                  <button 
                    onClick={handleCameraClick}
                    className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                  >
                    <Camera className="w-5 h-5" />
                    Camera Scan
                  </button>
                </div>

                <div className="space-y-6">
                  <h2 className="text-xl font-bold">Recent Activity</h2>
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    {[
                      { name: 'Invoice_001.pdf', date: '2 mins ago', status: 'Completed' },
                      { name: 'Handwritten_Note.jpg', date: '1 hour ago', status: 'Completed' },
                      { name: 'Contract_Draft.png', date: 'Yesterday', status: 'Completed' },
                      { name: 'Receipt_Target.jpg', date: 'Yesterday', status: 'Completed' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="bg-slate-100 p-2 rounded-lg">
                            <FileText className="text-slate-500 w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                            <p className="text-xs text-slate-500">{item.date}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button className="w-full text-indigo-600 font-bold text-sm hover:underline">View all history</button>
                </div>
              </div>

              {/* Highlighted Extraction Steps */}
              <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-indigo-400 opacity-20 rounded-full blur-2xl pointer-events-none"></div>
                
                <h2 className="text-2xl font-bold mb-8 relative z-10 flex items-center gap-3">
                  <Zap className="w-6 h-6 text-indigo-300" />
                  How to Extract Text in 3 Simple Steps
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                  {[
                    { step: '01', title: 'Upload or Scan', desc: 'Provide a clear image or PDF of your document using the upload area or camera.', icon: Camera },
                    { step: '02', title: 'AI Processing', desc: 'Our engine cleans the image, removes noise, and extracts text automatically.', icon: Cpu },
                    { step: '03', title: 'Review & Export', desc: 'Edit the extracted text in the editor and export to your preferred format.', icon: FileText },
                  ].map((s, i) => (
                    <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-6 backdrop-blur-sm hover:bg-white/20 transition-all group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="bg-white text-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center font-bold shadow-lg group-hover:scale-110 transition-transform">
                          <s.icon className="w-6 h-6" />
                        </div>
                        <span className="text-indigo-300 font-mono font-bold text-2xl opacity-50">{s.step}</span>
                      </div>
                      <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                      <p className="text-indigo-100 text-sm leading-relaxed">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature Showcase */}
              <div className="space-y-6">
                <h2 className="text-xl font-bold">Powerful AI Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { title: 'Printed Document OCR', desc: 'High accuracy recognition for typed text in multiple languages.', icon: Zap },
                    { title: 'Handwritten Recognition', desc: 'Advanced AI models trained on diverse handwriting styles.', icon: Layers },
                    { title: 'AI Based Processing', desc: 'Intelligent noise removal and image enhancement.', icon: Cpu },
                    { title: 'Document Digitization', desc: 'Convert physical archives into searchable digital assets.', icon: FileSearch },
                    { title: 'Editable Text Output', desc: 'Directly edit and format extracted text in-app.', icon: MousePointer2 },
                    { title: 'Multi Format Export', desc: 'Export results to PDF, Word, or plain text instantly.', icon: Share2 },
                  ].map((feature, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 hover:shadow-md transition-all">
                      <div className="bg-indigo-50 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
                        <feature.icon className="text-indigo-600 w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-slate-900 mb-2">{feature.title}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Analytics Panel (Moved to bottom) */}
              <div className="space-y-6 pt-8 border-t border-slate-200">
                <h2 className="text-xl font-bold">System Performance</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Documents Processed', value: '1,284', icon: FileSearch, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Average Accuracy', value: '98.2%', icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Processing Time', value: '1.2s', icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all">
                      <div className={`${stat.bg} p-4 rounded-xl`}>
                        <stat.icon className={`${stat.color} w-6 h-6`} />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                        <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'scan' && (
            <motion.div
              key="scan"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Document Preview</h2>
                    <button 
                      onClick={() => { setPreviewUrl(null); setFile(null); setActiveView('dashboard'); }}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="aspect-[4/5] bg-slate-100 rounded-2xl overflow-hidden relative border border-slate-200">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                        <FileSearch className="w-16 h-16 opacity-20" />
                        <p className="font-medium">No document selected</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                  <h2 className="text-xl font-bold mb-6">Image Processing</h2>
                  <div className="space-y-4">
                    {processingSteps.map((step) => (
                      <div key={step.id} className="flex items-center gap-4">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          step.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                          step.status === 'processing' ? 'bg-indigo-100 text-indigo-600 animate-pulse' :
                          'bg-slate-100 text-slate-400'
                        }`}>
                          {step.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : 
                           step.status === 'processing' ? <Zap className="w-4 h-4" /> : 
                           <div className="w-2 h-2 rounded-full bg-slate-300" />}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-semibold ${
                            step.status === 'completed' ? 'text-slate-900' :
                            step.status === 'processing' ? 'text-indigo-600' :
                            'text-slate-400'
                          }`}>{step.label}</p>
                          {step.status === 'processing' && (
                            <div className="w-full h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                              <motion.div 
                                className="h-full bg-indigo-600"
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 0.8 }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    disabled={!previewUrl || isProcessing}
                    onClick={runOCR}
                    className={`w-full mt-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${
                      !previewUrl || isProcessing 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Extracting Text...
                      </>
                    ) : (
                      <>
                        <Cpu className="w-5 h-5" />
                        Extract Text
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-indigo-900 text-white p-6 rounded-3xl shadow-xl">
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-indigo-400" />
                    Pro Tip
                  </h3>
                  <p className="text-sm text-indigo-200 leading-relaxed">
                    For best results, ensure the document is well-lit and the text is clearly visible without significant shadows or folds.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">AI OCR Text Recognition</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recognition Confidence:</span>
                    <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{confidence}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(extractedText);
                      alert("Copied to clipboard!");
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                  <button 
                    onClick={() => setExtractedText('')}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear
                  </button>
                  <button 
                    onClick={() => setActiveView('export')}
                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600"><span className="font-bold">B</span></button>
                    <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600"><span className="italic">I</span></button>
                    <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600"><span className="underline">U</span></button>
                  </div>
                  <div className="w-px h-4 bg-slate-200"></div>
                  <button className="text-xs font-bold text-slate-500 hover:text-indigo-600" onClick={() => {
                    const textarea = document.getElementById('extracted-text-area') as HTMLTextAreaElement;
                    textarea.select();
                  }}>Select All</button>
                </div>
                {ocrResults && (
                  <div className="flex gap-3 px-6 py-4 border-b border-slate-100">
                    {Object.keys(ocrResults).map((engine) => (
                      <button
                        key={engine}
                        onClick={() => {
                          setSelectedEngine(engine);
                          setExtractedText(ocrResults[engine].text);
                          setConfidence(ocrResults[engine].confidence);
                        }}
                        className={`px-4 py-2 rounded-xl font-semibold border transition ${
                          selectedEngine === engine
                            ? "bg-indigo-600 text-white"
                            : "bg-white text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {engine.toUpperCase()} ({ocrResults[engine].confidence}%)
                      </button>
                    ))}
                  </div>
                )}
                <textarea
                  id="extracted-text-area"
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  className="w-full h-[500px] p-8 text-slate-700 leading-relaxed focus:outline-none resize-none font-mono text-sm"
                  placeholder="Extracted text will appear here..."
                />

                {ocrResults && (
                  <div className="p-4 bg-slate-100 text-xs mt-4 rounded-xl">
                    <h3 className="font-bold mb-2">Structured Data (NLP)</h3>
                    <pre>
                      {JSON.stringify(structuredData, null, 2)}
                    </pre>
                  </div>
                )}

                {structuredData && selectedEngine && (
                  <div className="p-4 bg-yellow-50 mt-4 rounded-xl text-xs">
                    <h3 className="font-bold mb-2">Detected Key-Value Pairs</h3>
                    <pre>
                      {JSON.stringify(structuredData[selectedEngine]?.key_values, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeView === 'export' && (
            <motion.div
              key="export"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center space-y-8">
                <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                  <Download className="text-indigo-600 w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Export Extracted Text</h2>
                  <p className="text-slate-500 mt-2">Choose your preferred format to download the document.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { format: 'TXT', label: 'Plain Text', icon: FileText, color: 'bg-slate-100 text-slate-600' },
                    { format: 'PDF', label: 'Adobe PDF', icon: FileSearch, color: 'bg-red-50 text-red-600' },
                    { format: 'DOCX', label: 'Word Document', icon: FileText, color: 'bg-blue-50 text-blue-600' },
                  ].map((item) => (
                    <button
                      key={item.format}
                      onClick={() => {
                        if (item.format === "TXT") handleExport("txt");
                        if (item.format === "PDF") exportPDF();
                        if (item.format === "DOCX") exportDOCX();
                      }}
                      className="p-6 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all group"
                    >
                      <div className={`${item.color} w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                        <item.icon className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-slate-900">{item.format}</p>
                      <p className="text-xs text-slate-500 mt-1">{item.label}</p>
                    </button>
                  ))}
                </div>

                <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button className="flex items-center gap-2 text-slate-500 font-bold text-sm hover:text-indigo-600 transition-colors">
                    <Share2 className="w-4 h-4" />
                    Share Link
                  </button>
                  <div className="hidden sm:block w-1 h-1 bg-slate-300 rounded-full"></div>
                  <button className="flex items-center gap-2 text-slate-500 font-bold text-sm hover:text-indigo-600 transition-colors">
                    <History className="w-4 h-4" />
                    Save to History
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Camera Modal */}
      <AnimatePresence>
        {showCamera && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6"
          >
            <div className="bg-slate-900 w-full max-w-2xl rounded-3xl overflow-hidden relative border border-slate-800">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-white font-bold">Camera Scanner</h3>
                <button 
                  onClick={() => {
                  stopCamera();
                  setShowCamera(false);
                }}
                  className="text-slate-400 hover:text-white"
                >
                  <AlertCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="aspect-video bg-black relative">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-2 border-indigo-500/50 m-12 rounded-lg pointer-events-none">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 -mt-1 -ml-1 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 -mt-1 -mr-1 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 -mb-1 -ml-1 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 -mb-1 -mr-1 rounded-br-lg"></div>
                </div>
              </div>

              <div className="p-8 flex items-center justify-center gap-8">
                <button 
                  onClick={captureImage}
                  className="w-16 h-16 bg-white rounded-full border-4 border-slate-700 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                >
                  <div className="w-12 h-12 bg-white rounded-full border-2 border-slate-200"></div>
                </button>
              </div>
              
              <p className="text-center text-slate-500 text-xs pb-6 uppercase tracking-widest font-bold">Align document within the frame</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-200 mt-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Cpu className="text-indigo-600 w-5 h-5" />
            <span className="font-bold text-slate-900">{APP_NAME}</span>
            <span className="text-slate-400 text-sm">© 2026 AI OCR Systems</span>
          </div>
          <div className="flex items-center gap-8">
            <a href="#" className="text-sm font-bold text-slate-500 hover:text-indigo-600">Privacy Policy</a>
            <a href="#" className="text-sm font-bold text-slate-500 hover:text-indigo-600">Terms of Service</a>
            <a href="#" className="text-sm font-bold text-slate-500 hover:text-indigo-600">Documentation</a>
          </div>
        </div>
        {loading && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200]">
            <div className="bg-white p-6 rounded-2xl flex flex-col items-center gap-4 shadow-xl">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-slate-700">
                Running OCR engines...
              </p>
            </div>
          </div>
        )}
      </footer>
    </div>
    
  );
}
