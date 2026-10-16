-- CreateEnum
CREATE TYPE "Genero" AS ENUM ('MASCULINO', 'FEMININO', 'OUTRO', 'NAO_INFORMADO');

-- CreateEnum
CREATE TYPE "Parentesco" AS ENUM ('PAI', 'MAE', 'PADRASTO', 'MADRASTA', 'AVOS', 'IRMAOS', 'TUTOR_LEGAL', 'OUTRO');

-- CreateEnum
CREATE TYPE "Especialidade" AS ENUM ('CLINICA', 'NEUROPSICOLOGIA', 'OUTRA');

-- CreateEnum
CREATE TYPE "StatusPaciente" AS ENUM ('ATIVO', 'ARQUIVADO', 'FINALIZADO');

-- AlterTable
ALTER TABLE "psicologo" ADD COLUMN     "especialidades" "Especialidade"[];

-- CreateTable
CREATE TABLE "endereco" (
    "id_endereco" SERIAL NOT NULL,
    "logradouro" VARCHAR(255) NOT NULL,
    "numero" VARCHAR(20) NOT NULL,
    "complemento" VARCHAR(100),
    "bairro" VARCHAR(100) NOT NULL,
    "municipio" VARCHAR(100) NOT NULL,
    "estado" VARCHAR(50) NOT NULL,
    "cep" VARCHAR(9) NOT NULL,

    CONSTRAINT "endereco_pkey" PRIMARY KEY ("id_endereco")
);

-- CreateTable
CREATE TABLE "paciente" (
    "id_paciente" SERIAL NOT NULL,
    "id_psicologo" INTEGER NOT NULL,
    "id_endereco" INTEGER,
    "nome" VARCHAR(100) NOT NULL,
    "data_nascimento" DATE NOT NULL,
    "telefone" VARCHAR(15),
    "cpf" VARCHAR(11),
    "status" "StatusPaciente" NOT NULL DEFAULT 'ATIVO',
    "renda_familiar" DECIMAL(10,2),
    "genero" "Genero",
    "observacoes" TEXT,

    CONSTRAINT "paciente_pkey" PRIMARY KEY ("id_paciente")
);

-- CreateTable
CREATE TABLE "responsavel_legal" (
    "id_responsavel" SERIAL NOT NULL,
    "id_endereco" INTEGER NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "data_nascimento" DATE NOT NULL,
    "telefone" VARCHAR(15) NOT NULL,
    "cpf" VARCHAR(11) NOT NULL,
    "email" VARCHAR(255) NOT NULL,

    CONSTRAINT "responsavel_legal_pkey" PRIMARY KEY ("id_responsavel")
);

-- CreateTable
CREATE TABLE "vinculo_paciente_responsavel" (
    "id_vinculo" SERIAL NOT NULL,
    "id_paciente" INTEGER NOT NULL,
    "id_responsavel" INTEGER NOT NULL,
    "parentesco" "Parentesco" NOT NULL,

    CONSTRAINT "vinculo_paciente_responsavel_pkey" PRIMARY KEY ("id_vinculo")
);

-- CreateIndex
CREATE UNIQUE INDEX "paciente_cpf_key" ON "paciente"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "responsavel_legal_cpf_key" ON "responsavel_legal"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "vinculo_paciente_responsavel_id_paciente_id_responsavel_key" ON "vinculo_paciente_responsavel"("id_paciente", "id_responsavel");

-- AddForeignKey
ALTER TABLE "paciente" ADD CONSTRAINT "paciente_id_psicologo_fkey" FOREIGN KEY ("id_psicologo") REFERENCES "psicologo"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paciente" ADD CONSTRAINT "paciente_id_endereco_fkey" FOREIGN KEY ("id_endereco") REFERENCES "endereco"("id_endereco") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responsavel_legal" ADD CONSTRAINT "responsavel_legal_id_endereco_fkey" FOREIGN KEY ("id_endereco") REFERENCES "endereco"("id_endereco") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vinculo_paciente_responsavel" ADD CONSTRAINT "vinculo_paciente_responsavel_id_paciente_fkey" FOREIGN KEY ("id_paciente") REFERENCES "paciente"("id_paciente") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vinculo_paciente_responsavel" ADD CONSTRAINT "vinculo_paciente_responsavel_id_responsavel_fkey" FOREIGN KEY ("id_responsavel") REFERENCES "responsavel_legal"("id_responsavel") ON DELETE CASCADE ON UPDATE CASCADE;
