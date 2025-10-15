import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
export async function GET() {
  const dataDir = path.join(process.cwd(), 'data');
  let files: { name: string; size: number }[] = [];
  try {
    const names = fs.readdirSync(dataDir).filter(n => n.toLowerCase().endsWith('.txt'));
    files = names.map((n) => {
      const stat = fs.statSync(path.join(dataDir, n));
      return { name: n, size: stat.size };
    });
  } catch {}
  return NextResponse.json(files);
}
