export const runtime = "nodejs";

import * as nacl from "tweetnacl";
import crypto from "crypto";
import { Connection, PublicKey } from "@solana/web3.js";

function b64urlToBuf(b64url: string) {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((b64url.length + 3) % 4);
  return Buffer.from(b64, "base64");
}

function verifyHmac(payloadB64: string, sigB64: string, secret: string) {
  const expected = crypto.createHmac("sha256", secret).update(payloadB64).digest();
  const got = b64urlToBuf(sigB64);
  return got.length === expected.length && crypto.timingSafeEqual(got, expected);
}

async function getMintBalanceForOwner(connection: Connection, owner: PublicKey, mint: PublicKey) {
  const resp = await connection.getParsedTokenAccountsByOwner(owner, { mint }, "confirmed");
  let uiAmount = 0;
  for (const { account } of resp.value) {
    const info: any = account.data.parsed?.info;
    uiAmount += Number(info?.tokenAmount?.uiAmount ?? 0);
  }
  return uiAmount;
}

export async function POST(req: Request) {
  try {
    const secret = process.env.AUTH_SECRET || "";
    if (!secret) return Response.json({ error: "Missing AUTH_SECRET env" }, { status: 500 });

    const RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
    const MINT_STR = process.env.TOKEN_MINT || "";
    if (!MINT_STR) return Response.json({ error: "Missing TOKEN_MINT env" }, { status: 500 });

    const body = await req.json().catch(() => ({}));
    const walletAddress = String(body?.walletAddress || "").trim();
    const message = String(body?.message || "");
    const signatureB64 = String(body?.signature || "").trim();
    const challenge = String(body?.challenge || "").trim();

    if (!walletAddress || !message || !signatureB64 || !challenge) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    // 1) Verify challenge (stateless)
    const parts = challenge.split(".");
    if (parts.length !== 2) return Response.json({ error: "Bad challenge format" }, { status: 401 });

    const [payloadB64, sigB64] = parts;
    if (!verifyHmac(payloadB64, sigB64, secret)) {
      return Response.json({ error: "Invalid challenge signature" }, { status: 401 });
    }

    const payload = JSON.parse(b64urlToBuf(payloadB64).toString("utf8")) as {
      walletAddress: string;
      exp: number;
      nonce: string;
    };

    if (payload.walletAddress !== walletAddress) {
      return Response.json({ error: "Challenge wallet mismatch" }, { status: 401 });
    }
    if (Date.now() > payload.exp) {
      return Response.json({ error: "Challenge expired" }, { status: 401 });
    }

    // 2) Ensure user signed EXACT expected message
    const expectedMessage = `Token-Gated Agent login
Wallet: ${walletAddress}
Challenge: ${challenge}`;

    if (message !== expectedMessage) {
      return Response.json({ error: "Message mismatch" }, { status: 401 });
    }

    // 3) Verify signature
    const pubkey = new PublicKey(walletAddress);
    const msgBytes = new TextEncoder().encode(message);
    const sigBytes = Uint8Array.from(Buffer.from(signatureB64, "base64"));

    const ok = nacl.sign.detached.verify(msgBytes, sigBytes, pubkey.toBytes());
    if (!ok) return Response.json({ error: "Bad signature" }, { status: 401 });

    // 4) Token check
    const connection = new Connection(RPC_URL, "confirmed");
    const mint = new PublicKey(MINT_STR);

    const balance = await getMintBalanceForOwner(connection, pubkey, mint);
    const hasAccess = balance >= 1;

    return Response.json({ verified: true, hasAccess, balance });
  } catch (e: any) {
    console.error("VERIFY_ERROR:", e);
    return Response.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
