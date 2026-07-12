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
        backgroundColor: "#FBF6EF",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Question */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "50px 60px 24px",
        }}
      >
        <span
          style={{
            fontSize: 44,
            fontWeight: 800,
            color: "#241A11",
            textAlign: "center",
            lineHeight: 1.2,
            maxWidth: 900,
            letterSpacing: -1,
          }}
        >
          {poll.question}
        </span>
      </div>

      {/* Options split */}
      <div
        style={{
          display: "flex",
          flex: 1,
          gap: 20,
          padding: "16px 60px 24px",
        }}
      >
        {/* Option A — coral */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#FF5B34",
            borderRadius: 24,
            padding: "20px 32px",
          }}
        >
          <span
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: "#FFFFFF",
              textAlign: "center",
            }}
          >
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
              fontSize: 18,
              fontWeight: 800,
              color: "#8A7967",
              letterSpacing: 4,
            }}
          >
            VS
          </span>
        </div>

        {/* Option B — teal */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0FA47F",
            borderRadius: 24,
            padding: "20px 32px",
          }}
        >
          <span
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: "#FFFFFF",
              textAlign: "center",
            }}
          >
            {optionB?.label ?? "Option B"}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 60px 36px",
        }}
      >
        <span style={{ fontSize: 20, fontWeight: 700, color: "#241A11" }}>
          this or that
        </span>
        <span style={{ fontSize: 16, fontWeight: 600, color: "#8A7967" }}>
          Tap to vote · live poll
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
