from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from collections import defaultdict

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
        data = request.get_json(silent=True)

        if not isinstance(data, dict):
            return jsonify({"erro": "envie um objeto JSON válido"}), 400

        nome = data.get("nome").strip()
        generos_ids = data.get("generos_ids")
        autor = data.get("autor").strip()
        descricao = data.get("descricao").strip()

        if not isinstance(nome, str):
            return jsonify({"erro": "nome é obrigatório"}), 400

        if not isinstance(generos_ids, list) or not generos_ids:
            return jsonify({"erro": "selecione pelo menos um gênero em generos_ids"}), 400

        if not isinstance(autor, str):
            return jsonify({"erro": "autor é obrigatório"}), 400

        if any(type(genero_id) is not int or genero_id <= 0 for genero_id in generos_ids):
            return jsonify({"erro": "generos_ids deve conter apenas IDs inteiros positivos"}), 400

        # Evita associações duplicadas, preservando a ordem enviada.
        generos_ids = list(dict.fromkeys(generos_ids))
        nome = nome.strip()

        try:
            parametros = {f"genero_{i}": genero_id for i, genero_id in enumerate(generos_ids)}
            marcadores = ", ".join(f":{chave}" for chave in parametros)
            query_generos = text(f"SELECT id FROM generos WHERE id IN ({marcadores})")
            existentes = {
                linha["id"]
                for linha in db.session.execute(query_generos, parametros).mappings().all()
            }
            if any(genero_id not in existentes for genero_id in generos_ids):
                db.session.rollback()
                return jsonify({"erro": "um ou mais gêneros não existem"}), 400

            query_livro = text("INSERT INTO livros (nome, autor, descricao) VALUES (:nome, :autor, :descricao) RETURNING id")
            livro_id = db.session.execute(query_livro, {
                "nome": nome,
                "autor": autor,
                "descricao": descricao
            }).scalar()

            query_livro_genero = text("INSERT INTO generosLivros (livro_id, genero_id) VALUES (:livro_id, :genero_id)")
            for genero_id in generos_ids:
                db.session.execute(query_livro_genero, {
                    "livro_id": livro_id,
                    "genero_id": genero_id
                })

            db.session.commit()
            return jsonify({"id": livro_id, "nome": nome, "generos_ids": generos_ids}), 201

        except Exception as e:
            db.session.rollback()
            print(e)
            return jsonify({"erro": "erro ao criar livro"}), 500
        
    # READ (todos)
    """
    TODO: implementar paginação
    """
    @app.get("/livros")
    def obter_livros():

        requisicao = request.args.to_dict()

        sql = "SELECT * FROM livros"
        condicoes = []
        parametros = {}

        nome = requisicao.get("nome")
        autor = requisicao.get("autor")
        genero_id = requisicao.get("genero_id")

        if nome:
            condicoes.append("nome LIKE :nome")
            parametros["nome"] = f"%{nome}%"

        if autor:
            condicoes.append("autor LIKE :autor")
            parametros["autor"] = f"%{autor}%"

        if genero_id:
            condicoes.append("""
                id IN (
                    SELECT livro_id
                    FROM generosLivros
                    WHERE genero_id = :genero_id
                )
            """)
            parametros["genero_id"] = genero_id

        if condicoes:
            sql += " WHERE " + " AND ".join(condicoes)

        livros = db.session.execute(
            text(sql), parametros
        ).mappings().all()

        query_relacao = text("SELECT g.nome, g.id AS genero_id, gl.id AS livro_id" \
        " FROM generos g" \
        " JOIN generosLivros gl ON g.id = gl.genero_id")

        generos_livros = db.session.execute(query_relacao).mappings().all()

        generos_por_livro = defaultdict(list)
        for g in generos_livros:
            generos_por_livro[g["livro_id"]].append({
                "id": g["genero_id"],
                "nome": g["nome"],
            })

        resultado = []
        for l in livros:
            livro = dict(l)
            livro["generos"] = generos_por_livro.get(livro["id"], [])
            resultado.append(livro)

        return jsonify(resultado)


    # READ (um específico)
    @app.get("/livros/<int:livro_id>")
    def obter_livro(livro_id=None):
        print("A")

        query = text("SELECT * FROM livros WHERE id = :id")

        livro = db.session.execute(query, {
            "id": livro_id
        }).mappings().first()

        if not livro:
                return jsonify({"erro": "Livro não encontrado"}), 404

        query_generos = text("""SELECT g.id, g.nome
        FROM generos g 
        JOIN generosLivros gl ON g.id = gl.genero_id
        WHERE gl.livro_id = :livro_id""")

        generos = db.session.execute(query_generos, {
            "livro_id": livro_id
        }).mappings().all()

        resultado = dict(livro)
        resultado["generos"] = [dict(g) for g in generos]
                
        return jsonify(resultado)

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
