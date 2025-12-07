'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Share2, X, Twitter, Link as LinkIcon, Copy, Check, Diamond, Clock, ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { usePathname } from 'next/navigation';
import ShareableImage from './ShareableImage';

interface Stats {
    totalTransactions: number;
    totalGasSpent: number;
    mostActiveDay: string;
    topToken: string;
    firstActiveDate: string;
    daysOnChain: number;
    totalVolumeUSD: number;
    maxHoldingDays: number;
    highestTransaction: number;
    persona: string;
    personaWord: string;
    summary: string;
}

// Background Animation Component
const BackgroundAnimation = () => (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-green-500/20 rounded-full blur-[120px] animate-pulse delay-1000" />
        <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] animate-bounce duration-[10000ms]" />

        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
            <motion.div
                key={i}
                className="absolute bg-white/10 rounded-full"
                initial={{
                    x: Math.random() * window.innerWidth,
                    y: Math.random() * window.innerHeight,
                    opacity: 0
                }}
                animate={{
                    y: [null, Math.random() * -100],
                    opacity: [0, 0.5, 0]
                }}
                transition={{
                    duration: Math.random() * 5 + 5,
                    repeat: Infinity,
                    ease: "linear",
                    delay: Math.random() * 5
                }}
                style={{
                    width: Math.random() * 4 + 1,
                    height: Math.random() * 4 + 1,
                }}
            />
        ))}
    </div>
);

export default function WrappedStory({ stats, walletAddress }: { stats: Stats; walletAddress: string }) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [showShareModal, setShowShareModal] = useState(false);
    const touchStart = useRef(0);

    const slides = [
        {
            id: 'intro',
            bg: 'bg-black', // Background handled by global animation
            content: (
                <div className="text-center space-y-6">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-600 to-green-400 rounded-2xl p-[2px]"
                    >
                        <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center">
                            <span className="text-4xl">🎁</span>
                        </div>
                    </motion.div>
                    <h1 className="text-5xl font-black tracking-tighter">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-green-400">
                            2025
                        </span>
                        <br />
                        Wrapped
                    </h1>
                    <p className="text-xl text-gray-400">Your on-chain year in review</p>
                </div>
            ),
        },
        {
            id: 'persona',
            bg: 'bg-black',
            content: (
                <div className="text-center space-y-6">
                    <div className="text-7xl mb-4 animate-bounce">🎭</div>
                    <h2 className="text-2xl font-bold text-purple-400">You are...</h2>
                    <div className="space-y-4">
                        <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-orange-500">
                            {stats.personaWord || stats.persona}
                        </p>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
                            <p className="text-lg text-gray-200 italic leading-relaxed">
                                "{stats.summary}"
                            </p>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            id: 'gas',
            bg: 'bg-black',
            content: (
                <div className="text-center space-y-6">
                    <Flame className="w-24 h-24 mx-auto text-orange-500 animate-pulse" />
                    <h2 className="text-3xl font-bold text-orange-400">Gas Guzzler</h2>
                    <div className="space-y-2">
                        <p className="text-gray-400">You burnt</p>
                        <p className="text-5xl font-black text-white">{stats.totalGasSpent?.toFixed(4) || 0} SOL</p>
                        <p className="text-gray-400">on fees</p>
                    </div>
                </div>
            ),
        },
        {
            id: 'diamond-hands',
            bg: 'bg-black',
            content: (
                <div className="text-center space-y-6">
                    <div className="text-7xl mb-4">💎</div>
                    <h2 className="text-3xl font-bold text-blue-400">Diamond Hands</h2>
                    <div className="space-y-4">
                        <div>
                            <p className="text-gray-400 mb-1">Longest Hold</p>
                            <p className="text-4xl font-black text-white">{stats.maxHoldingDays || 0} Days</p>
                        </div>
                        <div className="h-px bg-white/10 w-24 mx-auto" />
                        <div>
                            <p className="text-gray-400 mb-1">Days on Chain</p>
                            <p className="text-3xl font-bold text-blue-300">{stats.daysOnChain || 0}</p>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            id: 'activity',
            bg: 'bg-black',
            content: (
                <div className="text-center space-y-6">
                    <Clock className="w-24 h-24 mx-auto text-green-400" />
                    <h2 className="text-3xl font-bold text-green-400">Most Active Day</h2>
                    <div className="space-y-2">
                        <p className="text-gray-400">You were crushing it on</p>
                        <p className="text-4xl font-black text-white">{stats.mostActiveDay || 'N/A'}</p>
                    </div>
                </div>
            ),
        },
        {
            id: 'biggest-move',
            bg: 'bg-black',
            content: (
                <div className="text-center space-y-6">
                    <div className="text-7xl">💰</div>
                    <h2 className="text-3xl font-bold text-yellow-400">Biggest Move</h2>
                    <div className="space-y-2">
                        <p className="text-gray-400">Your largest single transaction</p>
                        <p className="text-5xl font-black text-white">{stats.highestTransaction?.toFixed(2) || '0'} SOL</p>
                    </div>
                </div>
            ),
        },
        {
            id: 'summary',
            bg: 'bg-black',
            content: (
                <div className="text-center space-y-6 w-full">
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-green-400 mb-6">
                        2025 Summary
                    </h2>

                    <div className="grid grid-cols-2 gap-4 text-left">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <p className="text-xs text-gray-400">Identity</p>
                            <p className="text-xl font-bold text-purple-300">{stats.personaWord}</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <p className="text-xs text-gray-400">Transactions</p>
                            <p className="text-xl font-bold text-white">{stats.totalTransactions}</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <p className="text-xs text-gray-400">Volume</p>
                            <p className="text-xl font-bold text-green-300">${Math.round(stats.totalVolumeUSD).toLocaleString()}</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <p className="text-xs text-gray-400">Gas Burnt</p>
                            <p className="text-xl font-bold text-orange-300">{stats.totalGasSpent?.toFixed(3)} SOL</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <p className="text-xs text-gray-400">On Chain</p>
                            <p className="text-xl font-bold text-blue-300">{stats.daysOnChain} Days</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <p className="text-xs text-gray-400">Max Hold</p>
                            <p className="text-xl font-bold text-yellow-300">{stats.maxHoldingDays} Days</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowShareModal(true)}
                        className="w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg"
                    >
                        <Share2 className="w-5 h-5" />
                        Share My Wrapped
                    </button>
                </div>
            ),
        }
    ];

    const nextSlide = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(curr => curr + 1);
        }
    };

    const prevSlide = () => {
        if (currentSlide > 0) {
            setCurrentSlide(curr => curr - 1);
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStart.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        const touchEnd = e.changedTouches[0].clientX;
        const diff = touchStart.current - touchEnd;

        if (Math.abs(diff) > 50) {
            if (diff > 0) nextSlide();
            else prevSlide();
        }
    };

    return (
        <div className="fixed inset-0 bg-black text-white font-sans overflow-hidden">
            <BackgroundAnimation />

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, scale: 0.9, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.1, y: -50 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="absolute inset-0 flex flex-col items-center justify-center p-6 z-10"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl relative overflow-hidden">
                        {/* Card Gloss Effect */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50" />

                        {slides[currentSlide].content}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation Dots */}
            <div className="absolute bottom-16 left-0 right-0 z-20 flex justify-center gap-2">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${currentSlide === index ? 'bg-white w-6' : 'bg-white/30'
                            }`}
                    />
                ))}
            </div>

            {/* Navigation Buttons (Desktop) */}
            <div className="absolute inset-y-0 left-0 right-0 z-10 pointer-events-none hidden md:flex items-center justify-between px-8">
                <button
                    onClick={prevSlide}
                    className={`pointer-events-auto p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-opacity ${currentSlide === 0 ? 'opacity-0' : 'opacity-100'
                        }`}
                >
                    <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                    onClick={nextSlide}
                    className={`pointer-events-auto p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-opacity ${currentSlide === slides.length - 1 ? 'opacity-0' : 'opacity-100'
                        }`}
                >
                    <ChevronRight className="w-8 h-8" />
                </button>
            </div>

            {/* Branding Footer */}
            <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">Powered by</span>
                <div className="flex items-center gap-2">
                    <img src="/logos/vialytics.png" alt="Vialytics" className="h-4 w-auto brightness-0 invert" />
                    <span className="text-xs font-bold text-gray-400">|</span>
                    <img src="/logos/solana.png" alt="Solana" className="h-3 w-auto" />
                </div>
            </div>

            {showShareModal && (
                <ShareableImage
                    stats={stats}
                    walletAddress={walletAddress}
                    onClose={() => setShowShareModal(false)}
                />
            )}
        </div>
    );
}
