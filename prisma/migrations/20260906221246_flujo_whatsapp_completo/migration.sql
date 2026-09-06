-- AlterTable
ALTER TABLE "Taxista" ADD COLUMN "colorVehiculo" TEXT;
ALTER TABLE "Taxista" ADD COLUMN "cooperativa" TEXT;
ALTER TABLE "Taxista" ADD COLUMN "cuentaGuayaquil" TEXT;
ALTER TABLE "Taxista" ADD COLUMN "cuentaPichincha" TEXT;
ALTER TABLE "Taxista" ADD COLUMN "titularGuayaquil" TEXT;
ALTER TABLE "Taxista" ADD COLUMN "titularPichincha" TEXT;

-- CreateTable
CREATE TABLE "Cliente" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "whatsapp" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "fechaRegistro" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Carrera" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "nombreCliente" TEXT NOT NULL,
    "whatsappCliente" TEXT NOT NULL,
    "latitud" REAL NOT NULL,
    "longitud" REAL NOT NULL,
    "referencia" TEXT NOT NULL,
    "formaPago" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'BUSCANDO',
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaAceptacion" DATETIME,
    "fechaEnCamino" DATETIME,
    "fechaCerca" DATETIME,
    "fechaLlegada" DATETIME,
    "fechaFin" DATETIME,
    "calificacion" TEXT,
    "canceladaPor" TEXT,
    "clienteId" INTEGER,
    "taxistaId" INTEGER,
    CONSTRAINT "Carrera_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Carrera_taxistaId_fkey" FOREIGN KEY ("taxistaId") REFERENCES "Taxista" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Carrera" ("estado", "fechaAceptacion", "fechaCreacion", "formaPago", "id", "latitud", "longitud", "nombreCliente", "numero", "referencia", "taxistaId", "token", "whatsappCliente") SELECT "estado", "fechaAceptacion", "fechaCreacion", "formaPago", "id", "latitud", "longitud", "nombreCliente", "numero", "referencia", "taxistaId", "token", "whatsappCliente" FROM "Carrera";
DROP TABLE "Carrera";
ALTER TABLE "new_Carrera" RENAME TO "Carrera";
CREATE UNIQUE INDEX "Carrera_numero_key" ON "Carrera"("numero");
CREATE UNIQUE INDEX "Carrera_token_key" ON "Carrera"("token");
CREATE TABLE "new_ConversacionWhatsApp" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "telefono" TEXT NOT NULL,
    "nombre" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'NUEVO',
    "latitud" REAL,
    "longitud" REAL,
    "referencia" TEXT,
    "carreraId" INTEGER,
    "clienteId" INTEGER,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" DATETIME NOT NULL,
    CONSTRAINT "ConversacionWhatsApp_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ConversacionWhatsApp" ("estado", "fechaActualizacion", "fechaCreacion", "id", "latitud", "longitud", "nombre", "referencia", "telefono") SELECT "estado", "fechaActualizacion", "fechaCreacion", "id", "latitud", "longitud", "nombre", "referencia", "telefono" FROM "ConversacionWhatsApp";
DROP TABLE "ConversacionWhatsApp";
ALTER TABLE "new_ConversacionWhatsApp" RENAME TO "ConversacionWhatsApp";
CREATE UNIQUE INDEX "ConversacionWhatsApp_telefono_key" ON "ConversacionWhatsApp"("telefono");
CREATE UNIQUE INDEX "ConversacionWhatsApp_clienteId_key" ON "ConversacionWhatsApp"("clienteId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_whatsapp_key" ON "Cliente"("whatsapp");
