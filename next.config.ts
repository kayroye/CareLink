import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development", // Enable in prod only for cleaner dev experience
});

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {},
};

export default withSerwist(nextConfig);
