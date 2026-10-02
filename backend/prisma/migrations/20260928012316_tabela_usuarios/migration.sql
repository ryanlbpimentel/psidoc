-- CreateTable
CREATE TABLE
    "Usuario" (
        "id_usuario" SERIAL NOT NULL,
        "nome" VARCHAR(100) NOT NULL,
        "email" VARCHAR(255) NOT NULL,
        "cpf" VARCHAR(11) NOT NULL,
        "telefone" VARCHAR(15) NOT NULL,
        "senha" VARCHAR(255) NOT NULL,
        "esta_ativo" BOOLEAN NOT NULL DEFAULT true,
        "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "atualizado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id_usuario")
    );

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario" ("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_cpf_key" ON "Usuario" ("cpf");