-- CreateTable
CREATE TABLE "SuscripcionWebPush" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaRegistro" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" DATETIME NOT NULL,
    "taxistaId" INTEGER NOT NULL,
    CONSTRAINT "SuscripcionWebPush_taxistaId_fkey" FOREIGN KEY ("taxistaId") REFERENCES "Taxista" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SuscripcionWebPush_endpoint_key" ON "SuscripcionWebPush"("endpoint");

-- CreateIndex
CREATE INDEX "SuscripcionWebPush_taxistaId_idx" ON "SuscripcionWebPush"("taxistaId");
