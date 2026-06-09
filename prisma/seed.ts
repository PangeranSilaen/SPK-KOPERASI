import { PrismaClient, CriterionType, ModelStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const KRITERIA: Array<{ code: string; name: string; type: CriterionType; order: number }> = [
  { code: "C1", name: "Peluang keberhasilan", type: "BENEFIT", order: 1 },
  { code: "C2", name: "Risiko kerugian koperasi", type: "COST", order: 2 },
  { code: "C3", name: "Kecepatan penyelesaian", type: "BENEFIT", order: 3 },
  { code: "C4", name: "Dampak hubungan anggota", type: "BENEFIT", order: 4 },
  { code: "C5", name: "Kesesuaian hukum", type: "BENEFIT", order: 5 },
  { code: "C6", name: "Biaya penanganan", type: "COST", order: 6 },
];

const ALTERNATIF: Array<{ code: string; name: string; order: number }> = [
  { code: "A1", name: "Surat peringatan", order: 1 },
  { code: "A2", name: "Penagihan intensif", order: 2 },
  { code: "A3", name: "Rescheduling / penjadwalan ulang", order: 3 },
  { code: "A4", name: "Restrukturisasi cicilan", order: 4 },
  { code: "A5", name: "Pendekatan persuasif", order: 5 },
  { code: "A6", name: "Mediasi dan negosiasi", order: 6 },
  { code: "A7", name: "Hapus buku", order: 7 },
];

const KONDISI: Array<{ code: string; name: string; order: number }> = [
  { code: "K1", name: "Keterlambatan pembayaran", order: 1 },
  { code: "K2", name: "Penurunan kemampuan membayar", order: 2 },
  { code: "K3", name: "Penurunan kondisi usaha", order: 3 },
  { code: "K4", name: "Kesulitan ekonomi sementara", order: 4 },
  { code: "K5", name: "Nasabah tidak kooperatif / sulit dihubungi", order: 5 },
];

async function main() {
  // 1. Akun admin
  const passwordHash = await bcrypt.hash("admin12345", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@spk.test" },
    update: {},
    create: {
      name: "Admin SPK",
      email: "admin@spk.test",
      passwordHash,
    },
  });
  console.log(`Admin: ${admin.email}`);

  // 2. Model SPK Default (ACTIVE). Idempotent: cari berdasarkan isDefault.
  let model = await prisma.decisionModel.findFirst({ where: { isDefault: true } });
  if (!model) {
    model = await prisma.decisionModel.create({
      data: {
        name: "Model SPK Default",
        description:
          "Model awal hasil seed. Data AHP dan nilai strategi belum lengkap, silakan lengkapi atau import dari XLSX.",
        status: ModelStatus.ACTIVE,
        isDefault: true,
        createdById: admin.id,
      },
    });
  }
  console.log(`Model: ${model.name} (${model.status})`);

  // 3. Expert default
  await prisma.expert.upsert({
    where: { modelId_name: { modelId: model.id, name: "Bapak Ahmad Suryanto" } },
    update: {},
    create: {
      modelId: model.id,
      name: "Bapak Ahmad Suryanto",
      position: "Manajer Kredit Koperasi Pusaka 78",
      experience: "12 tahun",
      isEnabled: true,
    },
  });

  // 4. Kriteria
  for (const k of KRITERIA) {
    await prisma.criterion.upsert({
      where: { modelId_code: { modelId: model.id, code: k.code } },
      update: { name: k.name, type: k.type, order: k.order },
      create: { modelId: model.id, code: k.code, name: k.name, type: k.type, order: k.order },
    });
  }

  // 5. Alternatif
  for (const a of ALTERNATIF) {
    await prisma.alternative.upsert({
      where: { modelId_code: { modelId: model.id, code: a.code } },
      update: { name: a.name, order: a.order },
      create: { modelId: model.id, code: a.code, name: a.name, order: a.order },
    });
  }

  // 6. Kondisi
  for (const c of KONDISI) {
    await prisma.condition.upsert({
      where: { modelId_code: { modelId: model.id, code: c.code } },
      update: { name: c.name, order: c.order },
      create: { modelId: model.id, code: c.code, name: c.name, order: c.order },
    });
  }

  console.log(
    `Seed selesai: ${KRITERIA.length} kriteria, ${ALTERNATIF.length} alternatif, ${KONDISI.length} kondisi.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
