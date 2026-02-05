export const runtime = "nodejs";

import crypto from "crypto";

function b64url(buf: Buffer) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function signHmac(payloadB64: string, secret: string) {
  const sig = crypto.createHmac("sha256", secret).update(payloadB64).digest();
  return b64url(sig);
}

export async function POST(req: Request) {
  try {
    const secret = process.env.AUTH_SECRET || "";
    if (!secret) return Response.json({ error: "Missing AUTH_SECRET env" }, { status: 500 });

    const body = await req.json().catch(() => ({}));
    const walletAddress = String(body?.walletAddress || "").trim();
    if (!walletAddress) return Response.json({ error: "Missing walletAddress" }, { status: 400 });

    const exp = Date.now() + 3 * 60 * 1000; // 3 min
    const nonce = crypto.randomBytes(16).toString("hex");

    const payload = { walletAddress, exp, nonce };
    const payloadB64 = b64url(Buffer.from(JSON.stringify(payload), "utf8"));
    const sigB64 = signHmac(payloadB64, secret);

    const challenge = `${payloadB64}.${sigB64}`;

    // Canonical message (skal matches i verify)
    const message = `Token-Gated Agent login
Wallet: ${walletAddress}
Challenge: ${challenge}`;

    return Response.json({ challenge, message, exp });
  } catch (e: any) {
    console.error("NONCE_ERROR:", e);
    return Response.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
