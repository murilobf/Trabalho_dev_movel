from flask import Flask, g, jsonify, request
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from collections import defaultdict
from datetime import datetime, timezone
from functools import wraps

from models import Usuario, Genero, Livro, GenerosLivros, Avaliacao, ProgressoLeitura, db, _agora
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.sql import text


"""
=========================================================================================
AVALIAÇÕES: funções auxiliares
=========================================================================================
"""

NOTA_MIN = 0.5
NOTA_MAX = 5.0
TEXTO_MAX = 2000

"""
=========================================================================================
AUXILIARES
=========================================================================================
"""

def usuario_atual():
    """Lê o usuário logado a partir do header X-Usuario-Id. Retorna None se inválido."""
    valor = request.headers.get("X-Usuario-Id", "")
    if not valor.isdigit():
        return None
    return db.session.get(Usuario, int(valor))


def login_obrigatorio(funcao):
    @wraps(funcao)
    def envolvida(*args, **kwargs):
        usuario = usuario_atual()
        if not usuario:
            return jsonify({"erro": "é necessário estar logado"}), 401
        g.usuario = usuario
        return funcao(*args, **kwargs)

    return envolvida


def validar_corpo(data, criando):
    """
    Valida o JSON de criação/edição. Retorna (campos, erro).
    Na criação a nota é obrigatória; na edição só os campos enviados são alterados.
    """
    if not isinstance(data, dict):
        return None, "envie um objeto JSON válido"

    campos = {}

    if criando or "nota" in data:
        nota = data.get("nota")
        if isinstance(nota, bool) or not isinstance(nota, (int, float)):
            return None, "nota é obrigatória e deve ser um número"
        if not (NOTA_MIN <= nota <= NOTA_MAX) or (nota * 2) % 1 != 0:
            return None, "nota deve estar entre 0.5 e 5, em passos de 0.5"
        campos["nota"] = float(nota)

    if "texto" in data:
        texto = data["texto"] if data["texto"] is not None else ""
        if not isinstance(texto, str):
            return None, "texto deve ser uma string"
        texto = texto.strip()
        if len(texto) > TEXTO_MAX:
            return None, f"texto deve ter no máximo {TEXTO_MAX} caracteres"
        campos["texto"] = texto

    if "contem_spoilers" in data:
        if not isinstance(data["contem_spoilers"], bool):
            return None, "contem_spoilers deve ser verdadeiro ou falso"
        campos["contem_spoilers"] = data["contem_spoilers"]

    return campos, None


def buscar_avaliacao_do_autor(avaliacao_id):
    """
    Retorna (avaliacao, resposta_de_erro). Só o autor pode editar/excluir a própria avaliação.
    """
    avaliacao = db.session.get(Avaliacao, avaliacao_id)
    if not avaliacao:
        return None, (jsonify({"erro": "avaliação não encontrada"}), 404)
    if avaliacao.usuario_id != g.usuario.id:
        return None, (jsonify({"erro": "você só pode alterar suas próprias avaliações"}), 403)
    return avaliacao, None

"""
=========================================================================================
PROGRESSO DE LEITURA: validação
=========================================================================================
"""

STATUS_LEITURA = ("quero_ler", "lendo", "lido", "abandonado")
FORMATOS_LEITURA = ("fisico", "digital")

def validar_progresso(data):
    """Valida o JSON do progresso. Retorna (campos, erro). Só os campos enviados são alterados.

    Campos aceitos: status, formato ("fisico" | "digital"), pagina_atual, total_paginas
    e percentual (0 a 100, só para o formato digital).
    """
    if not isinstance(data, dict):
        return None, "envie um objeto JSON válido"

    campos = {}

    if "status" in data:
        if data["status"] not in STATUS_LEITURA:
            return None, f"status deve ser um de: {', '.join(STATUS_LEITURA)}"
        campos["status"] = data["status"]

    if "formato" in data:
        if data["formato"] not in FORMATOS_LEITURA:
            return None, f"formato deve ser um de: {', '.join(FORMATOS_LEITURA)}"
        campos["formato"] = data["formato"]

    if "percentual" in data:
        percentual = data["percentual"]
        if type(percentual) is not int or not 0 <= percentual <= 100:
            return None, "percentual deve ser um inteiro de 0 a 100"
        if campos.get("formato") == "fisico":
            return None, "percentual só vale para o formato digital"
        campos["percentual"] = percentual

    if "pagina_atual" in data:
        pagina = data["pagina_atual"]
        if type(pagina) is not int or pagina < 0:
            return None, "pagina_atual deve ser um inteiro maior ou igual a 0"
        campos["pagina_atual"] = pagina

    if "total_paginas" in data:
        total = data["total_paginas"]
        if total is not None and (type(total) is not int or total <= 0):
            return None, "total_paginas deve ser um inteiro positivo"
        campos["total_paginas"] = total

    return campos, None


def aplicar_progresso(atual, campos):
    """
    Calcula o novo estado do progresso a partir do estado atual e dos campos validados.
    `atual` e o retorno são dicts com: status, formato, pagina_atual, total_paginas.
    Retorna (novo_estado, erro). Não toca no banco: a rota grava o resultado.

    Regras:
    - Trocar de formato descarta o progresso do formato anterior.
    - Digital: total_paginas é sempre 100 e pagina_atual é a porcentagem.
    - "Lendo" no formato físico exige o total de páginas.
    - Ao chegar ao total (ou a 100%), o status vira "lido" automaticamente.
    - "Lido" fecha o progresso em 100%.
    """
    novo = dict(atual)
    formato_antes = atual["formato"]
    formato_novo = "digital" if "percentual" in campos else campos.get("formato", formato_antes)

    if "status" in campos:
        novo["status"] = campos["status"]

    novo["formato"] = formato_novo
    if formato_novo != formato_antes:
        novo["pagina_atual"] = 0
        novo["total_paginas"] = 100 if formato_novo == "digital" else None

    if formato_novo == "digital":
        novo["total_paginas"] = 100
        if "percentual" in campos:
            novo["pagina_atual"] = campos["percentual"]
    else:
        if "total_paginas" in campos:
            novo["total_paginas"] = campos["total_paginas"]
        if "pagina_atual" in campos:
            novo["pagina_atual"] = campos["pagina_atual"]

    total = novo["total_paginas"]
    if total and novo["pagina_atual"] > total:
        return None, "pagina_atual não pode ser maior que total_paginas"

    if novo["status"] == "lendo":
        if formato_novo == "fisico" and not total:
            return None, "informe o total de páginas do livro"
        if total and novo["pagina_atual"] >= total:
            novo["status"] = "lido"  # chegou ao fim: o livro entra na lista de lidos

    if novo["status"] == "lido" and total:
        novo["pagina_atual"] = total

    return novo, None


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
        cargo = "usuario"

        if not nome or not email or not senha:
            return jsonify({"erro": "nome, email e senha são obrigatórios"}), 400

        query_select = text("""
        SELECT * 
        FROM usuarios
        WHERE email = :email
        """)

        usuario = db.session.execute(query_select, {
            "email": email
        }).mappings().first()

        if usuario:
            return jsonify({"erro": "já existe um usuário com esse email"}), 409

        senha_hash = generate_password_hash(senha)

        query_create = text("INSERT INTO usuarios (nome, email, senha_hash, cargo) VALUES (:nome, :email, :senha_hash, :cargo)")
        db.session.execute(query_create, {
            "nome": nome,
            "email": email,
            "senha_hash": senha_hash,
            "cargo": cargo
        })

        db.session.commit()

        return jsonify({"nome":nome, "email":email, "cargo":cargo}), 201

    # READ (lista)
    @app.get("/usuarios")
    def listar_usuarios():  
        usuarios = db.session.execute(text("SELECT id, nome, email, cargo FROM usuarios")).mappings().all()
        return jsonify([dict(u) for u in usuarios]), 200

    # READ (um usuário)
    @app.get("/usuarios/<int:usuario_id>")
    def obter_usuario(usuario_id):
        query = text("SELECT nome, email, cargo FROM usuarios WHERE id = :id")
        usuario = db.session.execute(query, {"id": usuario_id}).mappings().first()
        if not usuario:
            return jsonify({"erro": "usuário não encontrado"}), 404
        
        return jsonify(dict(usuario))

    # READ (por email)
    @app.post("/login")
    def login():
        data = request.get_json(silent=True)

        if not isinstance(data, dict):
            return jsonify({"erro": "envie um objeto JSON válido"}), 400

        email = data.get("email")
        senha = data.get("senha")

        if (
            not isinstance(email, str)
            or not email.strip()
            or not isinstance(senha, str)
            or not senha
        ):
            return jsonify({"erro": "email e senha são obrigatórios"}), 400

        query = text("""
            SELECT id, nome, email, cargo, senha_hash
            FROM usuarios
            WHERE email = :email
        """)

        usuario = db.session.execute(
            query, {"email": email.strip()}
        ).mappings().first()

        if not usuario or not check_password_hash(usuario["senha_hash"], senha):
            return jsonify({"erro": "email ou senha inválidos"}), 401

        return jsonify({
            "id": usuario["id"],
            "nome": usuario["nome"],
            "email": usuario["email"],
            "cargo": usuario["cargo"],
        })

    # UPDATE
    @app.put("/usuarios/<int:usuario_id>")
    def atualizar_usuario(usuario_id):
        values = []
        params = {"usuario_id": usuario_id}

        requisicao = request.get_json(silent=True) or {}
        email = requisicao.get("email")
        nome = requisicao.get("nome")
        senha = requisicao.get("senha")
        cargo = requisicao.get("cargo")

        usuario = db.session.execute(text("SELECT * FROM usuarios WHERE id = :usuario_id"), {
            "usuario_id": usuario_id
        }).mappings().first()

        if not usuario:
            return jsonify({"erro": "usuário não encontrado"}), 404

        if email and email != usuario["email"]:
            existente = db.session.execute(text("SELECT * FROM usuarios WHERE email=:email"), {
                "email": email
            }).mappings().first()
            
            if existente:
                return jsonify({"erro": "já existe um usuário com esse email"}), 409
            
            values.append("email = :email")
            params["email"] = email

        if nome:
            values.append("nome = :nome")
            params["nome"] = nome

        if senha:
            values.append("senha_hash = :senha_hash")
            params["senha_hash"] = generate_password_hash(senha)

        if cargo:
            values.append("cargo = :cargo")
            params["cargo"] = cargo

        if not values:
            return jsonify({"erro": "nenhum campo para atualizar"}), 400

        query = "UPDATE usuarios SET " + ", ".join(values) + " WHERE id = :usuario_id"

        db.session.execute(text(query), params)

        db.session.commit()

        return "", 204

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
        aprovado = False

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

            query_livro = text("INSERT INTO livros (nome, autor, descricao, aprovado) VALUES (:nome, :autor, :descricao, :aprovado) RETURNING id")
            livro_id = db.session.execute(query_livro, {
                "nome": nome,
                "autor": autor,
                "descricao": descricao,
                "aprovado": aprovado
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
    @app.get("/livros")
    def obter_livros():

        requisicao = request.args.to_dict()
        nome = requisicao.get("nome")
        autor = requisicao.get("autor")
        genero_id = requisicao.get("genero_id")
        aprovado = requisicao.get("aprovado")
        recentes = requisicao.get("recentes")
        sql = "SELECT * FROM livros"
        condicoes = []
        parametros = {}

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

        if aprovado:
            aprovado = int(aprovado) 
            condicoes.append("aprovado = :aprovado")
            parametros["aprovado"] = aprovado

        if condicoes:
            sql += " WHERE " + " AND ".join(condicoes)

        if recentes:
            sql += " ORDER BY criado_em LIMIT 5"

        livros = db.session.execute(
            text(sql), parametros
        ).mappings().all()

        query_relacao = text("""SELECT g.nome, g.id AS genero_id, gl.livro_id AS livro_id
        FROM generos g
        JOIN generosLivros gl ON g.id = gl.genero_id""")

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
    def obter_livro(livro_id):
        livro = db.session.execute(
            text("SELECT * FROM livros WHERE id = :id"), {"id": livro_id}
        ).mappings().first()

        if not livro:
            return jsonify({"erro": "Livro não encontrado"}), 404

        generos = db.session.execute(text("""
            SELECT g.id, g.nome
            FROM generos g
            JOIN generosLivros gl ON g.id = gl.genero_id
            WHERE gl.livro_id = :livro_id"""), {"livro_id": livro_id}).mappings().all()

        resultado = dict(livro)
        resultado["generos"] = [dict(g) for g in generos]
        return jsonify(resultado)

    #UPDATE
    @app.put("/livros/<int:livro_id>")
    def atualiza_livro(livro_id):
        requisicao = request.get_json()
        nome = requisicao.get("nome")
        autor = requisicao.get("autor")
        aprovado = requisicao.get("aprovado")
        generos_ids = requisicao.get("generos_ids")
        values = []
        params = {"livro_id": livro_id}

        if nome:
            values.append("nome = :nome")
            params["nome"] = nome

        if autor:
            values.append("autor = :autor")
            params["autor"] = autor

        if aprovado:
            values.append("aprovado = :aprovado")
            params["aprovado"] = aprovado

        if generos_ids:

            db.session.execute(
                text("DELETE FROM generosLivros WHERE livro_id = :livro_id"),
                {"livro_id": livro_id}
            )

            for genero_id in generos_ids:
                db.session.execute(
                    text("""
                        INSERT INTO generosLivros (livro_id, genero_id)
                        VALUES (:livro_id, :genero_id)
                    """),
                    {"livro_id": livro_id, "genero_id": genero_id}
                )
        print(db.session.execute(text("SELECT * from generosLivros")).mappings().all())
        query = "UPDATE livros SET " + ", ".join(values) + " WHERE id = :livro_id"
        db.session.execute(text(query), params)
        db.session.commit()

        return "", 204


    #DELETE
    @app.delete("/livros/<int:livro_id>")
    def deleta_livro(livro_id):

        # O SQLite não aplica ON DELETE CASCADE por padrão: remove as avaliações do livro antes.
        db.session.execute(text("DELETE FROM avaliacoes WHERE livro_id = :id"), {"id": livro_id})
        db.session.execute(text("DELETE FROM progressos_leitura WHERE livro_id = :id"), {"id": livro_id})

        query = text("DELETE FROM livros WHERE id = :id")
        db.session.execute(query, {
            "id":livro_id
        })

        db.session.commit()
        return "", 204

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
    @app.put("/generos/<int:id>")
    def atualiza_genero(id):
        requisicao = request.get_json() or {}
        print(id, requisicao)
        nome = requisicao.get("nome")

        if not nome:
            return jsonify({"erro": "Nome não enviado"}), 400


        query = text("""UPDATE generos
        SET nome = :nome
        WHERE id = :id""")

        db.session.execute(query, {
            "nome": nome,
            "id": id
        })

        db.session.commit()

        return "", 204
    

    # DELETE
    @app.delete("/generos/<int:id>")
    def deleta_genero(id):

        query = text("DELETE FROM generos WHERE id = :id")
        db.session.execute(query, {
            "id": id
        })

        db.session.commit()
        return "", 204
    


    """
    =========================================================================================
    CRUD Avaliações
    =========================================================================================
    """


    # CREATE
    @app.post("/livros/<int:livro_id>/avaliacoes")
    @login_obrigatorio
    def criar_avaliacao(livro_id):
        if not db.session.get(Livro, livro_id):
            return jsonify({"erro": "livro não encontrado"}), 404

        campos, erro = validar_corpo(request.get_json(silent=True), criando=True)
        if erro:
            return jsonify({"erro": erro}), 400

        if Avaliacao.query.filter_by(usuario_id=g.usuario.id, livro_id=livro_id).first():
            return jsonify({"erro": "você já avaliou este livro, edite a avaliação existente"}), 409

        avaliacao = Avaliacao(usuario_id=g.usuario.id, livro_id=livro_id, **campos)
        db.session.add(avaliacao)
        try:
            db.session.commit()
        except IntegrityError:
            # Duas requisições simultâneas passaram pela checagem acima.
            db.session.rollback()
            return jsonify({"erro": "você já avaliou este livro, edite a avaliação existente"}), 409

        return jsonify(avaliacao.to_dict()), 201

    # READ (avaliação do usuário logado para um livro; retorna null se não houver)
    @app.get("/livros/<int:livro_id>/avaliacoes/minha")
    @login_obrigatorio
    def obter_minha_avaliacao(livro_id):
        avaliacao = Avaliacao.query.filter_by(usuario_id=g.usuario.id, livro_id=livro_id).first()
        return jsonify(avaliacao.to_dict() if avaliacao else None)

    # READ (lista pública de avaliações de um livro, aberta a usuários deslogados)
    @app.get("/livros/<int:livro_id>/avaliacoes")
    def listar_avaliacoes_do_livro(livro_id):
        if not db.session.get(Livro, livro_id):
            return jsonify({"erro": "livro não encontrado"}), 404

        try:
            limite = min(max(int(request.args.get("limite", 20)), 1), 100)
            deslocamento = max(int(request.args.get("deslocamento", 0)), 0)
        except ValueError:
            return jsonify({"erro": "limite e deslocamento devem ser inteiros"}), 400

        consulta = (
            db.session.query(Avaliacao, Usuario.nome)
            .join(Usuario, Usuario.id == Avaliacao.usuario_id)
            .filter(Avaliacao.livro_id == livro_id)
        )
        total = consulta.count()
        linhas = (
            consulta.order_by(Avaliacao.criado_em.desc(), Avaliacao.id.desc())
            .limit(limite)
            .offset(deslocamento)
            .all()
        )

        avaliacoes = []
        for avaliacao, nome_usuario in linhas:
            item = avaliacao.to_dict()
            item["usuario_nome"] = nome_usuario
            avaliacoes.append(item)

        return jsonify({"total": total, "avaliacoes": avaliacoes})

    # READ (uma avaliação)
    @app.get("/avaliacoes/<int:avaliacao_id>")
    def obter_avaliacao(avaliacao_id):
        linha = (
            db.session.query(Avaliacao, Usuario.nome)
            .join(Usuario, Usuario.id == Avaliacao.usuario_id)
            .filter(Avaliacao.id == avaliacao_id)
            .first()
        )
        if not linha:
            return jsonify({"erro": "avaliação não encontrada"}), 404

        avaliacao, nome_usuario = linha
        item = avaliacao.to_dict()
        item["usuario_nome"] = nome_usuario
        return jsonify(item)

    # UPDATE
    @app.put("/avaliacoes/<int:avaliacao_id>")
    @login_obrigatorio
    def atualizar_avaliacao(avaliacao_id):
        avaliacao, erro_resposta = buscar_avaliacao_do_autor(avaliacao_id)
        if erro_resposta:
            return erro_resposta

        campos, erro = validar_corpo(request.get_json(silent=True), criando=False)
        if erro:
            return jsonify({"erro": erro}), 400

        for chave, valor in campos.items():
            setattr(avaliacao, chave, valor)

        db.session.commit()
        return jsonify(avaliacao.to_dict())

    # DELETE
    @app.delete("/avaliacoes/<int:avaliacao_id>")
    @login_obrigatorio
    def deletar_avaliacao(avaliacao_id):
        avaliacao, erro_resposta = buscar_avaliacao_do_autor(avaliacao_id)
        if erro_resposta:
            return erro_resposta

        db.session.delete(avaliacao)
        db.session.commit()
        return "", 204

    """
    =========================================================================================
    Progresso de leitura e perfil público
    =========================================================================================
    """

    # READ (progresso do usuário logado neste livro; retorna null se ele ainda não registrou nada)
    @app.get("/livros/<int:livro_id>/progresso/meu")
    @login_obrigatorio
    def obter_meu_progresso(livro_id):
        progresso = ProgressoLeitura.query.filter_by(
            usuario_id=g.usuario.id, livro_id=livro_id
        ).first()
        return jsonify(progresso.to_dict() if progresso else None)

    # CREATE/UPDATE (cria ou atualiza o progresso do usuário logado neste livro)
    # Exemplos de corpo:
    #   {"status": "quero_ler"}
    #   {"status": "lido"}
    #   {"status": "lendo", "formato": "fisico", "total_paginas": 320, "pagina_atual": 120}
    #   {"status": "lendo", "formato": "digital", "percentual": 45}
    # Quando o progresso chega ao fim, a resposta já volta com "status": "lido".
    @app.put("/livros/<int:livro_id>/progresso")
    @login_obrigatorio
    def registrar_progresso(livro_id):
        if not db.session.get(Livro, livro_id):
            return jsonify({"erro": "livro não encontrado"}), 404

        campos, erro = validar_progresso(request.get_json(silent=True))
        if erro:
            return jsonify({"erro": erro}), 400

        progresso = ProgressoLeitura.query.filter_by(
            usuario_id=g.usuario.id, livro_id=livro_id
        ).first()
        criado = progresso is None
        if criado:
            progresso = ProgressoLeitura(
                usuario_id=g.usuario.id,
                livro_id=livro_id,
                status="lendo",
                formato="fisico",
                pagina_atual=0,
                total_paginas=None,
            )

        novo, erro = aplicar_progresso({
            "status": progresso.status,
            "formato": progresso.formato,
            "pagina_atual": progresso.pagina_atual,
            "total_paginas": progresso.total_paginas,
        }, campos)
        if erro:
            return jsonify({"erro": erro}), 400

        progresso.status = novo["status"]
        progresso.formato = novo["formato"]
        progresso.pagina_atual = novo["pagina_atual"]
        progresso.total_paginas = novo["total_paginas"]
        progresso.atualizado_em = _agora()

        if criado:
            db.session.add(progresso)
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return jsonify({"erro": "não foi possível registrar o progresso"}), 409

        return jsonify(progresso.to_dict()), 201 if criado else 200

    # DELETE (remove o progresso do usuário logado neste livro)
    @app.delete("/livros/<int:livro_id>/progresso")
    @login_obrigatorio
    def remover_progresso(livro_id):
        progresso = ProgressoLeitura.query.filter_by(
            usuario_id=g.usuario.id, livro_id=livro_id
        ).first()
        if not progresso:
            return jsonify({"erro": "progresso não encontrado"}), 404

        db.session.delete(progresso)
        db.session.commit()
        return "", 204

    # READ (perfil público: avaliações, progresso de leitura e atividades de um usuário)
    # Aberto a qualquer visitante. Nunca devolve e-mail nem senha_hash.
    @app.get("/usuarios/<int:usuario_id>/perfil")
    def obter_perfil_publico(usuario_id):
        usuario = db.session.get(Usuario, usuario_id)
        if not usuario:
            return jsonify({"erro": "usuário não encontrado"}), 404

        limite_avaliacoes, limite_progresso, limite_atividades = 20, 50, 20

        # Avaliações mais recentes, com os dados do livro
        linhas_avaliacoes = (
            db.session.query(Avaliacao, Livro)
            .join(Livro, Livro.id == Avaliacao.livro_id)
            .filter(Avaliacao.usuario_id == usuario_id)
            .order_by(Avaliacao.criado_em.desc(), Avaliacao.id.desc())
            .limit(limite_avaliacoes)
            .all()
        )
        avaliacoes = []
        for avaliacao, livro in linhas_avaliacoes:
            item = avaliacao.to_dict()
            item["livro_nome"] = livro.nome
            item["livro_autor"] = livro.autor
            avaliacoes.append(item)

        # Progresso de leitura, do mais recente para o mais antigo
        linhas_progresso = (
            db.session.query(ProgressoLeitura, Livro)
            .join(Livro, Livro.id == ProgressoLeitura.livro_id)
            .filter(ProgressoLeitura.usuario_id == usuario_id)
            .order_by(ProgressoLeitura.atualizado_em.desc(), ProgressoLeitura.id.desc())
            .limit(limite_progresso)
            .all()
        )
        progresso = []
        for registro, livro in linhas_progresso:
            item = registro.to_dict()
            item["livro_nome"] = livro.nome
            item["livro_autor"] = livro.autor
            progresso.append(item)

        # Estatísticas (calculadas no banco, não só sobre as listas limitadas acima)
        total_avaliacoes, nota_media = (
            db.session.query(func.count(Avaliacao.id), func.avg(Avaliacao.nota))
            .filter(Avaliacao.usuario_id == usuario_id)
            .one()
        )
        por_status = dict(
            db.session.query(ProgressoLeitura.status, func.count(ProgressoLeitura.id))
            .filter(ProgressoLeitura.usuario_id == usuario_id)
            .group_by(ProgressoLeitura.status)
            .all()
        )

        # Atividades públicas: avaliações e atualizações de progresso, da mais recente à mais antiga
        eventos = []
        for avaliacao, livro in linhas_avaliacoes:
            eventos.append((avaliacao.criado_em, {
                "tipo": "avaliacao",
                "livro_id": livro.id,
                "livro_nome": livro.nome,
                "nota": avaliacao.nota,
            }))
        for registro, livro in linhas_progresso:
            eventos.append((registro.atualizado_em, {
                "tipo": "progresso",
                "livro_id": livro.id,
                "livro_nome": livro.nome,
                "status": registro.status,
                "percentual": registro.percentual,
            }))
        eventos.sort(key=lambda e: e[0], reverse=True)
        atividades = []
        for data, evento in eventos[:limite_atividades]:
            evento["data"] = data.isoformat() if data else None
            atividades.append(evento)

        return jsonify({
            "usuario": {
                "id": usuario.id,
                "nome": usuario.nome,
                "membro_desde": usuario.criado_em.isoformat() if usuario.criado_em else None,
            },
            "estatisticas": {
                "total_avaliacoes": total_avaliacoes,
                "nota_media": round(float(nota_media), 2) if nota_media is not None else None,
                "lendo": por_status.get("lendo", 0),
                "lidos": por_status.get("lido", 0),
                "quero_ler": por_status.get("quero_ler", 0),
            },
            "avaliacoes": avaliacoes,
            "progresso": progresso,
            "atividades": atividades,
        })

    """
    =========================================================================================
    RELATÓRIOS (Livro e Pessoal)
    =========================================================================================
    """

    # RELATÓRIO 1: Dados sobre um livro (público: acessível a qualquer visitante)
    @app.get("/livros/<int:livro_id>/relatorio")
    def relatorio_livro(livro_id):
        livro = db.session.get(Livro, livro_id)
        if not livro:
            return jsonify({"erro": "livro não encontrado"}), 404

        avaliacoes = (
            Avaliacao.query.filter_by(livro_id=livro_id)
            .order_by(Avaliacao.criado_em.asc())
            .all()
        )

        total_avaliacoes = len(avaliacoes)
        nota_media = (
            round(sum(a.nota for a in avaliacoes) / total_avaliacoes, 2)
            if total_avaliacoes > 0
            else None
        )

        # Distribuição por todas as 10 faixas possíveis (0.5 a 5.0, passo 0.5)
        faixas_possiveis = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0]
        contagem_notas = defaultdict(int)
        for a in avaliacoes:
            contagem_notas[float(a.nota)] += 1

        distribuicao = [
            {
                "nota": nota,
                "quantidade": contagem_notas[nota],
                "percentual": round((contagem_notas[nota] * 100) / total_avaliacoes, 1)
                if total_avaliacoes > 0
                else 0.0,
            }
            for nota in faixas_possiveis
        ]

        # Evolução das avaliações por mês (AAAA-MM), com média do mês e média acumulada
        por_mes = defaultdict(list)
        for a in avaliacoes:
            chave_mes = a.criado_em.strftime("%Y-%m") if a.criado_em else "sem-data"
            por_mes[chave_mes].append(a.nota)

        evolucao = []
        soma_acumulada = 0.0
        qtd_acumulada = 0
        for mes in sorted(por_mes.keys()):
            notas_mes = por_mes[mes]
            soma_acumulada += sum(notas_mes)
            qtd_acumulada += len(notas_mes)
            evolucao.append({
                "periodo": mes,
                "quantidade": len(notas_mes),
                "media_periodo": round(sum(notas_mes) / len(notas_mes), 2),
                "media_acumulada": round(soma_acumulada / qtd_acumulada, 2),
            })

        return jsonify({
            "livro": {
                "id": livro.id,
                "nome": livro.nome,
                "autor": livro.autor,
            },
            "resumo": {
                "total_avaliacoes": total_avaliacoes,
                "nota_media": nota_media,
            },
            "distribuicao": distribuicao,
            "evolucao": evolucao,
        })

    # RELATÓRIO 2: Dados pessoais do usuário logado
    @app.get("/usuarios/meu/relatorio")
    @login_obrigatorio
    def relatorio_pessoal():
        uid = g.usuario.id

        avaliacoes = (
            db.session.query(Avaliacao, Livro)
            .join(Livro, Livro.id == Avaliacao.livro_id)
            .filter(Avaliacao.usuario_id == uid)
            .order_by(Avaliacao.criado_em.asc())
            .all()
        )
        progressos = (
            ProgressoLeitura.query.filter_by(usuario_id=uid)
            .order_by(ProgressoLeitura.atualizado_em.asc())
            .all()
        )

        total_avaliados = len(avaliacoes)
        nota_media = (
            round(sum(a.nota for a, _ in avaliacoes) / total_avaliados, 2)
            if total_avaliados > 0
            else None
        )
        total_lidos = sum(1 for p in progressos if p.status == "lido")
        total_lendo = sum(1 for p in progressos if p.status == "lendo")

        # Ranking por gênero com base nos livros avaliados ou marcados como lidos
        livros_considerados = {a.livro_id for a, _ in avaliacoes} | {
            p.livro_id for p in progressos if p.status == "lido"
        }

        ranking_generos = []
        if livros_considerados:
            marcadores = ", ".join(
                f":livro_{i}" for i in range(len(livros_considerados))
            )
            params = {
                f"livro_{i}": lid for i, lid in enumerate(livros_considerados)
            }
            linhas_generos = db.session.execute(
                text(f"""
                    SELECT g.id, g.nome, COUNT(DISTINCT gl.livro_id) AS quantidade
                    FROM generos g
                    JOIN generosLivros gl ON gl.genero_id = g.id
                    WHERE gl.livro_id IN ({marcadores})
                    GROUP BY g.id, g.nome
                    ORDER BY quantidade DESC, g.nome ASC
                """),
                params,
            ).mappings().all()

            total_livros_ranked = len(livros_considerados)
            for row in linhas_generos:
                ranking_generos.append({
                    "genero_id": row["id"],
                    "nome": row["nome"],
                    "quantidade": row["quantidade"],
                    "percentual": round((row["quantidade"] * 100) / total_livros_ranked, 1),
                })

        # Evolução da atividade por mês (avaliações feitas + atualizações de progresso)
        atividade_mensal = defaultdict(lambda: {"avaliacoes": 0, "leituras": 0})
        for a, _ in avaliacoes:
            if a.criado_em:
                atividade_mensal[a.criado_em.strftime("%Y-%m")]["avaliacoes"] += 1
        for p in progressos:
            if p.atualizado_em:
                atividade_mensal[p.atualizado_em.strftime("%Y-%m")]["leituras"] += 1

        evolucao = []
        for mes in sorted(atividade_mensal.keys()):
            item = atividade_mensal[mes]
            evolucao.append({
                "periodo": mes,
                "avaliacoes": item["avaliacoes"],
                "leituras": item["leituras"],
                "total": item["avaliacoes"] + item["leituras"],
            })

        return jsonify({
            "usuario": {
                "id": g.usuario.id,
                "nome": g.usuario.nome,
            },
            "resumo": {
                "livros_avaliados": total_avaliados,
                "nota_media": nota_media,
                "livros_lidos": total_lidos,
                "livros_lendo": total_lendo,
            },
            "ranking_generos": ranking_generos,
            "evolucao": evolucao,
        })

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
