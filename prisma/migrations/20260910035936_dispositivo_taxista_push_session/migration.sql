-- CreateTable
CREATE TABLE "DispositivoTaxista" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "deviceId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "expoPushToken" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaRegistro" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" DATETIME NOT NULL,
    "taxistaId" INTEGER NOT NULL,
    CONSTRAINT "DispositivoTaxista_taxistaId_fkey" FOREIGN KEY ("taxistaId") REFERENCES "Taxista" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DispositivoTaxista_deviceId_key" ON "DispositivoTaxista"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "DispositivoTaxista_sessionToken_key" ON "DispositivoTaxista"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "DispositivoTaxista_expoPushToken_key" ON "DispositivoTaxista"("expoPushToken");

-- CreateIndex
CREATE UNIQUE INDEX "DispositivoTaxista_taxistaId_key" ON "DispositivoTaxista"("taxistaId");
