-- CreateTable
CREATE TABLE "MensajeWhatsApp" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "telefono" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'text',
    "contenido" TEXT,
    "messageId" TEXT,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "cuponPendiente" TEXT,
    "atencionManual" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ConversacionWhatsApp_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ConversacionWhatsApp" ("carreraId", "clienteId", "cuponPendiente", "estado", "fechaActualizacion", "fechaCreacion", "id", "latitud", "longitud", "nombre", "referencia", "telefono") SELECT "carreraId", "clienteId", "cuponPendiente", "estado", "fechaActualizacion", "fechaCreacion", "id", "latitud", "longitud", "nombre", "referencia", "telefono" FROM "ConversacionWhatsApp";
DROP TABLE "ConversacionWhatsApp";
ALTER TABLE "new_ConversacionWhatsApp" RENAME TO "ConversacionWhatsApp";
CREATE UNIQUE INDEX "ConversacionWhatsApp_telefono_key" ON "ConversacionWhatsApp"("telefono");
CREATE UNIQUE INDEX "ConversacionWhatsApp_clienteId_key" ON "ConversacionWhatsApp"("clienteId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "MensajeWhatsApp_messageId_key" ON "MensajeWhatsApp"("messageId");

-- CreateIndex
CREATE INDEX "MensajeWhatsApp_telefono_fechaCreacion_idx" ON "MensajeWhatsApp"("telefono", "fechaCreacion");

-- CreateIndex
CREATE INDEX "MensajeWhatsApp_telefono_leido_idx" ON "MensajeWhatsApp"("telefono", "leido");
