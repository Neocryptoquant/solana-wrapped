import { motion } from 'framer-motion';
import { Twitter, Link as LinkIcon, Copy, Check } from 'lucide-react';
import { useState } from 'react';

type ShareButtonProps = {
  url: string;
  title?: string;
  text?: string;
  hashtags?: string[];
  className?: string;
};

export default function ShareButton({ 
  url, 
  title = 'Check out my Solana Wrapped!',
  text = 'Just checked my Solana Wrapped - here\'s my 2025 in review!',
  hashtags = ['Solana', 'SolanaWrapped'],
  className = ''
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  
  const shareOnTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}&hashtags=${hashtags.join(',')}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={shareOnTwitter}
        className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
        aria-label="Share on Twitter"
      >
        <Twitter className="w-5 h-5" />
        <span>Share on X</span>
      </motion.button>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={copyToClipboard}
        className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-lg font-medium transition-colors border border-white/20"
        aria-label={copied ? 'Copied!' : 'Copy link'}
      >
        {copied ? (
          <>
            <Check className="w-5 h-5 text-green-400" />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <LinkIcon className="w-5 h-5" />
            <span>Copy Link</span>
          </>
        )}
      </motion.button>
    </div>
  );
}
