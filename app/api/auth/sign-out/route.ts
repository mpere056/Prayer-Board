import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set("prayer-board-session", "", { httpOnly: true, maxAge: 0, path: "/" });
  return response;
}
