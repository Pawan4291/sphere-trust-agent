/**
 * Sphere SDK client initialization for Node.js backend agent.
 * Uses real testnet2 SDK — no mock data.
 */

import { Sphere } from "@unicitylabs/sphere-sdk";
import { createNodeProviders } from "@unicitylabs/sphere-sdk/impl/nodejs";
import { createWalletApiProviders } from "@unicitylabs/sphere-sdk/impl/shared/wallet-api";
import path from "path";
import fs from "fs";

const TESTNET2_API_KEY = "sk_ddc3cfcc001e4a28ac3fad7407f99590";
const WALLET_API_URL = "https://wallet-api.unicity.network";
const BASE_DIR = process.env.VERCEL ? "/tmp/.sphere-agent" : path.join(process.cwd(), ".sphere-agent");
const DATA_DIR = path.join(BASE_DIR, "wallet-data");
const TOKENS_DIR = path.join(BASE_DIR, "tokens-data");

let sphereInstance: Sphere | null = null;
let initPromise: Promise<Sphere> | null = null;

export async function getSphereClient(): Promise<Sphere> {
  if (sphereInstance) return sphereInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // Ensure directories exist
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.mkdirSync(TOKENS_DIR, { recursive: true });

    const base = createNodeProviders({
      network: "testnet",
      dataDir: DATA_DIR,
      tokensDir: TOKENS_DIR,
      oracle: {
        apiKey: TESTNET2_API_KEY,
      },
    });

    const providers = createWalletApiProviders(base, {
      baseUrl: WALLET_API_URL,
      network: "testnet2",
      deviceId: "trust-score-agent-v1",
    });

    const { sphere, created, generatedMnemonic } = await Sphere.init({
      ...providers,
      network: "testnet2",
      autoGenerate: true,
    });

    if (created && generatedMnemonic) {
      console.log(
        "[Agent] NEW WALLET CREATED - save this mnemonic:",
        generatedMnemonic
      );
    }

    console.log(
      "[Agent] Sphere client initialized. Address:",
      sphere.identity?.directAddress
    );

    sphereInstance = sphere;
    return sphere;
  })();

  return initPromise;
}

export function resetSphereClient() {
  sphereInstance = null;
  initPromise = null;
}
