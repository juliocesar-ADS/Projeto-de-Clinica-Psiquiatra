const { useMemo, useState } = React;

const seed = {
  users: [
    { id: 1, name: "Admin Clínica", email: "admin@clinica.com", password: "admin123", role: "admin", phone: "(11) 99999-0000", document: "" },
    { id: 2, name: "Joana Martins", email: "joana@email.com", password: "cliente123", role: "client", phone: "(11) 98888-1010", document: "123.456.789-10" }
  ],
  appointments: [
    { id: 1, client_id: 2, client_name: "Joana Martins", client_email: "joana@email.com", doctor: "Dra. Helena Duarte", scheduled_at: "2026-06-12T09:30", status: "Confirmado", reason: "Retorno psiquiátrico", notes: "Chegar 10 minutos antes." }
  ],
  consultations: [
    { id: 1, client_id: 2, client_name: "Joana Martins", doctor: "Dra. Helena Duarte", consultation_at: "2026-05-20T14:00", diagnosis: "Acompanhamento de ansiedade generalizada", prescription: "Manter medicação conforme orientação médica.", conduct: "Retorno em 30 dias e psicoterapia semanal." }
  ],
  exams: [
    { id: 1, client_id: 2, client_name: "Joana Martins", title: "Exames laboratoriais de rotina", requested_at: "2026-05-22T10:00", status: "Resultado disponível", result: "Resultados dentro dos parâmetros informados pelo laboratório.", file_url: "" }
  ]
};

function loadState() {
  return JSON.parse(localStorage.getItem("clinic_pages_state") || "null") || seed;
}

function saveState(next) {
  localStorage.setItem("clinic_pages_state", JSON.stringify(next));
}

function formatDate(value) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "admin@clinica.com", password: "admin123", phone: "", document: "" });

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    const state = loadState();
    if (mode === "register") {
      if (!form.name || !form.email || !form.password) {
        setError("Nome, e-mail e senha são obrigatórios.");
        return;
      }
      if (state.users.some((user) => user.email === form.email)) {
        setError("Este e-mail já está cadastrado.");
        return;
      }
      const user = { ...form, id: Date.now(), role: "client" };
      const next = { ...state, users: [...state.users, user] };
      saveState(next);
      localStorage.setItem("clinic_pages_user", JSON.stringify(user));
      onLogin(user);
      return;
    }
    const user = state.users.find((item) => item.email === form.email && item.password === form.password);
    if (!user) {
      setError("E-mail ou senha inválidos.");
      return;
    }
    localStorage.setItem("clinic_pages_user", JSON.stringify(user));
    onLogin(user);
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setForm((current) => ({ ...current, email: nextMode === "login" ? "admin@clinica.com" : "", password: nextMode === "login" ? "admin123" : "" }));
  }

  return (
    <main className="auth-shell">
      <section className="brand-panel">
        <div className="brand-mark">CP</div>
        <div>
          <h1>Clínica Psiquiátrica</h1>
          <p>Prévia online do sistema para administração, consultas, exames, resultados e portal do cliente.</p>
        </div>
      </section>
      <section className="auth-card">
        <h2>{mode === "login" ? "Acessar sistema" : "Cadastro de cliente"}</h2>
        <p className="notice">Esta versão GitHub Pages é uma prévia estática. Os dados ficam no navegador. O sistema completo com banco roda pelo Flask.</p>
        <div className="tabs">
          <button className={`tab ${mode === "login" ? "active" : ""}`} onClick={() => switchMode("login")}>Login</button>
          <button className={`tab ${mode === "register" ? "active" : ""}`} onClick={() => switchMode("register")}>Cadastrar</button>
        </div>
        <form className="form-grid" onSubmit={submit}>
          {mode === "register" && (
            <>
              <label>Nome completo<input value={form.name} onChange={(event) => update("name", event.target.value)} required /></label>
              <div className="form-grid two">
                <label>Telefone<input value={form.phone} onChange={(event) => update("phone", event.target.value)} /></label>
                <label>CPF<input value={form.document} onChange={(event) => update("document", event.target.value)} /></label>
              </div>
            </>
          )}
          <label>E-mail<input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required /></label>
          <label>Senha<input type="password" value={form.password} onChange={(event) => update("password", event.target.value)} required /></label>
          {error && <div className="error">{error}</div>}
          <button className="primary" type="submit">{mode === "login" ? "Entrar" : "Criar conta"}</button>
          <p className="muted">Admin: admin@clinica.com / admin123<br />Cliente: joana@email.com / cliente123</p>
        </form>
      </section>
    </main>
  );
}

function StatGrid({ summary, role }) {
  const items = role === "admin"
    ? [["Clientes", summary.clients], ["Agendamentos", summary.appointments], ["Consultas", summary.consultations], ["Exames", summary.exams]]
    : [["Agendamentos", summary.appointments], ["Consultas", summary.consultations], ["Resultados", summary.exams]];
  return <div className="stats">{items.map(([label, value]) => <article className="stat-card" key={label}><span>{label}</span><strong>{value || 0}</strong></article>)}</div>;
}

function RecordList({ items, type }) {
  if (!items.length) return <div className="empty">Nenhum registro encontrado.</div>;
  return (
    <div className="records">
      {items.map((item) => (
        <article className="record" key={`${type}-${item.id}`}>
          <div className="record-head">
            <div><h4>{item.client_name || item.title || item.reason || item.name}</h4>{item.client_email && <p>{item.client_email}</p>}</div>
            {item.status && <span className="badge">{item.status}</span>}
          </div>
          {type === "appointments" && <><p><strong>{item.reason}</strong></p><p>{item.doctor} • {formatDate(item.scheduled_at)}</p>{item.notes && <p>{item.notes}</p>}</>}
          {type === "consultations" && <><p>{item.doctor} • {formatDate(item.consultation_at)}</p><p><strong>Diagnóstico:</strong> {item.diagnosis}</p><p><strong>Prescrição:</strong> {item.prescription}</p><p><strong>Conduta:</strong> {item.conduct}</p></>}
          {type === "exams" && <><p>{formatDate(item.requested_at)}</p><p><strong>Resultado:</strong> {item.result}</p></>}
          {type === "clients" && <><p>{item.email}</p><p>{item.phone || "Telefone não informado"}</p><p>{item.document || "Documento não informado"}</p></>}
        </article>
      ))}
    </div>
  );
}

function AppShell({ user, onLogout }) {
  const [state, setState] = useState(loadState());
  const [active, setActive] = useState(user.role === "admin" ? "appointments" : "appointments");
  const [form, setForm] = useState({});
  const labels = user.role === "admin"
    ? { appointments: "Agendamentos", clients: "Clientes", consultations: "Consultas", exams: "Exames e resultados" }
    : { appointments: "Agenda", consultations: "Consultas", exams: "Resultados" };
  const clients = state.users.filter((item) => item.role === "client");
  const visible = (key) => user.role === "admin" ? state[key] : state[key].filter((item) => item.client_id === user.id);
  const summary = user.role === "admin"
    ? { clients: clients.length, appointments: state.appointments.length, consultations: state.consultations.length, exams: state.exams.length }
    : { appointments: visible("appointments").length, consultations: visible("consultations").length, exams: visible("exams").length };

  function persist(next) {
    setState(next);
    saveState(next);
  }

  function addRecord(event) {
    event.preventDefault();
    const client = clients.find((item) => String(item.id) === String(form.client_id || user.id));
    const base = { id: Date.now(), client_id: client.id, client_name: client.name, client_email: client.email };
    const next = { ...state };
    if (active === "clients") {
      const newClient = { ...form, id: Date.now(), role: "client", password: form.password || "cliente123" };
      next.users = [...state.users, newClient];
    }
    if (active === "appointments") next.appointments = [{ ...base, doctor: form.doctor || "Equipe clínica", scheduled_at: form.scheduled_at, status: form.status || "Solicitado", reason: form.reason, notes: form.notes || "" }, ...state.appointments];
    if (active === "consultations") next.consultations = [{ ...base, doctor: form.doctor || "Equipe clínica", consultation_at: form.consultation_at, diagnosis: form.diagnosis || "", prescription: form.prescription || "", conduct: form.conduct || "" }, ...state.consultations];
    if (active === "exams") next.exams = [{ ...base, title: form.title, requested_at: form.requested_at || new Date().toISOString(), status: form.status || "Solicitado", result: form.result || "" }, ...state.exams];
    persist(next);
    setForm({});
  }

  function logout() {
    localStorage.removeItem("clinic_pages_user");
    onLogout();
  }

  const mobile = user.role !== "admin" && window.innerWidth < 720;
  const content = (
    <>
      <p className="notice">Prévia online estática. Para testar banco/API real, rode o Flask localmente.</p>
      <StatGrid summary={summary} role={user.role} />
      <section className="panel">
        <div className="panel-head"><h3>{labels[active]}</h3></div>
        <RecordList items={active === "clients" ? clients : visible(active)} type={active} />
      </section>
      {(user.role === "admin" || active === "appointments") && (
        <section className="panel" style={{ marginTop: 16 }}>
          <div className="panel-head"><h3>Novo registro</h3></div>
          <form className="form-grid" onSubmit={addRecord}>
            {active === "clients" ? (
              <>
                <label>Nome<input value={form.name || ""} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
                <label>E-mail<input value={form.email || ""} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label>
              </>
            ) : user.role === "admin" && (
              <label>Cliente<select value={form.client_id || ""} onChange={(event) => setForm({ ...form, client_id: event.target.value })} required><option value="">Selecione</option>{clients.map((client) => <option value={client.id} key={client.id}>{client.name}</option>)}</select></label>
            )}
            {active === "appointments" && <><label>Data<input type="datetime-local" value={form.scheduled_at || ""} onChange={(event) => setForm({ ...form, scheduled_at: event.target.value })} required /></label><label>Motivo<input value={form.reason || ""} onChange={(event) => setForm({ ...form, reason: event.target.value })} required /></label><label>Observações<textarea value={form.notes || ""} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label></>}
            {active === "consultations" && <><label>Data<input type="datetime-local" value={form.consultation_at || ""} onChange={(event) => setForm({ ...form, consultation_at: event.target.value })} required /></label><label>Diagnóstico<textarea value={form.diagnosis || ""} onChange={(event) => setForm({ ...form, diagnosis: event.target.value })} /></label><label>Prescrição<textarea value={form.prescription || ""} onChange={(event) => setForm({ ...form, prescription: event.target.value })} /></label></>}
            {active === "exams" && <><label>Título<input value={form.title || ""} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></label><label>Resultado<textarea value={form.result || ""} onChange={(event) => setForm({ ...form, result: event.target.value })} /></label></>}
            <button className="primary" type="submit">Salvar</button>
          </form>
        </section>
      )}
    </>
  );

  if (mobile) {
    return (
      <main className="mobile-frame">
        <header className="mobile-top"><div className="topbar"><div><h2>Olá, {user.name.split(" ")[0]}</h2><p className="muted">Portal do paciente</p></div><button className="ghost" onClick={logout}>Sair</button></div></header>
        <section className="mobile-content">{content}</section>
        <nav className="bottom-nav">{Object.entries(labels).map(([key, label]) => <button className={active === key ? "active" : ""} onClick={() => setActive(key)} key={key}>{label}</button>)}<button onClick={() => persist(seed)}>Reset</button></nav>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-head"><div className="brand-mark">CP</div><div><strong>{user.role === "admin" ? "Clínica Psiquiátrica" : "Portal do Cliente"}</strong><span>{user.role === "admin" ? "Painel administrativo" : "Consultas e resultados"}</span></div></div>
        <nav className="nav-tabs">{Object.entries(labels).map(([key, label]) => <button className={`nav-tab ${active === key ? "active" : ""}`} onClick={() => setActive(key)} key={key}>{label}</button>)}</nav>
      </aside>
      <section className="main">
        <div className="topbar"><div className="section-title"><h2>{labels[active]}</h2><p className="muted">Olá, {user.name}.</p></div><button className="secondary" onClick={logout}>Sair</button></div>
        {content}
      </section>
    </main>
  );
}

function App() {
  const stored = useMemo(() => JSON.parse(localStorage.getItem("clinic_pages_user") || "null"), []);
  const [user, setUser] = useState(stored);
  if (!user) return <AuthScreen onLogin={setUser} />;
  return <AppShell user={user} onLogout={() => setUser(null)} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
