-- CreateTable
CREATE TABLE "consulta" (
    "id_consulta" SERIAL NOT NULL,
    "id_psicologo" INTEGER NOT NULL,
    "id_paciente" INTEGER NOT NULL,
    "inicio" TIMESTAMP(6) NOT NULL,
    "fim" TIMESTAMP(6) NOT NULL,
    "local" VARCHAR(255) NOT NULL,

    CONSTRAINT "consulta_pkey" PRIMARY KEY ("id_consulta")
);

-- CreateIndex
CREATE INDEX "consulta_id_psicologo_inicio_idx" ON "consulta"("id_psicologo", "inicio");

-- AddForeignKey
ALTER TABLE "consulta" ADD CONSTRAINT "consulta_id_psicologo_fkey" FOREIGN KEY ("id_psicologo") REFERENCES "psicologo"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulta" ADD CONSTRAINT "consulta_id_paciente_fkey" FOREIGN KEY ("id_paciente") REFERENCES "paciente"("id_paciente") ON DELETE CASCADE ON UPDATE CASCADE;
