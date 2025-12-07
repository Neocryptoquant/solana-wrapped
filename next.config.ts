import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Disable React Strict Mode for better compatibility with Web3 libraries
  reactStrictMode: false,
  // Configure environment variables
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
    NEXT_PUBLIC_TREASURY_WALLET: process.env.NEXT_PUBLIC_TREASURY_WALLET
  },
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `node:` protocol
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      os: require.resolve('os-browserify/browser'),
      path: require.resolve('path-browserify'),
    };

    // Fixes "Module not found: Can't resolve 'buffer'"
    config.resolve.alias = {
      ...config.resolve.alias,
      buffer: require.resolve('buffer/'),
      'pino-pretty': false,
    };

    // Add Buffer polyfill
    config.plugins.push(
      new (require('webpack').ProvidePlugin)({
        Buffer: ['buffer', 'Buffer'],
      })
    );

    return config;
  },
  // Add empty turbopack config to silence the warning
  experimental: {
    // Enable Webpack 5
    webpackBuildWorker: true,
  },

};

export default nextConfig;
