import type { NextConfig } from "next";
/** @type {import('next').NextConfig} */
import withPWAInit, { PluginOptions } from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  swcMinify: true,
  reactStrictMode: true,
  webpack: (config) => {
    // Tell Webpack to ignore the React Native specific module
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": false,
    };

    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

export default withPWA(nextConfig);
