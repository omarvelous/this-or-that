import { ImageResponse } from "@vercel/og";

import { createAdminClient } from "@/lib/supabase/admin";

import type { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ shortId: string }> },
) {
  const { shortId } = await params;
  const supabase = createAdminClient();

  const { data: poll } = await supabase
    .from("polls")
    .select("id, question")
    .eq("short_id", shortId)
    .single();

  if (!poll) {
    return new Response("Poll not found", { status: 404 });
  }

  const { data: options } = await supabase
    .from("options")
    .select("label, position")
    .eq("poll_id", poll.id)
    .order("position");

  const optionA = options?.[0];
  const optionB = options?.[1];

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: "#0f172a",
        color: "#ffffff",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Question */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 60px 20px",
        }}
      >
        <span
          style={{
            fontSize: 40,
            fontWeight: 700,
            textAlign: "center",
            lineHeight: 1.3,
            maxWidth: 900,
          }}
        >
          {poll.question}
        </span>
      </div>

      {/* Options */}
      <div
        style={{
          display: "flex",
          flex: 1,
          gap: 24,
          padding: "20px 60px 30px",
        }}
      >
        {/* Option A */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#6366f1",
            borderRadius: 24,
            padding: "20px 30px",
          }}
        >
          <span style={{ fontSize: 32, fontWeight: 700, textAlign: "center" }}>
            {optionA?.label ?? "Option A"}
          </span>
        </div>

        {/* VS */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "#94a3b8",
              letterSpacing: 4,
            }}
          >
            VS
          </span>
        </div>

        {/* Option B */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f43f5e",
            borderRadius: 24,
            padding: "20px 30px",
          }}
        >
          <span style={{ fontSize: 32, fontWeight: 700, textAlign: "center" }}>
            {optionB?.label ?? "Option B"}
          </span>
        </div>
      </div>

      {/* Branding */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "0 60px 30px",
        }}
      >
        <span style={{ fontSize: 18, color: "#64748b", fontWeight: 600 }}>
          this or that
        </span>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    },
  );
}
