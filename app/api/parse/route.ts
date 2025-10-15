// app/api/parse/route.ts
import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { parseNoteV4 } from "@parser/parser";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const file = url.searchParams.get("file");
    if (!file) {
      return NextResponse.json(
        { error: "file query param required" },
        { status: 400 }
      );
    }

    const dataDir = path.join(process.cwd(), "data");
    const p = path.join(dataDir, file);

    if (!fs.existsSync(p)) {
      return NextResponse.json({ error: "file not found" }, { status: 404 });
    }

    const raw = fs.readFileSync(p, "utf8");
    const parsed = parseNoteV4(raw, true);

    return NextResponse.json({ parsed, raw }, { status: 200 });
  } catch (e: any) {
    console.error("[parse] error:", e);
    return NextResponse.json(
      { error: e?.message || String(e) },
      { status: 500 }
    );
  }
}
