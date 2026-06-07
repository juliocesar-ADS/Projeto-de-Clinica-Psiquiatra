import os
import secrets
import sqlite3
from datetime import datetime
from functools import wraps

from flask import Flask, g, jsonify, render_template, request


BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_PATH = os.path.join(BASE_DIR, "clinic.db")

app = Flask(__name__)
app.config["JSON_AS_ASCII"] = False


def db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(_error):
    connection = g.pop("db", None)
    if connection is not None:
        connection.close()


def query(sql, params=(), one=False):
    cursor = db().execute(sql, params)
    rows = cursor.fetchall()
    cursor.close()
    data = [dict(row) for row in rows]
    return data[0] if one and data else (None if one else data)


def execute(sql, params=()):
    connection = db()
    cursor = connection.execute(sql, params)
    connection.commit()
    return cursor.lastrowid


def now_iso():
    return datetime.now().replace(microsecond=0).isoformat()


def require_auth(role=None):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            token = request.headers.get("Authorization", "").replace("Bearer ", "")
            user = query(
                "SELECT id, name, email, role FROM users WHERE token = ?",
                (token,),
                one=True,
            )
            if not user:
                return jsonify({"error": "Login obrigatório."}), 401
            if role and user["role"] != role:
                return jsonify({"error": "Acesso não autorizado."}), 403
            g.user = user
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def init_db():
    connection = sqlite3.connect(DB_PATH)
    cursor = connection.cursor()
    cursor.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('admin', 'client')),
            phone TEXT,
            document TEXT,
            token TEXT UNIQUE,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id INTEGER NOT NULL,
            doctor TEXT NOT NULL,
            scheduled_at TEXT NOT NULL,
            status TEXT NOT NULL,
            reason TEXT NOT NULL,
            notes TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY(client_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS consultations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id INTEGER NOT NULL,
            appointment_id INTEGER,
            doctor TEXT NOT NULL,
            consultation_at TEXT NOT NULL,
            diagnosis TEXT,
            prescription TEXT,
            conduct TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY(client_id) REFERENCES users(id),
            FOREIGN KEY(appointment_id) REFERENCES appointments(id)
        );

        CREATE TABLE IF NOT EXISTS exams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            requested_at TEXT NOT NULL,
            status TEXT NOT NULL,
            result TEXT,
            file_url TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY(client_id) REFERENCES users(id)
        );
        """
    )

    count = cursor.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    if count == 0:
        admin_token = secrets.token_hex(24)
        client_token = secrets.token_hex(24)
        now = now_iso()
        cursor.execute(
            """
            INSERT INTO users (name, email, password, role, phone, document, token, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "Admin Clínica",
                "admin@clinica.com",
                "admin123",
                "admin",
                "(11) 99999-0000",
                "",
                admin_token,
                now,
            ),
        )
        cursor.execute(
            """
            INSERT INTO users (name, email, password, role, phone, document, token, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "Joana Martins",
                "joana@email.com",
                "cliente123",
                "client",
                "(11) 98888-1010",
                "123.456.789-10",
                client_token,
                now,
            ),
        )
        client_id = cursor.lastrowid
        cursor.execute(
            """
            INSERT INTO appointments (client_id, doctor, scheduled_at, status, reason, notes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                client_id,
                "Dra. Helena Duarte",
                "2026-06-12T09:30",
                "Confirmado",
                "Retorno psiquiátrico",
                "Chegar 10 minutos antes.",
                now,
            ),
        )
        appointment_id = cursor.lastrowid
        cursor.execute(
            """
            INSERT INTO consultations
            (client_id, appointment_id, doctor, consultation_at, diagnosis, prescription, conduct, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                client_id,
                appointment_id,
                "Dra. Helena Duarte",
                "2026-05-20T14:00",
                "Acompanhamento de ansiedade generalizada",
                "Manter medicação conforme orientação médica.",
                "Retorno em 30 dias e psicoterapia semanal.",
                now,
            ),
        )
        cursor.execute(
            """
            INSERT INTO exams (client_id, title, requested_at, status, result, file_url, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                client_id,
                "Exames laboratoriais de rotina",
                "2026-05-22T10:00",
                "Resultado disponível",
                "Resultados dentro dos parâmetros informados pelo laboratório.",
                "",
                now,
            ),
        )
    connection.commit()
    connection.close()


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/app")
def mobile_app():
    return render_template("index.html")


@app.route("/api/login", methods=["POST"])
def login():
    payload = request.get_json(force=True)
    email = payload.get("email", "").strip().lower()
    password = payload.get("password", "")
    user = query(
        "SELECT id, name, email, role, token FROM users WHERE email = ? AND password = ?",
        (email, password),
        one=True,
    )
    if not user:
        return jsonify({"error": "E-mail ou senha inválidos."}), 401
    if not user["token"]:
        token = secrets.token_hex(24)
        execute("UPDATE users SET token = ? WHERE id = ?", (token, user["id"]))
        user["token"] = token
    return jsonify({"user": user, "token": user["token"]})


@app.route("/api/register", methods=["POST"])
def register():
    payload = request.get_json(force=True)
    required = ["name", "email", "password"]
    if any(not payload.get(field) for field in required):
        return jsonify({"error": "Nome, e-mail e senha são obrigatórios."}), 400
    token = secrets.token_hex(24)
    try:
        user_id = execute(
            """
            INSERT INTO users (name, email, password, role, phone, document, token, created_at)
            VALUES (?, ?, ?, 'client', ?, ?, ?, ?)
            """,
            (
                payload["name"].strip(),
                payload["email"].strip().lower(),
                payload["password"],
                payload.get("phone", ""),
                payload.get("document", ""),
                token,
                now_iso(),
            ),
        )
    except sqlite3.IntegrityError:
        return jsonify({"error": "Este e-mail já está cadastrado."}), 409
    user = query(
        "SELECT id, name, email, role, token FROM users WHERE id = ?",
        (user_id,),
        one=True,
    )
    return jsonify({"user": user, "token": token}), 201


@app.route("/api/me")
@require_auth()
def me():
    return jsonify({"user": g.user})


@app.route("/api/clients", methods=["GET", "POST"])
@require_auth("admin")
def clients():
    if request.method == "POST":
        payload = request.get_json(force=True)
        if not payload.get("name") or not payload.get("email"):
            return jsonify({"error": "Nome e e-mail são obrigatórios."}), 400
        try:
            client_id = execute(
                """
                INSERT INTO users (name, email, password, role, phone, document, token, created_at)
                VALUES (?, ?, ?, 'client', ?, ?, ?, ?)
                """,
                (
                    payload["name"].strip(),
                    payload["email"].strip().lower(),
                    payload.get("password") or "cliente123",
                    payload.get("phone", ""),
                    payload.get("document", ""),
                    secrets.token_hex(24),
                    now_iso(),
                ),
            )
        except sqlite3.IntegrityError:
            return jsonify({"error": "Este e-mail já está cadastrado."}), 409
        return jsonify({"client": query("SELECT * FROM users WHERE id = ?", (client_id,), one=True)}), 201
    return jsonify(
        {
            "clients": query(
                """
                SELECT id, name, email, phone, document, created_at
                FROM users WHERE role = 'client'
                ORDER BY name
                """
            )
        }
    )


def scoped_client_clause(alias=""):
    prefix = f"{alias}." if alias else ""
    if g.user["role"] == "admin":
        return "", ()
    return f"WHERE {prefix}client_id = ?", (g.user["id"],)


@app.route("/api/appointments", methods=["GET", "POST"])
@require_auth()
def appointments():
    if request.method == "POST":
        payload = request.get_json(force=True)
        client_id = payload.get("client_id") if g.user["role"] == "admin" else g.user["id"]
        if not client_id or not payload.get("scheduled_at") or not payload.get("reason"):
            return jsonify({"error": "Cliente, data e motivo são obrigatórios."}), 400
        appointment_id = execute(
            """
            INSERT INTO appointments (client_id, doctor, scheduled_at, status, reason, notes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                client_id,
                payload.get("doctor") or "Equipe clínica",
                payload["scheduled_at"],
                payload.get("status") or "Solicitado",
                payload["reason"],
                payload.get("notes", ""),
                now_iso(),
            ),
        )
        return jsonify({"appointment": appointment_detail(appointment_id)}), 201

    clause, params = scoped_client_clause("a")
    return jsonify(
        {
            "appointments": query(
                f"""
                SELECT a.*, u.name AS client_name, u.email AS client_email
                FROM appointments a
                JOIN users u ON u.id = a.client_id
                {clause}
                ORDER BY a.scheduled_at DESC
                """,
                params,
            )
        }
    )


def appointment_detail(appointment_id):
    return query(
        """
        SELECT a.*, u.name AS client_name, u.email AS client_email
        FROM appointments a
        JOIN users u ON u.id = a.client_id
        WHERE a.id = ?
        """,
        (appointment_id,),
        one=True,
    )


@app.route("/api/consultations", methods=["GET", "POST"])
@require_auth()
def consultations():
    if request.method == "POST":
        if g.user["role"] != "admin":
            return jsonify({"error": "Somente a administração registra consultas."}), 403
        payload = request.get_json(force=True)
        consultation_id = execute(
            """
            INSERT INTO consultations
            (client_id, appointment_id, doctor, consultation_at, diagnosis, prescription, conduct, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload.get("client_id"),
                payload.get("appointment_id"),
                payload.get("doctor") or "Equipe clínica",
                payload.get("consultation_at") or now_iso(),
                payload.get("diagnosis", ""),
                payload.get("prescription", ""),
                payload.get("conduct", ""),
                now_iso(),
            ),
        )
        return jsonify({"consultation": query("SELECT * FROM consultations WHERE id = ?", (consultation_id,), one=True)}), 201
    clause, params = scoped_client_clause("c")
    return jsonify(
        {
            "consultations": query(
                f"""
                SELECT c.*, u.name AS client_name
                FROM consultations c
                JOIN users u ON u.id = c.client_id
                {clause}
                ORDER BY c.consultation_at DESC
                """,
                params,
            )
        }
    )


@app.route("/api/exams", methods=["GET", "POST"])
@require_auth()
def exams():
    if request.method == "POST":
        if g.user["role"] != "admin":
            return jsonify({"error": "Somente a administração registra exames."}), 403
        payload = request.get_json(force=True)
        exam_id = execute(
            """
            INSERT INTO exams (client_id, title, requested_at, status, result, file_url, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload.get("client_id"),
                payload.get("title"),
                payload.get("requested_at") or now_iso(),
                payload.get("status") or "Solicitado",
                payload.get("result", ""),
                payload.get("file_url", ""),
                now_iso(),
            ),
        )
        return jsonify({"exam": query("SELECT * FROM exams WHERE id = ?", (exam_id,), one=True)}), 201
    clause, params = scoped_client_clause("e")
    return jsonify(
        {
            "exams": query(
                f"""
                SELECT e.*, u.name AS client_name
                FROM exams e
                JOIN users u ON u.id = e.client_id
                {clause}
                ORDER BY e.requested_at DESC
                """,
                params,
            )
        }
    )


@app.route("/api/summary")
@require_auth()
def summary():
    if g.user["role"] == "admin":
        data = {
            "clients": query("SELECT COUNT(*) AS total FROM users WHERE role = 'client'", one=True)["total"],
            "appointments": query("SELECT COUNT(*) AS total FROM appointments", one=True)["total"],
            "consultations": query("SELECT COUNT(*) AS total FROM consultations", one=True)["total"],
            "exams": query("SELECT COUNT(*) AS total FROM exams", one=True)["total"],
        }
    else:
        uid = g.user["id"]
        data = {
            "appointments": query("SELECT COUNT(*) AS total FROM appointments WHERE client_id = ?", (uid,), one=True)["total"],
            "consultations": query("SELECT COUNT(*) AS total FROM consultations WHERE client_id = ?", (uid,), one=True)["total"],
            "exams": query("SELECT COUNT(*) AS total FROM exams WHERE client_id = ?", (uid,), one=True)["total"],
        }
    return jsonify({"summary": data})


if __name__ == "__main__":
    init_db()
    app.run(debug=True)
