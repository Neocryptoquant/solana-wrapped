import { motion } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

type ErrorMessageProps = {
  message: string;
  onDismiss?: () => void;
  className?: string;
  retryAction?: () => void;
};

export default function ErrorMessage({ 
  message, 
  onDismiss, 
  className = '',
  retryAction 
}: ErrorMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`p-4 bg-red-900/30 border border-red-500/30 rounded-xl ${className}`}
    >
      <div className="flex items-start">
        <AlertCircle className="flex-shrink-0 w-5 h-5 mt-0.5 text-red-400" />
        <div className="ml-3 flex-1">
          <p className="text-sm text-red-100">{message}</p>
          {retryAction && (
            <button
              onClick={retryAction}
              className="mt-2 text-xs inline-flex items-center text-red-300 hover:text-white"
            >
              <span>Try again</span>
              <svg className="ml-1 w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-4 text-red-400 hover:text-red-200 transition-colors"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// Toast variant for non-blocking notifications
export function ErrorToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: 20, x: '-50%' }}
      className="fixed bottom-6 left-1/2 z-50 max-w-md w-full px-4"
    >
      <div className="bg-red-900/80 backdrop-blur-md border border-red-500/30 rounded-lg shadow-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="flex-shrink-0 w-5 h-5 mt-0.5 text-red-400" />
          <div className="ml-3 flex-1">
            <p className="text-sm text-red-100">{message}</p>
          </div>
          <button
            onClick={onDismiss}
            className="ml-4 text-red-400 hover:text-red-200 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
