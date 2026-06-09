import { NextResponse } from "next/server";
import { createElement, type ReactElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { getSession } from "@/lib/auth";
import {
  calculateRecommendation,
  CalculationError,
} from "@/server/services/calculation-service";
import { ResultPdf } from "@/components/calculation/result-pdf";
import { formatDateId } from "@/lib/format-date";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const modelId = searchParams.get("modelId");
  const conditionId = searchParams.get("conditionId");
  const expertIdsRaw = searchParams.get("expertIds");
  const customerName = searchParams.get("customerName")?.trim() || undefined;

  if (!modelId || !conditionId || !expertIdsRaw) {
    return NextResponse.json({ error: "Parameter tidak lengkap." }, { status: 400 });
  }

  const expertIds = expertIdsRaw.split(",").filter(Boolean);

  try {
    const result = await calculateRecommendation({ modelId, conditionId, expertIds });
    const element = createElement(ResultPdf, {
      result,
      exportedAt: formatDateId(new Date()),
      customerName,
    }) as ReactElement<DocumentProps>;
    const buffer = await renderToBuffer(element);

    const safeName = result.model.name.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
    const fileName = `hasil-spk-${safeName}-${result.condition.code}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${fileName}"`,
      },
    });
  } catch (e) {
    if (e instanceof CalculationError) {
      return NextResponse.json({ error: e.message, problems: e.problems }, { status: 400 });
    }
    return NextResponse.json({ error: "Gagal membuat PDF." }, { status: 500 });
  }
}
