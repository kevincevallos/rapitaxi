-- CreateTable
CREATE TABLE "Taxista" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "vehiculo" TEXT NOT NULL,
    "telefono" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaRegistro" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ConversacionWhatsApp" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "telefono" TEXT NOT NULL,
    "nombre" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'NUEVO',
    "latitud" REAL,
    "longitud" REAL,
    "referencia" TEXT,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" DATETIME NOT NULL
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
    "taxistaId" INTEGER,
    CONSTRAINT "Carrera_taxistaId_fkey" FOREIGN KEY ("taxistaId") REFERENCES "Taxista" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Carrera" ("estado", "fechaAceptacion", "fechaCreacion", "formaPago", "id", "latitud", "longitud", "nombreCliente", "numero", "referencia", "token", "whatsappCliente") SELECT "estado", "fechaAceptacion", "fechaCreacion", "formaPago", "id", "latitud", "longitud", "nombreCliente", "numero", "referencia", "token", "whatsappCliente" FROM "Carrera";
DROP TABLE "Carrera";
ALTER TABLE "new_Carrera" RENAME TO "Carrera";
CREATE UNIQUE INDEX "Carrera_numero_key" ON "Carrera"("numero");
CREATE UNIQUE INDEX "Carrera_token_key" ON "Carrera"("token");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Taxista_codigo_key" ON "Taxista"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Taxista_placa_key" ON "Taxista"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "ConversacionWhatsApp_telefono_key" ON "ConversacionWhatsApp"("telefono");
