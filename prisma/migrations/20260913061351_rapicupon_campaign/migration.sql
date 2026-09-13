-- AlterTable
ALTER TABLE "Carrera" ADD COLUMN "cuponCodigo" TEXT;
ALTER TABLE "Carrera" ADD COLUMN "descuentoCupon" REAL;

-- AlterTable
ALTER TABLE "ConversacionWhatsApp" ADD COLUMN "cuponPendiente" TEXT;

-- CreateTable
CREATE TABLE "CuponUso" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'RESERVADO',
    "descuento" REAL NOT NULL DEFAULT 0.50,
    "fechaReserva" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaUso" DATETIME,
    "fechaLiberado" DATETIME,
    "carreraId" INTEGER,
    CONSTRAINT "CuponUso_carreraId_fkey" FOREIGN KEY ("carreraId") REFERENCES "Carrera" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CuponUso_carreraId_key" ON "CuponUso"("carreraId");

-- CreateIndex
CREATE INDEX "CuponUso_codigo_estado_idx" ON "CuponUso"("codigo", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "CuponUso_codigo_whatsapp_key" ON "CuponUso"("codigo", "whatsapp");
