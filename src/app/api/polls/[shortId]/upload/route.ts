import { NextResponse, type NextRequest } from "next/server";

import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shortId: string }> },
) {
  const { shortId } = await params;

  // 1. Auth check
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // 2. Verify poll ownership
  const { data: poll } = await supabase
    .from("polls")
    .select("id, creator_id")
    .eq("short_id", shortId)
    .single();

  if (!poll) {
    return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  }

  if (poll.creator_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 3. Parse FormData
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const optionId = formData.get("optionId") as string | null;

  if (!file || !optionId) {
    return NextResponse.json(
      { error: "file and optionId are required" },
      { status: 422 },
    );
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WebP, and GIF are allowed" },
      { status: 422 },
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File must be under 5 MB" },
      { status: 422 },
    );
  }

  // 4. Verify the option belongs to this poll
  const { data: option } = await supabase
    .from("options")
    .select("id")
    .eq("id", optionId)
    .eq("poll_id", poll.id)
    .single();

  if (!option) {
    return NextResponse.json(
      { error: "Option not found for this poll" },
      { status: 422 },
    );
  }

  // 5. Upload to Supabase Storage
  // Path: {pollId}/{optionId}/{timestamp}.{ext}
  const ext = file.name.split(".").pop() ?? "webp";
  const storagePath = `${poll.id}/${optionId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("poll-images")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("storage upload error", uploadError);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 },
    );
  }

  // 6. Get the public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("poll-images").getPublicUrl(storagePath);

  // 7. Update the option with the image URL
  const { error: updateError } = await supabase
    .from("options")
    .update({ image_url: publicUrl })
    .eq("id", optionId);

  if (updateError) {
    console.error("option image_url update error", updateError);
    return NextResponse.json(
      { error: "Failed to save image reference" },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: publicUrl }, { status: 201 });
}
