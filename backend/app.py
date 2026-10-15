from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

from models import Usuario, Genero, Livro, GenerosLivros, db
from sqlalchemy.sql import text

def create_app():
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///bookxd.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)
    CORS(app)  

    with app.app_context():
        db.create_all()

    register_routes(app)
    return app


def register_routes(app):
    @app.get("/")
    def health():
        return jsonify({"status": "ok", "service": "usuarios-api"})

    """
    =========================================================================================
    CRUD usuários
    =========================================================================================
    """
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

    # READ (por email)
    @app.get("/usuarios_email")
    def obter_usuario_email():
        email = ''
        senha = ''

        requisicao = request.args.to_dict()
        email = requisicao['email']
        senha = requisicao['senha']

        query = text("SELECT * FROM usuarios WHERE email = :email")
        usuario = db.session.execute(query, {
            "email": email,
        }).mappings().first()

        senha_correta = False
        try:
            senha_correta = check_password_hash(usuario["senha_hash"], senha)
        
        except:
            senha_correta = False
        
        if not usuario or not senha_correta:
            return jsonify({"erro": "usuário não encontrado"}), 404
        
        return jsonify(dict(usuario))

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

    """
    =========================================================================================
    CRUD Livros
    =========================================================================================
    """

    # CREATE

    @app.post("/livros")
    def criar_livro():
        data = request.get_json(silent=True) or {}
        print(data)

        nome = data.get("nome")
        genero_id = data.get("genero_id")
        descricao = data.get("descricao")

        if not nome or not genero_id:
            return jsonify({"erro": "nome e gênero são obrigatórios"}), 400

        try:
            query_livro = text("INSERT INTO livros (nome, descricao) VALUES (:nome, :descricao) RETURNING id")
            livro_id = db.session.execute(query_livro, {
                "nome": nome,
                "descricao": descricao
            }).scalar()

            query_livro_genero = text("INSERT INTO generosLivros (livro_id, genero_id) VALUES (:livro_id, :genero_id)")
            db.session.execute(query_livro_genero, {
                "livro_id": livro_id,
                "genero_id": genero_id
            })

            db.session.commit()

            return jsonify({"id": livro_id, "nome": nome}), 201

        except:
            return jsonify({"erro": "erro ao criar livro"}), 500

    # READ (todos)
    """
    TODO: implementar paginação
    """
    @app.get("/livros")
    def obter_livros():
        query = text("SELECT * FROM livros")

        livros = db.session.execute(query).mappings().all()

        return jsonify([dict(l) for l in livros])


    # READ (um específico)
    @app.get("/livros/<string:livro_id>")
    def obter_livro():
        livro_id = ''

        requisicao = request.args.to_dict()
        livro_id = requisicao["id"]
        query = text("SELECT * FROM livros WHERE id = :id")

        livro = db.session.execute(query, {
            "id": livro_id
        }).mappings().first()

        if not livro:
                return jsonify({"erro": "Livro não encontrado"}), 404
                
        return jsonify(dict(livro))

    #UPDATE
    @app.put("/livros")

    #DELETE
    @app.delete("/livros")
    def deleta_livro():
        requisicao = request.args.to_dict()
        livro_id = requisicao['id']

        query = text("DELETE FROM livros WHERE id = :id")
        db.session.execute(query, {
            "id":livro_id
        })

        db.session.commit()
        return jsonify({""}), 204

    """
    =========================================================================================
    CRUD GENERO
    =========================================================================================
    """   

    # CREATE
    @app.post("/generos")
    def cria_genero():
        data = request.get_json(silent=True)
        print(data)
        nome = data.get("nome")

        if not nome:
            return jsonify({"erro":"nome obrigatório"}),400

        query = text("INSERT INTO generos(nome) VALUES (:nome)")

        try:
            db.session.execute(query, {
                "nome":nome
            })

            db.session.commit()
            return jsonify({"nome":nome}),201

        except:
            db.session.rollback()
            return jsonify({"erro":"erro ao gerar gênero"}),500

    @app.get("/generos")
    def obter_generos():
        query = text("SELECT id, nome FROM generos ORDER BY nome")

        generos = db.session.execute(query).mappings().all()
        
        return jsonify([dict(g) for g in generos])


    # READ (um específico)
    @app.get("/generos/<string:genero_id>")
    def obter_genero():
        genero_id = ''

        requisicao = request.args.to_dict()
        genero_id = requisicao["id"]
        query = text("SELECT * FROM generos WHERE id = :id")

        genero = db.session.execute(query, {
            "id": genero_id
        }).mappings().first()

        if not genero:
                return jsonify({"erro": "Genero não encontrado"}), 404
                
        return jsonify(dict(genero))

    # UPDATE
    @app.put("/generos")

    # DELETE
    @app.delete("/generos")
    def deleta_genero():
        requisicao = request.args.to_dict()
        genero_id = requisicao['id']

        query = text("DELETE FROM generos WHERE id = :id")
        db.session.execute(query, {
            "id":genero_id
        })

        db.session.commit()
        return jsonify({""}), 204
    


    """
    =========================================================================================
    AUXILIARES
    =========================================================================================
    """
    @app.errorhandler(404)
    def rota_nao_encontrada(_e):
        return jsonify({"erro": "rota não encontrada"}), 404


if __name__ == "__main__":
    app = create_app()
    # host="0.0.0.0" para conseguir acessar de um celular físico na mesma rede
    app.run(host="0.0.0.0", port=5000, debug=True)
