import { NextResponse } from "next/server";

const allowedFields = ["area", "code", "name", "message"] as const;

export async function POST(request: Request) {
  const input = await request.json().catch(() => null);
  const details = Object.fromEntries(
    allowedFields.map((field) => [
      field,
      typeof input?.[field] === "string" ? input[field].slice(0, 500) : null,
    ]),
  );

  console.error("client_error", details);
  return NextResponse.json({ ok: true });
}
