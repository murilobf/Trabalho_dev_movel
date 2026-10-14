from datetime import datetime, timezone

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Usuario(db.Model):
    __tablename__ = "usuarios"

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), nullable=False, unique=True, index=True)
    senha_hash = db.Column(db.String(255), nullable=False)
    criado_em = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "nome": self.nome,
            "email": self.email,
            "criado_em": self.criado_em.isoformat(),
        }

class Livro(db.Model):
    __tablename__ = "livros"

    id = db.Column(db.Integer, primary_key = True)
    nome = db.Column(db.String(100), nullable=False)
    descricao = db.Column(db.String(500), nullable=True)
    criado_em = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "nome": self.nome,
            "criado_em": self.criado_em.isoformat(),
        }

class Genero(db.Model):
    __tablename__ = "generos"

    id = db.Column(db.Integer, primary_key = True)
    nome = db.Column(db.String(100), nullable=False)
    criado_em = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    def to_dict(self):
        return {
            "id": self.id,
            "nome": self.nome,
            "criado_em": self.criado_em.isoformat(),
        }

#Relação NxM, já que um livro pode ter n generos
class GenerosLivros(db.Model):
    __tablename__ = "generosLivros"

    id = db.Column(db.Integer, primary_key = True)
    livro_id = db.Column(db.Integer, db.ForeignKey("livros.id"), nullable=False)
    genero_id = db.Column(db.Integer, db.ForeignKey("generos.id"), nullable=False)
