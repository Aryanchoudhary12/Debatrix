import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get("room");
  const identity = req.nextUrl.searchParams.get("identity");
  const role = req.nextUrl.searchParams.get("role") ?? "spectator"; 

  if (!room || !identity) {
    return NextResponse.json(
      { error: "room and identity required" },
      { status: 400 },
    );
  }

  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    {
      identity,
    },
  );

  at.addGrant({
    room,
    roomJoin: true,
    canPublish: role === "debater",
    canPublishData: true,
    canSubscribe: true,
  });

  const token = await at.toJwt();
  return NextResponse.json({ token, url: process.env.LIVEKIT_URL });
}
