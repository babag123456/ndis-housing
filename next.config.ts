import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  // CLAUDE.md is the hand-written product specification. Next 16 otherwise
  // appends a self-regenerating block to it on every `next dev`.
  agentRules: false,
}

export default nextConfig
