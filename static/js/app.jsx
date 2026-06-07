const { useEffect, useMemo, useState } = React;

const api = {
  token: () => localStorage.getItem("clinic_token"),
  setSession(session) {
    localStorage.setItem("clinic_token", session.token);
    localStorage.setItem("clinic_user", JSON.stringify(session.user));
  },
  clearSession() {
    localStorage.removeItem("clinic_token");
    localStorage.removeItem("clinic_user");
  },
  async request(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(this.token() ? { Authorization: `Bearer ${this.token()}` } : {}),
        ...(options.headers || {}),
      },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erro ao processar solicitação.");
    return data;
  },
};

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function AuthScreen({ onSession }) {
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "admin@clinica.com",
    password: "admin123",
    phone: "",
    document: "",
  });

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const endpoint = mode === "login" ? "/api/login" : "/api/register";
      const session = await api.request(endpoint, {
        method: "POST",
        body: JSON.stringify(form),
      });
      api.setSession(session);
      onSession(session.user);
    } catch (err) {
      setError(err.message);
    }
  }

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setForm((current) => ({
      ...current,
      email: nextMode === "login" ? "admin@clinica.com" : "",
      password: nextMode === "login" ? "admin123" : "",
    }));
  }

  return (
    <main className="auth-shell">
      <section className="brand-panel">
        <div className="brand-mark">CP</div>
        <div>
          <h1>Clínica Psiquiátrica</h1>
          <p>
            Gestão clínica integrada para administração, agenda, consultas, exames
            e resultados em uma única experiência.
          </p>
        </div>
      </section>
      <section className="auth-card">
        <h2>{mode === "login" ? "Acessar sistema" : "Cadastro de cliente"}</h2>
        <p className="muted">
          {mode === "login"
            ? "Administração e clientes entram pelo mesmo acesso."
            : "Crie uma conta para acompanhar consultas e resultados."}
        </p>
        <div className="tabs">
          <button className={`tab ${mode === "login" ? "active" : ""}`} onClick={() => switchMode("login")}>
            Login
          </button>
          <button className={`tab ${mode === "register" ? "active" : ""}`} onClick={() => switchMode("register")}>
            Cadastrar
          </button>
        </div>
        <form className="form-grid" onSubmit={submit}>
          {mode === "register" && (
            <>
              <label>
                Nome completo
                <input value={form.name} onChange={(event) => update("name", event.target.value)} required />
              </label>
              <div className="form-grid two">
                <label>
                  Telefone
                  <input value={form.phone} onChange={(event) => update("phone", event.target.value)} />
                </label>
                <label>
                  CPF
                  <input value={form.document} onChange={(event) => update("document", event.target.value)} />
                </label>
              </div>
            </>
          )}
          <label>
            E-mail
            <input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required />
          </label>
          <label>
            Senha
            <input type="password" value={form.password} onChange={(event) => update("password", event.target.value)} required />
          </label>
          {error && <div className="error">{error}</div>}
          <button className="primary" type="submit">
            {mode === "login" ? "Entrar" : "Criar conta"}
          </button>
          {mode === "login" && (
            <p className="muted">
              Admin: admin@clinica.com / admin123<br />
              Cliente: joana@email.com / cliente123
            </p>
          )}
        </form>
      </section>
    </main>
  );
}

function StatGrid({ summary, role }) {
  const items =
    role === "admin"
      ? [
          ["Clientes", summary.clients],
          ["Agendamentos", summary.appointments],
          ["Consultas", summary.consultations],
          ["Exames", summary.exams],
        ]
      : [
          ["Agendamentos", summary.appointments],
          ["Consultas", summary.consultations],
          ["Resultados", summary.exams],
        ];
  return (
    <div className="stats">
      {items.map(([label, value]) => (
        <article className="stat-card" key={label}>
          <span>{label}</span>
          <strong>{value || 0}</strong>
        </article>
      ))}
    </div>
  );
}

function RecordList({ items, type }) {
  if (!items.length) return <div className="empty">Nenhum registro encontrado.</div>;
  return (
    <div className="records">
      {items.map((item) => (
        <article className="record" key={`${type}-${item.id}`}>
          <div className="record-head">
            <div>
              <h4>{item.client_name || item.title || item.reason}</h4>
              {item.client_email && <p>{item.client_email}</p>}
            </div>
            {item.status && <span className="badge">{item.status}</span>}
          </div>
          {type === "appointments" && (
            <>
              <p><strong>{item.reason}</strong></p>
              <p>{item.doctor} • {formatDate(item.scheduled_at)}</p>
              {item.notes && <p>{item.notes}</p>}
            </>
          )}
          {type === "consultations" && (
            <>
              <p>{item.doctor} • {formatDate(item.consultation_at)}</p>
              {item.diagnosis && <p><strong>Diagnóstico:</strong> {item.diagnosis}</p>}
              {item.prescription && <p><strong>Prescrição:</strong> {item.prescription}</p>}
              {item.conduct && <p><strong>Conduta:</strong> {item.conduct}</p>}
            </>
          )}
          {type === "exams" && (
            <>
              <p>{formatDate(item.requested_at)}</p>
              {item.result && <p><strong>Resultado:</strong> {item.result}</p>}
              {item.file_url && <p><a href={item.file_url}>Abrir arquivo</a></p>}
            </>
          )}
          {type === "clients" && (
            <>
              <p>{item.phone || "Telefone não informado"}</p>
              <p>{item.document || "Documento não informado"}</p>
            </>
          )}
        </article>
      ))}
    </div>
  );
}

function AdminForm({ clients, active, onCreated }) {
  const [form, setForm] = useState({});
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    const map = {
      clients: "/api/clients",
      appointments: "/api/appointments",
      consultations: "/api/consultations",
      exams: "/api/exams",
    };
    try {
      await api.request(map[active], { method: "POST", body: JSON.stringify(form) });
      setForm({});
      onCreated();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="form-grid" onSubmit={submit}>
      {active === "clients" && (
        <>
          <label>Nome<input value={form.name || ""} onChange={(event) => update("name", event.target.value)} required /></label>
          <label>E-mail<input type="email" value={form.email || ""} onChange={(event) => update("email", event.target.value)} required /></label>
          <div className="form-grid two">
            <label>Telefone<input value={form.phone || ""} onChange={(event) => update("phone", event.target.value)} /></label>
            <label>CPF<input value={form.document || ""} onChange={(event) => update("document", event.target.value)} /></label>
          </div>
        </>
      )}
      {active !== "clients" && (
        <label>
          Cliente
          <select value={form.client_id || ""} onChange={(event) => update("client_id", event.target.value)} required>
            <option value="">Selecione</option>
            {clients.map((client) => <option value={client.id} key={client.id}>{client.name}</option>)}
          </select>
        </label>
      )}
      {active === "appointments" && (
        <>
          <label>Data e hora<input type="datetime-local" value={form.scheduled_at || ""} onChange={(event) => update("scheduled_at", event.target.value)} required /></label>
          <label>Profissional<input value={form.doctor || ""} onChange={(event) => update("doctor", event.target.value)} /></label>
          <label>Motivo<input value={form.reason || ""} onChange={(event) => update("reason", event.target.value)} required /></label>
          <label>Status<select value={form.status || "Confirmado"} onChange={(event) => update("status", event.target.value)}><option>Confirmado</option><option>Solicitado</option><option>Cancelado</option><option>Realizado</option></select></label>
          <label>Observações<textarea value={form.notes || ""} onChange={(event) => update("notes", event.target.value)} /></label>
        </>
      )}
      {active === "consultations" && (
        <>
          <label>Data da consulta<input type="datetime-local" value={form.consultation_at || ""} onChange={(event) => update("consultation_at", event.target.value)} required /></label>
          <label>Profissional<input value={form.doctor || ""} onChange={(event) => update("doctor", event.target.value)} /></label>
          <label>Diagnóstico<textarea value={form.diagnosis || ""} onChange={(event) => update("diagnosis", event.target.value)} /></label>
          <label>Prescrição<textarea value={form.prescription || ""} onChange={(event) => update("prescription", event.target.value)} /></label>
          <label>Conduta<textarea value={form.conduct || ""} onChange={(event) => update("conduct", event.target.value)} /></label>
        </>
      )}
      {active === "exams" && (
        <>
          <label>Título<input value={form.title || ""} onChange={(event) => update("title", event.target.value)} required /></label>
          <label>Solicitado em<input type="datetime-local" value={form.requested_at || ""} onChange={(event) => update("requested_at", event.target.value)} /></label>
          <label>Status<select value={form.status || "Solicitado"} onChange={(event) => update("status", event.target.value)}><option>Solicitado</option><option>Em análise</option><option>Resultado disponível</option></select></label>
          <label>Resultado<textarea value={form.result || ""} onChange={(event) => update("result", event.target.value)} /></label>
          <label>Link do arquivo<input value={form.file_url || ""} onChange={(event) => update("file_url", event.target.value)} /></label>
        </>
      )}
      {error && <div className="error">{error}</div>}
      <button className="primary" type="submit">Salvar registro</button>
    </form>
  );
}

function AdminDashboard({ user, onLogout }) {
  const [active, setActive] = useState("appointments");
  const [data, setData] = useState({ clients: [], appointments: [], consultations: [], exams: [], summary: {} });

  async function load() {
    const [clients, appointments, consultations, exams, summary] = await Promise.all([
      api.request("/api/clients"),
      api.request("/api/appointments"),
      api.request("/api/consultations"),
      api.request("/api/exams"),
      api.request("/api/summary"),
    ]);
    setData({
      clients: clients.clients,
      appointments: appointments.appointments,
      consultations: consultations.consultations,
      exams: exams.exams,
      summary: summary.summary,
    });
  }

  useEffect(() => { load(); }, []);

  const labels = {
    appointments: "Agendamentos",
    clients: "Clientes",
    consultations: "Consultas",
    exams: "Exames e resultados",
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-head">
          <div className="brand-mark">CP</div>
          <div><strong>Clínica Psiquiátrica</strong><span>Painel administrativo</span></div>
        </div>
        <nav className="nav-tabs">
          {Object.entries(labels).map(([key, label]) => (
            <button className={`nav-tab ${active === key ? "active" : ""}`} onClick={() => setActive(key)} key={key}>{label}</button>
          ))}
        </nav>
      </aside>
      <section className="main">
        <div className="topbar">
          <div className="section-title">
            <h2>{labels[active]}</h2>
            <p className="muted">Olá, {user.name}. Gerencie a operação clínica por aqui.</p>
          </div>
          <button className="secondary" onClick={onLogout}>Sair</button>
        </div>
        <StatGrid summary={data.summary} role="admin" />
        <div className="workspace">
          <section className="panel">
            <div className="panel-head"><h3>Registros</h3><button className="secondary" onClick={load}>Atualizar</button></div>
            <RecordList items={data[active] || []} type={active} />
          </section>
          <section className="panel">
            <div className="panel-head"><h3>Novo cadastro</h3></div>
            <AdminForm clients={data.clients} active={active} onCreated={load} />
          </section>
        </div>
      </section>
    </main>
  );
}

function ClientDashboard({ user, onLogout }) {
  const [active, setActive] = useState("appointments");
  const [data, setData] = useState({ appointments: [], consultations: [], exams: [], summary: {} });
  const [requestForm, setRequestForm] = useState({ scheduled_at: "", reason: "", notes: "" });
  const isMobileRoute = window.location.pathname === "/app" || window.innerWidth < 720;

  async function load() {
    const [appointments, consultations, exams, summary] = await Promise.all([
      api.request("/api/appointments"),
      api.request("/api/consultations"),
      api.request("/api/exams"),
      api.request("/api/summary"),
    ]);
    setData({
      appointments: appointments.appointments,
      consultations: consultations.consultations,
      exams: exams.exams,
      summary: summary.summary,
    });
  }

  useEffect(() => { load(); }, []);

  async function requestAppointment(event) {
    event.preventDefault();
    await api.request("/api/appointments", {
      method: "POST",
      body: JSON.stringify(requestForm),
    });
    setRequestForm({ scheduled_at: "", reason: "", notes: "" });
    load();
  }

  const labels = { appointments: "Agenda", consultations: "Consultas", exams: "Resultados" };
  const content = (
    <>
      <StatGrid summary={data.summary} role="client" />
      {active === "appointments" && (
        <section className="panel">
          <div className="panel-head"><h3>Solicitar agendamento</h3></div>
          <form className="form-grid" onSubmit={requestAppointment}>
            <label>Data desejada<input type="datetime-local" value={requestForm.scheduled_at} onChange={(event) => setRequestForm({ ...requestForm, scheduled_at: event.target.value })} required /></label>
            <label>Motivo<input value={requestForm.reason} onChange={(event) => setRequestForm({ ...requestForm, reason: event.target.value })} required /></label>
            <label>Observações<textarea value={requestForm.notes} onChange={(event) => setRequestForm({ ...requestForm, notes: event.target.value })} /></label>
            <button className="primary" type="submit">Enviar solicitação</button>
          </form>
        </section>
      )}
      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-head"><h3>{labels[active]}</h3><button className="secondary" onClick={load}>Atualizar</button></div>
        <RecordList items={data[active] || []} type={active} />
      </section>
    </>
  );

  if (isMobileRoute) {
    return (
      <main className="mobile-frame">
        <header className="mobile-top">
          <div className="topbar">
            <div><h2>Olá, {user.name.split(" ")[0]}</h2><p className="muted">Portal do paciente</p></div>
            <button className="ghost" onClick={onLogout}>Sair</button>
          </div>
        </header>
        <section className="mobile-content">{content}</section>
        <nav className="bottom-nav">
          {Object.entries(labels).map(([key, label]) => (
            <button className={active === key ? "active" : ""} onClick={() => setActive(key)} key={key}>{label}</button>
          ))}
          <button onClick={load}>Sync</button>
        </nav>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-head">
          <div className="brand-mark">CP</div>
          <div><strong>Portal do Cliente</strong><span>Consultas e resultados</span></div>
        </div>
        <nav className="nav-tabs">
          {Object.entries(labels).map(([key, label]) => (
            <button className={`nav-tab ${active === key ? "active" : ""}`} onClick={() => setActive(key)} key={key}>{label}</button>
          ))}
        </nav>
      </aside>
      <section className="main">
        <div className="topbar">
          <div className="section-title">
            <h2>Portal do Cliente</h2>
            <p className="muted">Acompanhe sua agenda, consultas, exames e resultados.</p>
          </div>
          <button className="secondary" onClick={onLogout}>Sair</button>
        </div>
        {content}
      </section>
    </main>
  );
}

function App() {
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("clinic_user"));
    } catch {
      return null;
    }
  }, []);
  const [user, setUser] = useState(storedUser);

  function logout() {
    api.clearSession();
    setUser(null);
  }

  if (!user) return <AuthScreen onSession={setUser} />;
  if (user.role === "admin") return <AdminDashboard user={user} onLogout={logout} />;
  return <ClientDashboard user={user} onLogout={logout} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
