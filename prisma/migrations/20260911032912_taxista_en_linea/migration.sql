-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DispositivoTaxista" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "deviceId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "expoPushToken" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "enLinea" BOOLEAN NOT NULL DEFAULT true,
    "fechaRegistro" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" DATETIME NOT NULL,
    "taxistaId" INTEGER NOT NULL,
    CONSTRAINT "DispositivoTaxista_taxistaId_fkey" FOREIGN KEY ("taxistaId") REFERENCES "Taxista" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DispositivoTaxista" ("activo", "deviceId", "expoPushToken", "fechaActualizacion", "fechaRegistro", "id", "sessionToken", "taxistaId") SELECT "activo", "deviceId", "expoPushToken", "fechaActualizacion", "fechaRegistro", "id", "sessionToken", "taxistaId" FROM "DispositivoTaxista";
DROP TABLE "DispositivoTaxista";
ALTER TABLE "new_DispositivoTaxista" RENAME TO "DispositivoTaxista";
CREATE UNIQUE INDEX "DispositivoTaxista_deviceId_key" ON "DispositivoTaxista"("deviceId");
CREATE UNIQUE INDEX "DispositivoTaxista_sessionToken_key" ON "DispositivoTaxista"("sessionToken");
CREATE UNIQUE INDEX "DispositivoTaxista_expoPushToken_key" ON "DispositivoTaxista"("expoPushToken");
CREATE UNIQUE INDEX "DispositivoTaxista_taxistaId_key" ON "DispositivoTaxista"("taxistaId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
