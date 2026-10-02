-- CreateEnum
CREATE TYPE "TokenTipo" AS ENUM ('RECUPERACAO_SENHA');

-- CreateTable
CREATE TABLE
    "psicologo" (
        "id_usuario" INTEGER NOT NULL,
        "crp" VARCHAR(7) NOT NULL,
        CONSTRAINT "psicologo_pkey" PRIMARY KEY ("id_usuario")
    );

-- CreateTable
CREATE TABLE
    "token" (
        "id_token" SERIAL NOT NULL,
        "id_usuario" INTEGER NOT NULL,
        "tipo" "TokenTipo" NOT NULL DEFAULT 'RECUPERACAO_SENHA',
        "token_hash" VARCHAR(64) NOT NULL,
        "expira_em" TIMESTAMP(6) NOT NULL,
        "usado_em" TIMESTAMP(6),
        "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "token_pkey" PRIMARY KEY ("id_token")
    );

-- CreateIndex
CREATE UNIQUE INDEX "psicologo_crp_key" ON "psicologo" ("crp");

-- CreateIndex
CREATE UNIQUE INDEX "token_token_hash_key" ON "token" ("token_hash");

-- CreateIndex
CREATE INDEX "token_id_usuario_tipo_criado_em_idx" ON "token" ("id_usuario", "tipo", "criado_em");

-- AddForeignKey
ALTER TABLE "psicologo" ADD CONSTRAINT "psicologo_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario" ("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token" ADD CONSTRAINT "token_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario" ("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;