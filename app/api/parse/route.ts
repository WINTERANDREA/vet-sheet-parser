import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { parseNoteV4 } from "@parser/parser";
import { decodeToUtf8 } from "../../../lib/encoding";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const file = url.searchParams.get("file");
    if (!file)
      return NextResponse.json(
        { error: "file query param required" },
        { status: 400 }
      );

    const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
    const p = path.join(dataDir, file);
    if (!fs.existsSync(p))
      return NextResponse.json({ error: "file not found" }, { status: 404 });

    const buf = fs.readFileSync(p);
    const raw = decodeToUtf8(buf);
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
