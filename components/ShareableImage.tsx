import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, X, Twitter } from 'lucide-react';
import { toPng } from 'html-to-image';

type ShareableImageProps = {
  stats: any;
  walletAddress: string;
  onClose: () => void;
};

export default function ShareableImage({ stats, walletAddress, onClose }: ShareableImageProps) {
  const [isGenerating, setIsGenerating] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const shortAddress = walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : 'UNKNOWN';

  const backgroundImages = [
    '/backgrounds/uploaded_image_0_1765070233976.jpg',
    '/backgrounds/uploaded_image_1_1765070233976.jpg',
    '/backgrounds/uploaded_image_3_1765070233976.jpg', // Using the stadium one usually looks good
    '/backgrounds/uploaded_image_4_1765070233976.jpg'
  ];

  const [bgImage, setBgImage] = useState(backgroundImages[0]);

  const shuffleBackground = () => {
    const randomBg = backgroundImages[Math.floor(Math.random() * backgroundImages.length)];
    setBgImage(randomBg);
  };

  useEffect(() => {
    shuffleBackground();
  }, []);

  // Generate the shareable image
  useEffect(() => {
    const generateImage = async () => {
      if (!cardRef.current) return;

      try {
        setIsGenerating(true);
        // Wait for image to load
        await new Promise(resolve => setTimeout(resolve, 800)); // Increased delay for BG load

        const dataUrl = await toPng(cardRef.current, {
          quality: 1,
          pixelRatio: 2,
          backgroundColor: '#000000',
          cacheBust: true,
        });
        setImageUrl(dataUrl);
      } catch (error) {
        console.error('Error generating image:', error);
      } finally {
        setIsGenerating(false);
      }
    };

    generateImage();
  }, [stats, walletAddress, bgImage]);

  const downloadImage = () => {
    if (!imageUrl) return;

    const link = document.createElement('a');
    link.download = `solana-wrapped-${shortAddress}.png`;
    link.href = imageUrl;
    link.click();
  };

  const shareToTwitter = () => {
    const text = `I just checked out my Solana Wrapped for the year 2025! 🚀\nI identified as: ${stats?.personaWord || stats?.persona}\n\nCheck yours at: https://www.solwrapped.fun\n\n#SolanaWrapped2025 @vialyticsx @solana`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Invisible card used for image generation
  const renderCard = () => (
    <div
      ref={cardRef}
      className="w-[1200px] h-[630px] flex flex-col justify-between text-white overflow-hidden font-sans relative"
    >
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={bgImage}
          alt="Background"
          className="w-full h-full object-cover opacity-60"
          style={{ filter: 'contrast(1.2) brightness(0.8)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/30 mix-blend-multiply" />
        <div className="absolute inset-0 bg-[#08040F]/30 backdrop-blur-[1px]" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col h-full pt-12 px-16 pb-10">

        {/* 1. Header Row */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-5">
            <div className="p-1 bg-gradient-to-br from-[#9945FF] to-[#14F195] rounded-2xl shadow-lg shadow-purple-500/20">
              <img src="/logos/vialytics.png" alt="" className="w-16 h-16 rounded-xl bg-black object-contain p-2" />
            </div>
            <div>
              <h2 className="text-5xl font-black tracking-tighter leading-tight drop-shadow-xl">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#9945FF] to-[#14F195]">Solwrapped</span>.FUN
              </h2>
              <p className="text-2xl text-gray-200 mt-1 font-medium tracking-wide drop-shadow-md">2025 Review</p>
            </div>
          </div>

          <div className="text-right">
            <div className="bg-black/30 backdrop-blur-md px-6 py-3 rounded-xl border border-white/10 shadow-lg transform rotate-1">
              <span className="block text-sm text-gray-400 font-bold uppercase tracking-widest mb-1">Identity</span>
              <span className="block text-3xl font-black text-[#14F195] tracking-wide uppercase">
                {stats?.personaWord || 'UNKNOWN'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Hero Summary Section (Middle) */}
        <div className="flex-1 flex items-center justify-center py-2 mb-4">
          <div className="w-full relative text-center">
            <p className="text-4xl text-white italic font-bold leading-normal font-serif drop-shadow-lg px-12">
              "{stats?.summary || "Just vibing on Solana."}"
            </p>
          </div>
        </div>

        {/* 3. Stats Grid (Bottom) - 3x2 Layout */}
        <div className="grid grid-cols-3 gap-4 mb-10 w-full px-8">
          {/* Row 1 */}
          <StatCard
            value={stats?.persona || 'DEGEN'}
            label="Persona"
            icon="🎭"
            color="bg-purple-500"
            isText={true}
          />
          <StatCard
            value={stats?.totalTransactions?.toLocaleString() || '0'}
            label="Transactions"
            icon="⚡"
            color="bg-yellow-400"
          />
          <StatCard
            value={stats?.totalVolumeUSD ? `$${Math.round(stats.totalVolumeUSD).toLocaleString()}` : '$0'}
            label="Volume"
            icon="💸"
            color="bg-[#14F195]"
          />

          {/* Row 2 */}
          <StatCard
            value={stats?.totalGasSpent ? `${stats.totalGasSpent.toFixed(3)}` : '0'}
            label="Gas Spent"
            icon="⛽"
            color="bg-pink-500"
          />
          <StatCard
            value={stats?.highestTransaction ? `${stats.highestTransaction.toFixed(2)}` : '0'}
            label="Biggest Move"
            icon="🚀"
            color="border-orange-500"
          />
          <StatCard
            value={`${stats?.daysOnChain || 0} Days`}
            label="Active Days"
            icon="📅"
            color="bg-blue-500"
          />
        </div>

        {/* 4. Footer */}
        <div className="mt-auto pt-6 border-t border-white/10">
          <p className="text-center text-sm text-gray-400 font-medium tracking-wide">
            Powered by <span className="text-[#14F195] font-bold">Vialytics</span> on <span className="text-[#9945FF] font-bold">Solana</span> • <span className="text-white font-bold">solwrapped.fun</span>
          </p>
        </div>

      </div>
    </div>
  );

  const getPersonaEmoji = (persona?: string) => {
    if (!persona) return '🤔';
    const p = persona.toLowerCase();
    if (p.includes('chad') || p.includes('giga')) return '🗿';
    if (p.includes('whale')) return '🐋';
    if (p.includes('diamond')) return '💎';
    if (p.includes('jeet')) return '🧻';
    if (p.includes('sniper')) return '🎯';
    if (p.includes('ape') || p.includes('degen')) return '🦍';
    return '⚡';
  };

  const StatCard = ({ value, label, icon, color, isText = false }: { value: string | number; label: string; icon: string; color: string, isText?: boolean }) => (
    <div className="bg-black/60 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col items-center justify-center h-32 relative group overflow-hidden text-center">
      {/* Value - Center Stage */}
      <div className={`relative z-10 font-black tracking-tighter text-white leading-none mb-1 ${isText ? 'text-3xl' : 'text-5xl'}`}>
        {value}
      </div>

      {/* Label & Icon Row */}
      <div className="flex items-center gap-2 relative z-10 opacity-80">
        <span className="text-xl">{icon}</span>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{label}</span>
      </div>

      {/* Subtle Gradient Glow */}
      <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full opacity-20 blur-2xl ${color.replace('border-', 'bg-').split(' ')[0]}`} />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-[#0a0a0a] rounded-3xl p-6 w-full max-w-lg border border-white/10 shadow-2xl flex flex-col items-center max-h-full overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors z-20"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-2xl font-bold mb-6 text-center text-white">Share Your Wrapped</h3>

        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-12 h-[300px] w-full">
            <div className="w-16 h-16 border-4 border-[#14F195]/20 border-t-[#14F195] rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400 font-medium animate-pulse">Minting your proof of degen...</p>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center gap-6">
            <div className="w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-gray-900 group relative">
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Your Solana Wrapped"
                  className="w-full h-auto"
                />
              )}
              {/* Shuffle Button Overlay */}
              <button
                onClick={shuffleBackground}
                className="absolute bottom-3 right-3 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full border border-white/20 backdrop-blur-sm transition-all text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100"
              >
                🎲 Shuffle BG
              </button>
            </div>

            <div className="flex flex-row gap-3 w-full">
              <button
                onClick={shareToTwitter}
                className="flex-1 flex items-center justify-center gap-2 bg-black hover:bg-gray-900 text-white px-4 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] border border-white/10 shadow-lg"
              >
                <Twitter className="w-5 h-5 fill-current" />
                Share on X
              </button>

              <button
                onClick={downloadImage}
                className="flex-shrink-0 flex items-center justify-center gap-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white px-4 py-4 rounded-xl font-medium text-lg transition-all transform hover:scale-[1.02] border border-white/10"
                aria-label="Download Image"
              >
                <Download className="w-6 h-6" />
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center max-w-xs">
              Tip: Download the image first, then attach it to your tweet!
            </p>
          </div>
        )}
      </motion.div>

      {/* Invisible card for image generation - Hidden off-screen effectively but visible to renderer */}
      <div style={{ position: 'fixed', left: '200vw', top: '0', pointerEvents: 'none' }}>
        {renderCard()}
      </div>
    </div>
  );
}
