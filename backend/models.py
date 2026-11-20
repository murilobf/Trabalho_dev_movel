from datetime import datetime, timezone

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def _agora():
    return datetime.now(timezone.utc)


class Usuario(db.Model):
    __tablename__ = "usuarios"

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), nullable=False, unique=True, index=True)
    cargo = db.Column(db.String(30), nullable=False, default="usuario")
    senha_hash = db.Column(db.String(255), nullable=False)
    criado_em = db.Column(db.DateTime, default=_agora)

    def to_dict(self):
        return {
            "id": self.id,
            "nome": self.nome,
            "email": self.email,
            "cargo": self.cargo,
            "criado_em": self.criado_em.isoformat() if self.criado_em else None,
        }


class Livro(db.Model):
    __tablename__ = "livros"

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    autor = db.Column(db.String(100), nullable=False)
    descricao = db.Column(db.String(500), nullable=True)
    criado_em = db.Column(db.DateTime, default=_agora)
    aprovado = db.Column(db.Boolean, default=False, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "nome": self.nome,
            "autor": self.autor,
            "descricao": self.descricao,
            "criado_em": self.criado_em.isoformat() if self.criado_em else None,
            "aprovado": self.aprovado,
        }


class Genero(db.Model):
    __tablename__ = "generos"

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    criado_em = db.Column(db.DateTime, default=_agora)

    def to_dict(self):
        return {
            "id": self.id,
            "nome": self.nome,
            "criado_em": self.criado_em.isoformat() if self.criado_em else None,
        }


# Relação NxM, já que um livro pode ter n gêneros
class GenerosLivros(db.Model):
    __tablename__ = "generosLivros"

    id = db.Column(db.Integer, primary_key=True)
    livro_id = db.Column(db.Integer, db.ForeignKey("livros.id"), nullable=False)
    genero_id = db.Column(db.Integer, db.ForeignKey("generos.id"), nullable=False)


class Avaliacao(db.Model):
    __tablename__ = "avaliacoes"
    __table_args__ = (
        db.UniqueConstraint("usuario_id", "livro_id", name="uq_avaliacao_usuario_livro"),
        db.CheckConstraint("nota >= 0.5 AND nota <= 5", name="ck_avaliacao_nota"),
    )

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(
        db.Integer, db.ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False
    )
    livro_id = db.Column(
        db.Integer, db.ForeignKey("livros.id", ondelete="CASCADE"), nullable=False, index=True
    )
    nota = db.Column(db.Float, nullable=False)
    texto = db.Column(db.Text, nullable=False, default="")
    contem_spoilers = db.Column(db.Boolean, nullable=False, default=False)
    criado_em = db.Column(db.DateTime, nullable=False, default=_agora)
    atualizado_em = db.Column(db.DateTime, nullable=False, default=_agora, onupdate=_agora)

    usuario = db.relationship(
        "Usuario", backref=db.backref("avaliacoes", cascade="all, delete-orphan")
    )
    livro = db.relationship(
        "Livro", backref=db.backref("avaliacoes", cascade="all, delete-orphan")
    )

    def to_dict(self):
        return {
            "id": self.id,
            "usuario_id": self.usuario_id,
            "livro_id": self.livro_id,
            "nota": self.nota,
            "texto": self.texto,
            "contem_spoilers": self.contem_spoilers,
            "criado_em": self.criado_em.isoformat() if self.criado_em else None,
            "atualizado_em": self.atualizado_em.isoformat() if self.atualizado_em else None,
        }


class ProgressoLeitura(db.Model):
    __tablename__ = "progressos_leitura"
    __table_args__ = (
        db.UniqueConstraint("usuario_id", "livro_id", name="uq_progresso_usuario_livro"),
        db.CheckConstraint("pagina_atual >= 0", name="ck_progresso_pagina"),
    )

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(
        db.Integer, db.ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False
    )
    livro_id = db.Column(
        db.Integer, db.ForeignKey("livros.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status = db.Column(db.String(20), nullable=False, default="lendo")
    formato = db.Column(db.String(10), nullable=False, default="fisico")
    pagina_atual = db.Column(db.Integer, nullable=False, default=0)
    total_paginas = db.Column(db.Integer, nullable=True)
    criado_em = db.Column(db.DateTime, nullable=False, default=_agora)
    atualizado_em = db.Column(db.DateTime, nullable=False, default=_agora, onupdate=_agora)

    usuario = db.relationship(
        "Usuario", backref=db.backref("progressos", cascade="all, delete-orphan")
    )
    livro = db.relationship(
        "Livro", backref=db.backref("progressos", cascade="all, delete-orphan")
    )

    @property
    def percentual(self):
        if self.status == "lido":
            return 100
        if self.status == "quero_ler":
            return None
        if self.total_paginas:
            return min(100, round(self.pagina_atual * 100 / self.total_paginas))
        return None

    def to_dict(self):
        return {
            "id": self.id,
            "usuario_id": self.usuario_id,
            "livro_id": self.livro_id,
            "status": self.status,
            "formato": self.formato,
            "pagina_atual": self.pagina_atual,
            "total_paginas": self.total_paginas,
            "percentual": self.percentual,
            "atualizado_em": self.atualizado_em.isoformat() if self.atualizado_em else None,
        }