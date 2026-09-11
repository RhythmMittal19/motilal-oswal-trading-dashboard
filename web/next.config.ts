import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next generates AGENTS.md and CLAUDE.md on every dev run. This project
  // doesn't use them, and they only add noise to the tree.
  agentRules: false,
};

export default nextConfig;
