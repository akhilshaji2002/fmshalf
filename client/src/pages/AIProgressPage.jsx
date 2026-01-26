import React from 'react';
import ProgressAI from '../components/ProgressAI';
import { Sparkles } from 'lucide-react';

const AIProgressPage = () => {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-white italic tracking-tighter flex items-center gap-3">
                        <Sparkles className="text-blue-400" size={36} />
                        AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">PROGRESS VISION</span>
                    </h1>
                    <p className="text-gray-400 mt-2 max-w-2xl">
                        Visualize your future physique with our advanced AI technology. Upload your current photo and set your fitness goals to see what's possible.
                    </p>
                </div>
            </div>

            <ProgressAI />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <div className="glass-card p-6 border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-2">💡 Smart Analysis</h3>
                    <p className="text-sm text-gray-400">Our AI analyzes your body composition and projects realistic muscle growth and fat loss based on your specific inputs.</p>
                </div>
                <div className="glass-card p-6 border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-2">🎯 Goal Oriented</h3>
                    <p className="text-sm text-gray-400">Whether it's hypertrophy, strength, or weight loss, the visualization adapts to your specific training style.</p>
                </div>
                <div className="glass-card p-6 border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-2">✨ Stay Motivated</h3>
                    <p className="text-sm text-gray-400">See the result of consistency before you even start. Use this image as your daily motivation to keep pushing.</p>
                </div>
            </div>
        </div>
    );
};

export default AIProgressPage;
