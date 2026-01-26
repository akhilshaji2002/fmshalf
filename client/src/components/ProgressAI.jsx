import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

export default function ProgressAI() {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [details, setDetails] = useState({
        months: '', workoutType: '', bodyFat: '', calorieGoal: '',
        age: '', gender: '', weight: '', height: '',
        daysOfWorkout: '', proteinIntake: '', sleep: '', recovery: ''
    });
    const [resultImg, setResultImg] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isDemo, setIsDemo] = useState(false);
    const inputRef = useRef(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setDetails((prev) => ({ ...prev, [name]: value }));
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (selectedFile) => {
        setFile(selectedFile);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
        };
        reader.readAsDataURL(selectedFile);
    };

    const removeFile = () => {
        setFile(null);
        setPreview(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    const [progress, setProgress] = useState(0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return alert('Please upload a photo');
        setLoading(true);
        setIsDemo(false);
        setProgress(0);

        // Simulate progress bar
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 90) return 90;
                return prev + 5;
            });
        }, 500);

        const form = new FormData();
        form.append('photo', file);
        Object.entries(details).forEach(([k, v]) => form.append(k, v));
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const token = userInfo.token;

            const res = await axios.post('/api/ai/progress', form, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                },
            });

            clearInterval(interval);
            setProgress(100);

            if (res.data.isDemo) {
                // Silently handle demo mode
                setIsDemo(true);
            }

            // Handle both URL paths (saved images) and Base64 (legacy/fallback)
            const imgData = res.data.image;
            if (imgData.startsWith('/') || imgData.startsWith('http')) {
                setResultImg(imgData);
            } else {
                setResultImg(imgData.startsWith('data:') ? imgData : `data:image/jpeg;base64,${imgData}`);
            }

        } catch (err) {
            clearInterval(interval);
            setProgress(0);
            console.error(err);
            const errMsg = err.response?.data?.message || err.message || 'Error generating image';
            alert(`Failed: ${errMsg}`);
        }
        setLoading(false);
    };

    const [showModal, setShowModal] = useState(false);
    const [history, setHistory] = useState([]);

    // Fetch history on mount
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
                const token = userInfo.token;
                if (!token) return;

                const res = await axios.get('/api/auth/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                // Sort by newest first
                setHistory(res.data.generatedImages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
            } catch (err) {
                console.error("Failed to fetch history", err);
            }
        };
        fetchHistory();
    }, []);

    const downloadImage = (url, prompt) => {
        const link = document.createElement('a');
        link.href = url.startsWith('data:') ? url : `http://localhost:5000${url}`;
        link.download = `fms-ai-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-6 bg-gray-900 text-white rounded-lg shadow-lg max-w-4xl mx-auto my-8 border border-gray-800">
            <h2 className="text-2xl mb-6 font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">AI Physique Progress</h2>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Left: Input Form */}
                <div className="w-full md:w-1/2">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Drag & Drop Zone */}
                        <div
                            className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ease-in-out flex flex-col items-center justify-center cursor-pointer
                                ${dragActive ? 'border-blue-500 bg-blue-500/10 scale-[1.02]' : 'border-gray-600 hover:border-blue-400 hover:bg-gray-800/50'}
                                ${preview ? 'p-4 border-solid border-green-500/50' : ''}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => inputRef.current?.click()}
                        >
                            <input
                                ref={inputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />

                            {preview ? (
                                <div className="relative w-full">
                                    <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded-lg shadow-md" />
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); removeFile(); }}
                                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-lg transition-transform hover:scale-110"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center pointer-events-none">
                                    <Upload className={`mx-auto h-10 w-10 mb-2 ${dragActive ? 'text-blue-400' : 'text-gray-400'}`} />
                                    <p className="text-sm font-medium text-gray-300">
                                        {dragActive ? "Drop here" : "Drag & Drop Photo"}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <input name="age" type="number" placeholder="Age" value={details.age} onChange={handleChange} className="input bg-gray-700/50 border-gray-600 rounded p-2" required />
                            <select name="gender" value={details.gender} onChange={handleChange} className="input bg-gray-700/50 border-gray-600 rounded p-2" required>
                                <option value="">Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                            <input name="weight" type="number" placeholder="Weight (kg)" value={details.weight} onChange={handleChange} className="input bg-gray-700/50 border-gray-600 rounded p-2" required />
                            <input name="height" type="number" placeholder="Height (cm)" value={details.height} onChange={handleChange} className="input bg-gray-700/50 border-gray-600 rounded p-2" required />
                            <input name="months" type="number" placeholder="Months" value={details.months} onChange={handleChange} className="input bg-gray-700/50 border-gray-600 rounded p-2" required />
                            <input name="daysOfWorkout" type="number" placeholder="Days/Week" value={details.daysOfWorkout} onChange={handleChange} className="input bg-gray-700/50 border-gray-600 rounded p-2" required />
                            <input name="workoutType" placeholder="Type (e.g. HIIT)" value={details.workoutType} onChange={handleChange} className="input bg-gray-700/50 border-gray-600 rounded p-2" required />
                            <input name="bodyFat" type="number" placeholder="Fat %" value={details.bodyFat} onChange={handleChange} className="input bg-gray-700/50 border-gray-600 rounded p-2" required />
                        </div>

                        {loading ? (
                            <div className="space-y-2">
                                <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden border border-gray-600">
                                    <div
                                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300 ease-out"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                                <p className="text-center text-xs text-blue-300 animate-pulse">Generating... {progress}%</p>
                            </div>
                        ) : (
                            <button
                                type="submit"
                                className="w-full font-bold py-3 px-6 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg transform transition hover:scale-[1.02]"
                            >
                                Generate Transformation
                            </button>
                        )}
                    </form>
                </div>

                {/* Right: History Gallery */}
                <div className="w-full md:w-1/2 border-l border-gray-700 pl-0 md:pl-8">
                    <h3 className="text-xl font-semibold mb-4 text-blue-300">Transformation History</h3>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                        {history.length === 0 ? (
                            <p className="text-gray-500 text-center italic mt-10">No generations yet. Create your first one!</p>
                        ) : (
                            history.map((item, idx) => (
                                <div key={idx} className="bg-gray-800 rounded-lg p-3 hover:bg-gray-750 transition border border-gray-700">
                                    <img src={item.imageUrl} alt="History" className="w-full h-48 object-cover rounded-md mb-3" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</span>
                                        <button
                                            onClick={() => downloadImage(item.imageUrl, item.prompt)}
                                            className="text-xs bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded transition"
                                        >
                                            Download
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Result Modal */}
            {resultImg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="relative bg-gray-900 rounded-2xl max-w-2xl w-full border border-gray-700 shadow-2xl overflow-hidden">
                        <button
                            onClick={() => setResultImg(null)}
                            className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-red-500/80 text-white p-2 rounded-full transition"
                        >
                            <X size={24} />
                        </button>

                        <div className="flex flex-col md:flex-row">
                            <div className="w-full md:w-2/3 bg-black flex items-center justify-center">
                                <img src={resultImg} alt="Generated Result" className="max-h-[80vh] w-full object-contain" />
                            </div>
                            <div className="w-full md:w-1/3 p-6 flex flex-col justify-center space-y-6">
                                <div>
                                    <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Result Ready!</h3>
                                    <p className="text-gray-400 mt-2 text-sm">Here is your AI-projected future self based on your metrics.</p>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        onClick={() => downloadImage(resultImg, 'current-result')}
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition shadow-lg flex items-center justify-center gap-2"
                                    >
                                        <span>Download Image</span>
                                    </button>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3 rounded-lg transition border border-gray-700"
                                    >
                                        Create Another
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
