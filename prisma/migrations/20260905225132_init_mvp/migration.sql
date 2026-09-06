-- CreateTable
CREATE TABLE "Carrera" (
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
    "fechaAceptacion" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "Carrera_numero_key" ON "Carrera"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Carrera_token_key" ON "Carrera"("token");
