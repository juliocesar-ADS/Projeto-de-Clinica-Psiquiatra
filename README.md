# Clínica Psiquiátrica

Sistema web para gestão de uma clínica psiquiátrica, com painel administrativo para equipe interna e portal responsivo para clientes acompanharem agendamentos, consultas, exames e resultados.

## Visão geral

O projeto integra frontend, backend e banco de dados em uma aplicação Flask simples de executar localmente. A interface usa React no navegador, servido pelo próprio Flask, e consome APIs JSON conectadas ao SQLite.

Também existe uma versão estática em `docs/` para publicação no GitHub Pages. Essa versão funciona como prévia online/PWA, mas não executa Flask nem SQLite porque GitHub Pages hospeda apenas arquivos estáticos.

## Funcionalidades

- Login único para administração e clientes.
- Cadastro de novos clientes.
- Painel administrativo para PC com visão de clientes, agendamentos, consultas e exames.
- Portal do cliente com layout mobile em `/app`.
- Cliente pode solicitar novos agendamentos.
- Administração pode cadastrar agendamentos, consultas, prescrições, condutas, exames e resultados.
- Banco SQLite inicializado automaticamente com dados de demonstração.
- PWA instalável pelo navegador.
- Prévia online estática via GitHub Pages.

## Tecnologias

- Python 3
- Flask
- SQLite
- React 18 via CDN
- CSS responsivo sem dependência de build
- PWA com manifest e service worker
- GitHub Pages publicado pela pasta `docs/` da branch `master`

## Estrutura

```txt
.
├── app.py
├── clinic.db
├── docs/
│   ├── app.jsx
│   ├── icon.svg
│   ├── index.html
│   ├── manifest.webmanifest
│   ├── service-worker.js
│   └── styles.css
├── requirements.txt
├── start-clinica.bat
├── static/
│   ├── css/
│   │   └── styles.css
│   ├── img/
│   │   └── icon.svg
│   ├── js/
│   │   └── app.jsx
│   ├── manifest.webmanifest
│   └── service-worker.js
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

No Windows, também é possível iniciar pelo arquivo:

```txt
start-clinica.bat
```

Esse atalho abre o navegador e inicia o servidor Flask.

## Como testar

1. Execute `python app.py`.
2. Abra [http://127.0.0.1:5000/](http://127.0.0.1:5000/).
3. Entre como administrador com `admin@clinica.com` e `admin123`.
4. Teste o cadastro/listagem de clientes, agendamentos, consultas e exames.
5. Saia do sistema.
6. Entre como cliente com `joana@email.com` e `cliente123`.
7. Acesse o portal do cliente e solicite um agendamento.
8. Volte para o administrador e confirme se o novo agendamento apareceu.

Teste rápido das rotas principais:

```bash
python -c "from app import app, init_db; init_db(); c=app.test_client(); print(c.get('/').status_code, c.get('/app').status_code)"
```

## Versão online no GitHub Pages

O repositório contém uma versão estática em `docs/`, publicada pelo GitHub Pages a partir da branch `master`.

Link esperado:

[https://juliocesar-ads.github.io/Projeto-de-Clinica-Psiquiatra/](https://juliocesar-ads.github.io/Projeto-de-Clinica-Psiquiatra/)

Importante: GitHub Pages hospeda apenas arquivos estáticos. Ele não executa Python, Flask ou SQLite. Por isso, a versão online é uma prévia React/PWA com dados salvos no navegador via `localStorage`.

Para o sistema completo com banco de dados real online, o backend Flask deve ser hospedado em uma plataforma como Render, Railway, Fly.io, VPS ou serviço similar.

## Aplicativo instalável

O projeto foi preparado como PWA.

No celular:

1. Abra o link do GitHub Pages no navegador.
2. Use a opção do navegador "Adicionar à tela inicial" ou "Instalar app".
3. O portal passa a abrir como aplicativo instalado.

No PC:

1. Abra o sistema no Chrome ou Edge.
2. Clique no ícone de instalação na barra de endereço, quando disponível.
3. Instale o app.

Observação: isso cria um app instalável via navegador. Para gerar um `.apk` Android ou `.exe` Electron nativo, será necessário instalar Node/NPM e uma ferramenta como Capacitor ou Electron.

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
- PWA instalável.
- Prévia online estática via GitHub Pages.

## Próximos passos recomendados

- Trocar senhas em texto puro por hash seguro.
- Adicionar recuperação de senha.
- Criar permissões mais detalhadas para equipe clínica.
- Implementar upload real de documentos/resultados.
- Migrar React para build com Vite quando Node/NPM estiverem disponíveis.
- Gerar APK com Capacitor ou app desktop com Electron quando Node/NPM estiverem disponíveis.
- Adicionar testes automatizados.
- Preparar ambiente de produção com variáveis de ambiente e banco dedicado.


Trabalho foi feito por um grupo de 4 alunos na universidade Estácio SÁ, foi um projeto semestral.
