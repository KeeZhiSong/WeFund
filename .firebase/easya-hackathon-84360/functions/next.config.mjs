// next.config.mjs
var nextConfig = {
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  images: {
    unoptimized: true
  }
};
var next_config_default = nextConfig;
export {
  next_config_default as default
};
