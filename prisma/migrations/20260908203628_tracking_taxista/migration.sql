/*
  Warnings:

  - A unique constraint covering the columns `[trackingToken]` on the table `Carrera` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Carrera" ADD COLUMN "fechaUbicacionTaxista" DATETIME;
ALTER TABLE "Carrera" ADD COLUMN "latitudTaxista" REAL;
ALTER TABLE "Carrera" ADD COLUMN "longitudTaxista" REAL;
ALTER TABLE "Carrera" ADD COLUMN "trackingToken" TEXT;
ALTER TABLE "Carrera" ADD COLUMN "ultimaNotificacionSeguimiento" DATETIME;

-- CreateIndex
CREATE UNIQUE INDEX "Carrera_trackingToken_key" ON "Carrera"("trackingToken");
