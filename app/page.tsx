'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, AlertTriangle, X } from 'lucide-react';
import WrappedStory from '@/components/WrappedStory';
import dynamic from 'next/dynamic';
import ErrorBoundary from '@/components/ErrorBoundary';
import ErrorMessage, { ErrorToast } from '@/components/ErrorMessage';

// Dynamically import WalletMultiButton to avoid hydration mismatch
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

const TREASURY_WALLET = process.env.NEXT_PUBLIC_TREASURY_WALLET!;
const COST_SOL = 0.01;

type Status = 'idle' | 'pending' | 'processing' | 'completed' | 'failed';

export default function Home() {
  const { publicKey, sendTransaction, connect, connected } = useWallet();
  const [status, setStatus] = useState<Status>('idle');
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [showStory, setShowStory] = useState(false);
  const [error, setError] = useState<{ message: string; isCritical?: boolean } | null>(null);
  const [showErrorToast, setShowErrorToast] = useState(false);

  // Loading state animation
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingMessages = [
    "Scanning blockchain history...",
    "Analyzing transaction patterns...",
    "Calculating gas fees...",
    "Determining your persona...",
    "Finalizing your Wrapped..."
  ];

  useEffect(() => {
    if (status === 'processing' || status === 'pending') {
      const interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
      }, 3000);
      return () => clearInterval(interval);
    }
    setLoadingStep(0);
  }, [status]);

  useEffect(() => {
    if (!publicKey) {
      setStatus('idle');
      return;
    }

    // Initial check (only if we don't have a specific ID yet, or to restore state)
    if (!currentRequestId) {
      checkStatus();
    }

    const channel = supabase
      .channel('wrapped_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wrapped_requests',
          filter: `wallet_address=eq.${publicKey.toString()}`,
        },
        (payload) => {
          console.log('Realtime Update received:', payload);
          // If we are tracking a specific ID, only update if it matches
          if (currentRequestId && payload.new.id !== currentRequestId) return;

          setStatus(payload.new.status);
          if (payload.new.status === 'completed') {
            console.log('Setting stats from realtime data:', payload.new.stats_json);
            setStats(payload.new.stats_json);
          } else if (payload.new.status === 'failed') {
            setError({
              message: payload.new.error_message || 'Processing failed',
              isCritical: true
            });
          }
        }
      )
      .subscribe();

    // Poll logic - more robust, ID-based if available
    const pollInterval = setInterval(async () => {
      if (!publicKey) return;
      if (status === 'idle' || status === 'completed') return; // Don't poll if idle or done

      try {
        let query = supabase
          .from('wrapped_requests')
          .select('*');

        if (currentRequestId) {
          query = query.eq('id', currentRequestId);
        } else {
          query = query.eq('wallet_address', publicKey.toString())
            .order('created_at', { ascending: false })
            .limit(1);
        }

        const { data, error } = await query.maybeSingle();

        if (error) console.error('Poll error:', error);

        if (data) {
          // If we found a newer request that we didn't know about, track it
          if (!currentRequestId && data.id) {
            setCurrentRequestId(data.id);
          }

          if (data.status !== status) {
            console.log(`Poll status change: ${status} -> ${data.status}`);
            setStatus(data.status);
          }

          if (data.status === 'completed') {
            setStats(data.stats_json);
            clearInterval(pollInterval);
          } else if (data.status === 'failed') {
            setError({
              message: data.error_message || 'Failed to generate your wrapped. Please try again.',
              isCritical: true
            });
            clearInterval(pollInterval);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [publicKey, currentRequestId, status]); // Re-run when requestId or status changes

  const checkStatus = useCallback(async () => {
    if (!publicKey) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('wrapped_requests')
        .select('*')
        .eq('wallet_address', publicKey.toString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        console.log('Restored state from DB:', data);
        setCurrentRequestId(data.id);
        setStatus(data.status);
        if (data.status === 'completed') {
          setStats(data.stats_json);
        } else if (data.status === 'failed') {
          setError({
            message: data.error_message || 'Failed to generate your wrapped. Please try again.',
            isCritical: true
          });
        }
      }
    } catch (err) {
      console.error('Error checking status:', err);
      setError({
        message: 'Failed to check status. Please refresh the page.',
        isCritical: true
      });
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  const handleGenerate = async () => {
    if (!publicKey) {
      setError({ message: 'Wallet not connected', isCritical: false });
      setShowErrorToast(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setStats(null); // Clear previous stats

      // Mock Signature for testing
      const signature = 'mock-signature-' + Date.now();

      // CLEANUP: Delete previous requests
      await supabase
        .from('wrapped_requests')
        .delete()
        .eq('wallet_address', publicKey.toString());

      const { data, error } = await supabase
        .from('wrapped_requests')
        .insert([{
          wallet_address: publicKey.toString(),
          tx_signature: signature,
          status: 'pending',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      console.log('Created new request:', data);
      if (data) {
        setCurrentRequestId(data.id);
        setStatus('pending');
      }

      // Show success message
      setShowErrorToast(false);

    } catch (error: any) {
      console.error('Error generating wrapped:', error);

      const errorMessage = error.message.includes('already exists')
        ? 'A request is already in progress for this wallet.'
        : 'Failed to start generation. Please try again.';

      setError({
        message: errorMessage,
        isCritical: true
      });

      setStatus('idle');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    if (status === 'failed') {
      setStatus('idle');
      setCurrentRequestId(null);
    } else {
      checkStatus();
    }
  };

  const renderErrorState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 text-center"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="p-3 bg-red-500/20 rounded-full">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Something went wrong</h3>
          <p className="text-sm text-red-300 mt-1">
            {error?.message || 'An unexpected error occurred'}
          </p>
        </div>
        <button
          onClick={handleRetry}
          className="mt-2 px-6 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-100 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    </motion.div>
  );

  if (showStory && stats) {
    return (
      <ErrorBoundary>
        <WrappedStory stats={stats} walletAddress={publicKey?.toString() || ''} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#000000] text-white p-4 overflow-hidden relative selection:bg-[#14F195] selection:text-black">
        {/* Background Gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#9945FF]/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#14F195]/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
        <div className="absolute top-[40%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[100px] opacity-50" />

        {/* Error Toast */}
        <AnimatePresence>
          {showErrorToast && error && !error.isCritical && (
            <ErrorToast
              message={error.message}
              onDismiss={() => setShowErrorToast(false)}
            />
          )}
        </AnimatePresence>

        <div className="z-10 max-w-5xl w-full text-center space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className="flex justify-center mb-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 flex items-center gap-2"
              >
                <span className="text-xs font-medium tracking-wider text-gray-300 uppercase">2025 Edition</span>
              </motion.div>
            </div>

            <h1 className="text-7xl md:text-9xl font-bold tracking-tighter">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#9945FF] via-[#14F195] to-[#14F195]">Solana</span>
              <br />
              <span className="text-white">Wrapped</span>
            </h1>
            <p className="mt-6 text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Your on-chain year in review. Uncover your <span className="text-[#14F195] font-semibold">degen stats</span>, <span className="text-[#9945FF] font-semibold">diamond hands</span>, and more.
            </p>
          </motion.div>

          <div className="flex justify-center py-8">
            <WalletMultiButton className="!bg-[#9945FF] !hover:bg-[#7c37cc] !rounded-full !px-8 !py-4 !h-auto !text-lg !font-bold !tracking-wide hover:!scale-105 transition-all shadow-lg shadow-purple-500/20" />
          </div>

          {error?.isCritical ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md mx-auto"
            >
              {renderErrorState()}
            </motion.div>
          ) : publicKey ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 max-w-md mx-auto w-full"
            >
              {loading ? (
                <div className="flex flex-col items-center gap-6 py-8 px-4 w-full">
                  <div className="relative w-24 h-24">
                    <div className="absolute inset-0 rounded-full border-4 border-purple-500/20"></div>
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-lg font-medium text-white">Syncing with Solana</p>
                    <p className="text-sm text-gray-400 max-w-xs">Fetching your on-chain history. This may take a moment...</p>
                    <div className="pt-2 w-full max-w-xs mx-auto">
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                          initial={{ width: '20%' }}
                          animate={{ width: ['20%', '80%', '50%', '90%', '60%'] }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            repeatType: "reverse"
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : status === 'idle' ? (
                <div className="space-y-6">
                  <div className="text-left space-y-2">
                    <h3 className="text-2xl font-bold">Unlock Your Stats</h3>
                    <ul className="text-gray-400 space-y-2">
                      <li className="flex items-center gap-2">✨ Total Gas Spent Analysis</li>
                      <li className="flex items-center gap-2">💎 Diamond Hands Score</li>
                      <li className="flex items-center gap-2">🌙 Trading Habits & Heatmap</li>
                    </ul>
                  </div>
                  <button
                    onClick={handleGenerate}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    Generate for {COST_SOL} SOL
                  </button>
                </div>
              ) : status === 'pending' || status === 'processing' ? (
                <div className="flex flex-col items-center gap-6 py-8 px-4 w-full">
                  <div className="relative w-32 h-32">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 animate-pulse"></div>
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                    <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-900/80 to-pink-900/80 flex items-center justify-center">
                      <motion.div
                        className="text-4xl"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        🔍
                      </motion.div>
                    </div>
                  </div>
                  <div className="text-center space-y-3">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                      Analyzing Your Journey
                    </h3>

                    <div className="h-8 flex items-center justify-center">
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={loadingStep}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-sm text-gray-300 font-medium"
                        >
                          {loadingMessages[loadingStep]}
                        </motion.p>
                      </AnimatePresence>
                    </div>

                    <div className="space-y-2 max-w-xs mx-auto pt-2">
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                          initial={{ width: '10%' }}
                          animate={{ width: ['10%', '90%', '30%', '80%', '60%'] }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            repeatType: "reverse"
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-gray-500">
                    Sit tight! We're crunching through your on-chain history
                  </div>
                </div>
              ) : status === 'completed' && stats ? (
                <div className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-2"
                  >
                    <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                      Ready! 🎉
                    </h3>
                    <p className="text-gray-300">Your 2025 Wrapped is ready to view.</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="pt-2"
                  >
                    <button
                      onClick={() => setShowStory(true)}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-5 h-5" />
                      Watch Your Wrapped
                    </button>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="pt-4 text-xs text-gray-500"
                  >
                    <button
                      onClick={() => window.location.reload()}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Start over with a different wallet
                    </button>
                    <span className="cursor-default text-gray-700 mx-2">•</span>
                    <button
                      onClick={() => setStatus('idle')}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Generate New Wrapped
                    </button>

                  </motion.div>
                </div>
              ) : (
                <div className="text-red-400">Something went wrong. Please try again.</div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6 bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 max-w-md mx-auto w-full"
            >
              <div className="space-y-4">
                <h3 className="text-2xl font-bold">Connect Your Wallet</h3>
                <p className="text-gray-400">
                  Connect your Solana wallet to view your personalized 2025 Wrapped.
                </p>
                <div className="pt-2">
                  <WalletMultiButton className="!bg-white/10 !hover:bg-white/20 !rounded-xl !px-8 !py-3 !h-auto !text-base !font-semibold backdrop-blur-md border border-white/10 transition-all w-full justify-center" />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        {/* Footer */}
        <footer className="absolute bottom-6 left-0 right-0 text-center">
          <div className="max-w-md mx-auto px-4 space-y-4">
            <div className="flex items-center justify-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
              <span className="text-sm text-gray-500">Powered by</span>
              <img src="/vialytics-logo.png" alt="Vialytics" className="h-6 w-auto" />
            </div>
            <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
              <a href="#" className="hover:text-[#14F195] transition-colors">Terms</a>
              <span>•</span>
              <a href="#" className="hover:text-[#14F195] transition-colors">Privacy</a>
              <span>•</span>
              <a href="#" className="hover:text-[#14F195] transition-colors">FAQ</a>
            </div>
          </div>
        </footer>
      </main>
    </ErrorBoundary >
  );
}
