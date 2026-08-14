/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // MUI + emotion play nicer when transpiled by Next.
  modularizeImports: {
    "@mui/icons-material": {
      transform: "@mui/icons-material/{{member}}",
    },
  },
  eslint: {
    // Lint is run separately in CI; don't block production builds on it.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
