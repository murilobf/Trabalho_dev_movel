"""
seed.py: popula o bookxd.db com dados de teste.

Uso (na pasta do backend, onde ficam app.py e models.py):

    python seed.py

Cria gêneros, livros (com seus gêneros), 3 usuários de teste, algumas avaliações
espalhadas em datas diferentes (útil para testar a lista de avaliações e os relatórios)
e registros de progresso de leitura (útil para testar o perfil público).

É seguro rodar mais de uma vez: o que já existe não é duplicado.
Para recomeçar do zero, apague o arquivo instance/bookxd.db (ou bookxd.db) e rode de novo.

ATENÇÃO: os usuários abaixo têm senha fraca de propósito. Use só em desenvolvimento.
"""

from datetime import timedelta

from werkzeug.security import generate_password_hash

from app import Avaliacao, ProgressoLeitura, agora, create_app
from models import Genero, GenerosLivros, Livro, Usuario, db

SENHA_PADRAO = "123456"

GENEROS = [
    "Romance",
    "Clássico",
    "Literatura brasileira",
    "Ficção científica",
    "Distopia",
    "Fantasia",
    "Aventura",
    "Mistério",
    "Não ficção",
    "História",
    "Realismo mágico",
    "Infantil",
]

# (nome, autor, descricao [máx. 500 caracteres], [gêneros])
LIVROS = [
    (
        "Dom Casmurro",
        "Machado de Assis",
        "Bento Santiago, já maduro, relembra a juventude, o amor por Capitu e a dúvida que "
        "corroeu o casamento dos dois. Um dos grandes romances da literatura brasileira.",
        ["Romance", "Clássico", "Literatura brasileira"],
    ),
    (
        "Memórias Póstumas de Brás Cubas",
        "Machado de Assis",
        "O defunto-autor Brás Cubas conta a própria vida com ironia e humor ácido, "
        "comentando as vaidades da elite do Rio de Janeiro do século XIX.",
        ["Clássico", "Literatura brasileira"],
    ),
    (
        "Grande Sertão: Veredas",
        "João Guimarães Rosa",
        "Riobaldo, ex-jagunço, narra sua trajetória pelo sertão enquanto revisita amores, "
        "pactos e dúvidas. Uma obra de linguagem inventiva e densa.",
        ["Clássico", "Literatura brasileira", "Aventura"],
    ),
    (
        "Vidas Secas",
        "Graciliano Ramos",
        "Uma família de retirantes atravessa a seca do sertão nordestino em busca de "
        "sobrevivência, em capítulos curtos e de prosa seca.",
        ["Clássico", "Literatura brasileira"],
    ),
    (
        "A Hora da Estrela",
        "Clarice Lispector",
        "Macabéa, jovem datilógrafa vinda do Nordeste, vive de forma discreta no Rio de "
        "Janeiro, observada por um narrador que se questiona o tempo todo.",
        ["Literatura brasileira", "Romance"],
    ),
    (
        "O Cortiço",
        "Aluísio Azevedo",
        "Retrato da vida em um cortiço do Rio de Janeiro do século XIX, onde ambição, "
        "pobreza e desejo moldam o destino dos moradores.",
        ["Clássico", "Literatura brasileira"],
    ),
    (
        "1984",
        "George Orwell",
        "Em um regime totalitário que vigia todos e reescreve a história, Winston Smith "
        "tenta preservar a própria capacidade de pensar.",
        ["Ficção científica", "Distopia", "Clássico"],
    ),
    (
        "Admirável Mundo Novo",
        "Aldous Huxley",
        "Em uma sociedade futura onde conforto, consumo e condicionamento substituem a "
        "liberdade, um visitante de fora questiona o preço da felicidade.",
        ["Ficção científica", "Distopia", "Clássico"],
    ),
    (
        "Duna",
        "Frank Herbert",
        "No deserto do planeta Arrakis, único produtor da especiaria mais valiosa do "
        "universo, uma família nobre se vê no centro de uma disputa de poder.",
        ["Ficção científica", "Aventura"],
    ),
    (
        "O Hobbit",
        "J.R.R. Tolkien",
        "O pacato hobbit Bilbo Bolseiro é convidado a acompanhar um grupo de anões em uma "
        "jornada para recuperar um tesouro guardado por um dragão.",
        ["Fantasia", "Aventura", "Clássico"],
    ),
    (
        "Orgulho e Preconceito",
        "Jane Austen",
        "Elizabeth Bennet e o reservado Sr. Darcy precisam superar mal-entendidos e "
        "julgamentos precipitados em uma sociedade movida por casamentos e posição social.",
        ["Romance", "Clássico"],
    ),
    (
        "O Pequeno Príncipe",
        "Antoine de Saint-Exupéry",
        "Um aviador perdido no deserto encontra um menino vindo de outro planeta, que "
        "lhe conta sobre suas viagens e sobre o que realmente importa.",
        ["Infantil", "Clássico", "Fantasia"],
    ),
    (
        "Sapiens: Uma Breve História da Humanidade",
        "Yuval Noah Harari",
        "Um panorama de como a nossa espécie passou de caçadora-coletora a dona do "
        "planeta, passando pelas revoluções cognitiva, agrícola e científica.",
        ["Não ficção", "História"],
    ),
    (
        "O Nome da Rosa",
        "Umberto Eco",
        "No século XIV, um frei franciscano investiga mortes misteriosas em uma abadia "
        "isolada, cuja biblioteca esconde segredos.",
        ["Mistério", "História"],
    ),
    (
        "Assassinato no Expresso do Oriente",
        "Agatha Christie",
        "Preso em um trem parado pela neve, o detetive Hercule Poirot precisa descobrir "
        "quem, entre os passageiros, cometeu um assassinato.",
        ["Mistério", "Clássico"],
    ),
    (
        "Cem Anos de Solidão",
        "Gabriel García Márquez",
        "A saga da família Buendía, ao longo de várias gerações, na cidade fictícia de "
        "Macondo, onde o cotidiano e o fantástico se misturam.",
        ["Realismo mágico", "Clássico", "Romance"],
    ),
]

# (nome, email)
USUARIOS = [
    ("Ana Teste", "ana@teste.com"),
    ("Bruno Teste", "bruno@teste.com"),
    ("Carla Teste", "carla@teste.com"),
]

# (email, livro, nota, texto, contem_spoilers, dias_atrás)
AVALIACOES = [
    ("ana@teste.com", "Dom Casmurro", 5.0, "Dá vontade de reler só para caçar as pistas. Capitu traiu ou não?", False, 140),
    ("bruno@teste.com", "Dom Casmurro", 4.0, "A ironia do narrador é o melhor do livro. Começo lento, mas compensa.", False, 95),
    ("carla@teste.com", "Dom Casmurro", 3.5, "Gostei bastante, embora o ritmo tenha me cansado em alguns trechos.", False, 20),
    ("ana@teste.com", "1984", 5.0, "Assustadoramente atual. Terminei e fiquei um tempo em silêncio.", False, 120),
    ("bruno@teste.com", "1984", 4.5, "O final me pegou de surpresa e me incomodou do jeito certo.", True, 60),
    ("carla@teste.com", "1984", 4.0, "Pesado, mas necessário.", False, 12),
    ("ana@teste.com", "Duna", 4.5, "Construção de mundo impressionante, vale a persistência nas primeiras páginas.", False, 80),
    ("bruno@teste.com", "Duna", 3.0, "Interessante, porém denso demais para o meu gosto.", False, 45),
    ("ana@teste.com", "O Hobbit", 4.0, "Leitura leve e cheia de charme, ótima para começar na fantasia.", False, 110),
    ("carla@teste.com", "O Hobbit", 4.5, "Reli e gostei ainda mais. O Bilbo é um protagonista adorável.", False, 30),
    ("bruno@teste.com", "Vidas Secas", 4.0, "Curto e muito forte. A cena do cachorro Baleia ficou na minha cabeça.", True, 70),
    ("carla@teste.com", "Vidas Secas", 3.5, "Prosa seca como o título promete, e isso é um elogio.", False, 9),
    ("ana@teste.com", "Orgulho e Preconceito", 4.5, "Diálogos afiados e personagens inesquecíveis.", False, 150),
    ("carla@teste.com", "Orgulho e Preconceito", 5.0, "Meu favorito entre os romances clássicos.", False, 5),
    ("bruno@teste.com", "Sapiens: Uma Breve História da Humanidade", 3.5, "Ótimas ideias, mas algumas conclusões parecem simplificadas.", False, 55),
    ("ana@teste.com", "Sapiens: Uma Breve História da Humanidade", 4.0, "Faz pensar. Boa leitura para quem gosta de história em grande escala.", False, 25),
    ("carla@teste.com", "Cem Anos de Solidão", 5.0, "Me perdi nos nomes repetidos e mesmo assim amei cada página.", False, 40),
    ("bruno@teste.com", "Assassinato no Expresso do Oriente", 4.5, "Solução genial. Não consegui adivinhar.", True, 15),
    ("ana@teste.com", "O Pequeno Príncipe", 4.0, "Simples na superfície, bem mais profundo do que parece.", False, 100),
    ("carla@teste.com", "A Hora da Estrela", 2.5, "Reconheço a importância, mas a leitura não me conquistou.", False, 3),
]


# (email, livro, status, pagina_atual, total_paginas, dias_atrás)
PROGRESSOS = [
    ("ana@teste.com", "Duna", "lendo", 310, 680, 2),
    ("ana@teste.com", "Cem Anos de Solidão", "quero_ler", 0, None, 6),
    ("ana@teste.com", "Dom Casmurro", "lido", 256, 256, 140),
    ("bruno@teste.com", "O Nome da Rosa", "lendo", 120, 560, 1),
    ("bruno@teste.com", "Grande Sertão: Veredas", "abandonado", 90, 608, 35),
    ("bruno@teste.com", "1984", "lido", 328, 328, 60),
    ("carla@teste.com", "O Hobbit", "lendo", 95, None, 4),
    ("carla@teste.com", "Admirável Mundo Novo", "quero_ler", 0, None, 10),
    ("carla@teste.com", "Orgulho e Preconceito", "lido", 424, 424, 5),
]


def validar_dados():
    """Falha cedo se o seed tiver algum erro de digitação."""
    nomes_generos = set(GENEROS)
    nomes_livros = {l[0] for l in LIVROS}
    emails = {u[1] for u in USUARIOS}
    for nome, autor, descricao, generos in LIVROS:
        assert len(nome) <= 100 and len(autor) <= 100, f"nome/autor muito longo: {nome}"
        assert len(descricao) <= 500, f"descrição com {len(descricao)} caracteres: {nome}"
        assert generos and set(generos) <= nomes_generos, f"gênero desconhecido em: {nome}"
    for email, livro, nota, texto, _spoilers, _dias in AVALIACOES:
        assert email in emails and livro in nomes_livros, f"referência inválida: {email}, {livro}"
        assert 0.5 <= nota <= 5 and (nota * 2) % 1 == 0, f"nota inválida: {nota}"
        assert len(texto) <= 2000
    for email, livro, status, pagina, total, _dias in PROGRESSOS:
        assert email in emails and livro in nomes_livros, f"referência inválida: {email}, {livro}"
        assert status in ("quero_ler", "lendo", "lido", "abandonado"), f"status inválido: {status}"
        assert pagina >= 0 and (total is None or pagina <= total), f"página inválida: {livro}"


def popular():
    validar_dados()

    # Gêneros
    generos = {}
    for nome in GENEROS:
        genero = Genero.query.filter_by(nome=nome).first()
        if not genero:
            genero = Genero(nome=nome)
            db.session.add(genero)
        generos[nome] = genero
    db.session.flush()

    # Livros e relação livro/gênero
    livros = {}
    novos_livros = 0
    for nome, autor, descricao, nomes_generos in LIVROS:
        livro = Livro.query.filter_by(nome=nome, autor=autor).first()
        if not livro:
            livro = Livro(nome=nome, autor=autor, descricao=descricao)
            db.session.add(livro)
            db.session.flush()
            for nome_genero in nomes_generos:
                db.session.add(GenerosLivros(livro_id=livro.id, genero_id=generos[nome_genero].id))
            novos_livros += 1
        livros[nome] = livro

    # Usuários
    usuarios = {}
    novos_usuarios = 0
    for nome, email in USUARIOS:
        usuario = Usuario.query.filter_by(email=email).first()
        if not usuario:
            usuario = Usuario(nome=nome, email=email, senha_hash=generate_password_hash(SENHA_PADRAO))
            db.session.add(usuario)
            novos_usuarios += 1
        usuarios[email] = usuario
    db.session.flush()

    # Avaliações (datas espalhadas no tempo, para testar a evolução nos relatórios)
    novas_avaliacoes = 0
    for email, nome_livro, nota, texto, spoilers, dias in AVALIACOES:
        usuario, livro = usuarios[email], livros[nome_livro]
        if Avaliacao.query.filter_by(usuario_id=usuario.id, livro_id=livro.id).first():
            continue
        data = agora() - timedelta(days=dias)
        db.session.add(
            Avaliacao(
                usuario_id=usuario.id,
                livro_id=livro.id,
                nota=nota,
                texto=texto,
                contem_spoilers=spoilers,
                criado_em=data,
                atualizado_em=data,
            )
        )
        novas_avaliacoes += 1

    # Progresso de leitura
    novos_progressos = 0
    for email, nome_livro, status, pagina, total, dias in PROGRESSOS:
        usuario, livro = usuarios[email], livros[nome_livro]
        if ProgressoLeitura.query.filter_by(usuario_id=usuario.id, livro_id=livro.id).first():
            continue
        data = agora() - timedelta(days=dias)
        db.session.add(
            ProgressoLeitura(
                usuario_id=usuario.id,
                livro_id=livro.id,
                status=status,
                pagina_atual=pagina,
                total_paginas=total,
                criado_em=data,
                atualizado_em=data,
            )
        )
        novos_progressos += 1

    db.session.commit()
    print(
        f"Livros novos: {novos_livros} | usuários novos: {novos_usuarios} | "
        f"avaliações novas: {novas_avaliacoes} | progressos novos: {novos_progressos}"
    )
    print(f"Logins de teste: {', '.join(e for _, e in USUARIOS)} (senha: {SENHA_PADRAO})")


if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        popular()
