from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.security import generate_password_hash

from models import Usuario, db


def create_app():
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///bookxd.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)
    CORS(app)  # útil se você for testar a partir do Expo web; não afeta apps nativos

    with app.app_context():
        db.create_all()

    register_routes(app)
    return app


def register_routes(app):
    @app.get("/")
    def health():
        return jsonify({"status": "ok", "service": "usuarios-api"})

    # CREATE
    @app.post("/usuarios")
    def criar_usuario():
        data = request.get_json(silent=True) or {}
        nome = data.get("nome")
        email = data.get("email")
        senha = data.get("senha")

        if not nome or not email or not senha:
            return jsonify({"erro": "nome, email e senha são obrigatórios"}), 400

        if Usuario.query.filter_by(email=email).first():
            return jsonify({"erro": "já existe um usuário com esse email"}), 409

        usuario = Usuario(
            nome=nome,
            email=email,
            senha_hash=generate_password_hash(senha),
        )
        db.session.add(usuario)
        db.session.commit()

        return jsonify(usuario.to_dict()), 201

    # READ (lista)
    @app.get("/usuarios")
    def listar_usuarios():
        usuarios = Usuario.query.order_by(Usuario.id).all()
        return jsonify([u.to_dict() for u in usuarios])

    # READ (um usuário)
    @app.get("/usuarios/<int:usuario_id>")
    def obter_usuario(usuario_id):
        usuario = Usuario.query.get(usuario_id)
        if not usuario:
            return jsonify({"erro": "usuário não encontrado"}), 404
        return jsonify(usuario.to_dict())

    # UPDATE
    @app.put("/usuarios/<int:usuario_id>")
    def atualizar_usuario(usuario_id):
        usuario = Usuario.query.get(usuario_id)
        if not usuario:
            return jsonify({"erro": "usuário não encontrado"}), 404

        data = request.get_json(silent=True) or {}

        novo_email = data.get("email")
        if novo_email and novo_email != usuario.email:
            if Usuario.query.filter_by(email=novo_email).first():
                return jsonify({"erro": "já existe um usuário com esse email"}), 409
            usuario.email = novo_email

        if data.get("nome"):
            usuario.nome = data["nome"]

        if data.get("senha"):
            usuario.senha_hash = generate_password_hash(data["senha"])

        db.session.commit()
        return jsonify(usuario.to_dict())

    # DELETE
    @app.delete("/usuarios/<int:usuario_id>")
    def deletar_usuario(usuario_id):
        usuario = Usuario.query.get(usuario_id)
        if not usuario:
            return jsonify({"erro": "usuário não encontrado"}), 404

        db.session.delete(usuario)
        db.session.commit()
        return "", 204

    @app.errorhandler(404)
    def rota_nao_encontrada(_e):
        return jsonify({"erro": "rota não encontrada"}), 404


if __name__ == "__main__":
    app = create_app()
    # host="0.0.0.0" para conseguir acessar de um celular físico na mesma rede
    app.run(host="0.0.0.0", port=5000, debug=True)
