# Clínica Psiquiátrica

Sistema web para gestão de uma clínica psiquiátrica, com painel administrativo para equipe interna e portal responsivo para clientes acompanharem agendamentos, consultas, exames e resultados.

## Visão geral

O projeto integra frontend, backend e banco de dados em uma aplicação Flask simples de executar localmente. A interface usa React no navegador, servido pelo próprio Flask, e consome APIs JSON conectadas ao SQLite.

## Funcionalidades

- Login único para administração e clientes.
- Cadastro de novos clientes.
- Painel administrativo para PC com visão de clientes, agendamentos, consultas e exames.
- Portal do cliente com layout mobile em `/app`.
- Cliente pode solicitar novos agendamentos.
- Administração pode cadastrar agendamentos, consultas, prescrições, condutas, exames e resultados.
- Banco SQLite inicializado automaticamente com dados de demonstração.

## Tecnologias

- Python 3
- Flask
- SQLite
- React 18 via CDN
- CSS responsivo sem dependência de build

## Estrutura

```txt
.
├── app.py
├── clinic.db
├── requirements.txt
├── static/
│   ├── css/
│   │   └── styles.css
│   └── js/
│       └── app.jsx
└── templates/
    └── index.html
```

## Como executar

Instale as dependências:

```bash
pip install -r requirements.txt
```

Inicie o servidor:

```bash
python app.py
```

Acesse:

- Painel web e login geral: [http://127.0.0.1:5000/](http://127.0.0.1:5000/)
- Portal mobile do cliente: [http://127.0.0.1:5000/app](http://127.0.0.1:5000/app)

## Acessos de demonstração

Administração:

```txt
E-mail: admin@clinica.com
Senha: admin123
```

Cliente:

```txt
E-mail: joana@email.com
Senha: cliente123
```

## APIs principais

Todas as rotas protegidas usam token no cabeçalho:

```txt
Authorization: Bearer <token>
```

Rotas públicas:

- `POST /api/login`
- `POST /api/register`

Rotas protegidas:

- `GET /api/me`
- `GET /api/summary`
- `GET /api/clients`
- `POST /api/clients`
- `GET /api/appointments`
- `POST /api/appointments`
- `GET /api/consultations`
- `POST /api/consultations`
- `GET /api/exams`
- `POST /api/exams`

## Banco de dados

O banco usa SQLite em `clinic.db`. Na primeira execução, o sistema cria as tabelas:

- `users`
- `appointments`
- `consultations`
- `exams`

Os dados iniciais são apenas para demonstração e podem ser substituídos por dados reais depois.

## Status atual

Versão inicial funcional com:

- Backend integrado ao banco.
- Painel administrativo web.
- Portal do cliente responsivo/mobile.
- Login, cadastro, consultas, exames, resultados e agendamentos.
- Validação local das principais rotas.

## Próximos passos recomendados

- Trocar senhas em texto puro por hash seguro.
- Adicionar recuperação de senha.
- Criar permissões mais detalhadas para equipe clínica.
- Implementar upload real de documentos/resultados.
- Migrar React para build com Vite quando Node/NPM estiverem disponíveis.
- Adicionar testes automatizados.
- Preparar ambiente de produção com variáveis de ambiente e banco dedicado.
