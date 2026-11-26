"""Carga de dados de teste do BookXD. Coloque em backend/ e execute python seed.py.
Não execute em produção. Não exclui registros; contas existentes com os emails
abaixo são reutilizadas sem alterar credenciais, exceto a conta admin de teste.
"""
from werkzeug.security import generate_password_hash, check_password_hash
from app import create_app
from models import db, Usuario, Genero, Livro, GenerosLivros, Avaliacao, ProgressoLeitura

GENEROS = ['Romance', 'Fantasia', 'Ficção científica']
USUARIOS = [
    ('admin', 'admin@gmail.com', 'admin', 'admin'),
    ('Ana Silva', 'ana@example.com', 'ana123', 'usuario'),
    ('Lucas Souza', 'lucas@example.com', 'lucas123', 'usuario'),
]
# Título, autor, sinopse, índices dos gêneros, aprovado
LIVROS = [
    ('Dom Casmurro', 'Machado de Assis', 'Bentinho relembra sua juventude e seu casamento com Capitu.', [0], True),
    ('Orgulho e Preconceito', 'Jane Austen', 'Elizabeth Bennet enfrenta convenções sociais e seus próprios julgamentos.', [0], True),
    ('O Hobbit', 'J. R. R. Tolkien', 'Bilbo parte em uma aventura com anões em busca de um tesouro.', [1], True),
    ('O Senhor dos Anéis', 'J. R. R. Tolkien', 'Uma companhia tenta destruir um anel de grande poder.', [1], True),
    ('Harry Potter e a Pedra Filosofal', 'J. K. Rowling', 'Um jovem descobre que é bruxo e ingressa em uma escola de magia.', [1], True),
    ('Duna', 'Frank Herbert', 'Disputas pelo controle de um planeta desértico transformam o destino de uma família.', [2], True),
    ('1984', 'George Orwell', 'Um homem questiona a vigilância e o controle de um regime totalitário.', [2], True),
    ('Fundação', 'Isaac Asimov', 'Cientistas tentam preservar o conhecimento diante da queda de um império galáctico.', [2], True),
    ('A Mulher do Viajante no Tempo', 'Audrey Niffenegger', 'Um casal enfrenta os efeitos de viagens involuntárias no tempo.', [0, 2], True),
    ('O Nome do Vento', 'Patrick Rothfuss', 'Um músico e mago narra os acontecimentos de sua juventude.', [1], False),
]
# Índices de usuário e livro, nota, comentário, spoiler
AVALIACOES = [
    (1, 0, 4.5, 'Ótima leitura e narrativa instigante.', False),
    (2, 0, 4, 'Gostei da construção dos personagens.', False),
    (1, 2, 5, 'Uma aventura divertida do começo ao fim.', False),
    (2, 5, 4.5, 'Universo muito bem desenvolvido.', False),
    (1, 6, 5, 'Uma reflexão importante sobre liberdade.', False),
    (2, 7, 3.5, 'Ideias interessantes, mas o ritmo é irregular.', False),
]
# Índices de usuário e livro, status, formato, página atual, total
PROGRESSOS = [
    (1, 0, 'lido', 'fisico', 256, 256),
    (1, 2, 'lido', 'digital', 100, 100),
    (1, 6, 'lido', 'digital', 100, 100),
    (1, 3, 'lendo', 'fisico', 150, 1200),
    (1, 8, 'quero_ler', 'fisico', 0, None),
    (2, 0, 'lido', 'fisico', 256, 256),
    (2, 5, 'lido', 'digital', 100, 100),
    (2, 7, 'abandonado', 'fisico', 180, 240),
    (2, 4, 'lendo', 'digital', 45, 100),
    (2, 1, 'quero_ler', 'fisico', 0, None),
]


def popular():
    generos, usuarios, livros = [], [], []
    criados = dict(generos=0, usuarios=0, livros=0, associacoes=0, avaliacoes=0, progressos=0)
    for nome in GENEROS:
        obj = Genero.query.filter_by(nome=nome).first()
        if obj is None:
            obj = Genero(nome=nome)
            db.session.add(obj)
            criados['generos'] += 1
        generos.append(obj)
    for nome, email, senha, cargo in USUARIOS:
        obj = Usuario.query.filter_by(email=email).first()
        if obj is None:
            obj = Usuario(nome=nome, email=email, senha_hash=generate_password_hash(senha), cargo=cargo)
            db.session.add(obj)
            criados['usuarios'] += 1
        elif cargo == 'admin':
            obj.nome, obj.cargo = nome, cargo
            if not check_password_hash(obj.senha_hash, senha):
                obj.senha_hash = generate_password_hash(senha)
        usuarios.append(obj)
    db.session.flush()
    for nome, autor, descricao, indices, aprovado in LIVROS:
        obj = Livro.query.filter_by(nome=nome, autor=autor).first()
        if obj is None:
            obj = Livro(nome=nome, autor=autor, descricao=descricao, aprovado=aprovado)
            db.session.add(obj)
            db.session.flush()
            criados['livros'] += 1
        livros.append(obj)
        for i in indices:
            ids = dict(livro_id=obj.id, genero_id=generos[i].id)
            if GenerosLivros.query.filter_by(**ids).first() is None:
                db.session.add(GenerosLivros(**ids))
                criados['associacoes'] += 1
    for u, l, nota, texto, spoiler in AVALIACOES:
        ids = dict(usuario_id=usuarios[u].id, livro_id=livros[l].id)
        if Avaliacao.query.filter_by(**ids).first() is None:
            db.session.add(Avaliacao(**ids, nota=nota, texto=texto, contem_spoilers=spoiler))
            criados['avaliacoes'] += 1
    for u, l, status, formato, pagina, total in PROGRESSOS:
        ids = dict(usuario_id=usuarios[u].id, livro_id=livros[l].id)
        if ProgressoLeitura.query.filter_by(**ids).first() is None:
            db.session.add(ProgressoLeitura(**ids, status=status, formato=formato, pagina_atual=pagina, total_paginas=total))
            criados['progressos'] += 1
    db.session.commit()
    return criados


if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        try:
            resultado = popular()
        except Exception:
            db.session.rollback()
            raise
        print('Carga concluída. Novos registros:')
        for tabela, quantidade in resultado.items():
            print(f'  {tabela}: {quantidade}')
        print('Login de teste: admin@gmail.com / admin')
