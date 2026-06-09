import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { parseWorkbook, ParseError } from "@/lib/import/xlsx-parser";
import { validateParsedWorkbook } from "@/lib/import/import-validator";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Sesi tidak valid. Silakan login ulang." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return NextResponse.json(
      {
        error:
          "Format file tidak sesuai. Pastikan file berformat XLSX dan memiliki sheet yang diperlukan.",
      },
      { status: 400 },
    );
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const parsed = parseWorkbook(buffer);
    const validation = validateParsedWorkbook(parsed);

    return NextResponse.json({
      fileName: file.name,
      summary: validation.summary,
      errors: validation.errors,
      warnings: validation.warnings,
      preview: {
        experts: parsed.experts.map((e) => e.name),
        criteria: parsed.criteria.map((c) => ({ code: c.code, name: c.name, type: c.type })),
        alternatives: parsed.alternatives.map((a) => ({ code: a.code, name: a.name })),
        conditions: parsed.conditions.map((k) => ({ code: k.code, name: k.name })),
      },
    });
  } catch (e) {
    if (e instanceof ParseError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Gagal membaca file. Pastikan file XLSX tidak rusak." },
      { status: 400 },
    );
  }
}
