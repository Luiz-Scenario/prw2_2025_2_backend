const API = "";

let token = localStorage.getItem("jwt") || null;

const $ = (id) => document.getElementById(id);

function setStatus() {
    const badge = $("statusLogin");
    if (token) {
        badge.textContent = "Autenticado";
        badge.className = "badge badge-on";
    } else {
        badge.textContent = "Não autenticado";
        badge.className = "badge badge-off";
    }
}

function mostrarResposta(status, data) {
    $("respostaJson").textContent = "Status: " + status + "\n\n" + JSON.stringify(data, null, 4);
}

async function registrar() {
    const body = { username: $("authUser").value, password: $("authPass").value };
    const r = await fetch(API + "/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    const data = await r.json();
    mostrarResposta(r.status, data);
}

async function login() {
    const body = { username: $("authUser").value, password: $("authPass").value };
    const r = await fetch(API + "/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    const data = await r.json();
    mostrarResposta(r.status, data);
    if (r.ok) {
        token = data.jwt;
        localStorage.setItem("jwt", token);
        setStatus();
    }
}

function logout() {
    token = null;
    localStorage.removeItem("jwt");
    setStatus();
    mostrarResposta(200, { info: "Sessão encerrada (apenas no cliente)." });
}

async function apiAuth(rota, opcoes = {}) {
    const headers = Object.assign(
        { "Content-Type": "application/json" },
        opcoes.headers || {},
        token ? { Authorization: "Bearer " + token } : {}
    );
    const r = await fetch(API + rota, { ...opcoes, headers });
    const data = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, data };
}

function lerFormAluno() {
    return {
        id: Number($("alId").value),
        nome: $("alNome").value,
        ra: $("alRa").value,
        nota1: Number($("alNota1").value),
        nota2: Number($("alNota2").value)
    };
}

function limparForm() {
    ["alId", "alNome", "alRa", "alNota1", "alNota2"].forEach(id => $(id).value = "");
    $("formTitulo").textContent = "Cadastrar aluno";
    $("formHint").textContent = 'Preencha os campos e clique em "Salvar aluno" para cadastrar. Para alterar, clique em "Editar" na tabela de resultados.';
    $("btnSalvar").textContent = "Salvar aluno";
    $("rotaSalvar").textContent = "POST /alunos";
    $("btnSalvar").dataset.modo = "criar";
    $("alId").disabled = false;
    $("cardForm").classList.remove("form-edicao");
}

async function salvarAluno() {
    const aluno = lerFormAluno();
    const modo = $("btnSalvar").dataset.modo || "criar";

    let resp;
    if (modo === "editar") {
        resp = await apiAuth("/alunos/" + aluno.id, { method: "PUT", body: JSON.stringify(aluno) });
    } else {
        resp = await apiAuth("/alunos", { method: "POST", body: JSON.stringify(aluno) });
    }

    mostrarResposta(resp.status, resp.data);
    if (resp.ok) {
        limparForm();
        listar();
    }
}

function editar(aluno) {
    $("alId").value = aluno.id;
    $("alNome").value = aluno.nome;
    $("alRa").value = aluno.ra;
    $("alNota1").value = aluno.nota1;
    $("alNota2").value = aluno.nota2;
    $("formTitulo").textContent = "Editar aluno #" + aluno.id;
    $("formHint").textContent = 'Altere os campos desejados e clique em "Atualizar aluno". O id não pode ser alterado. Use "Limpar" para cancelar.';
    $("btnSalvar").textContent = "Atualizar aluno";
    $("rotaSalvar").textContent = "PUT /alunos/:id";
    $("btnSalvar").dataset.modo = "editar";
    $("alId").disabled = true;
    $("cardForm").classList.add("form-edicao");
    window.scrollTo({ top: 0, behavior: "smooth" });
    $("alNome").focus();
}

async function excluir(id, nome) {
    if (!confirm("Excluir o aluno " + nome + " (id " + id + ")?")) return;
    const resp = await apiAuth("/alunos/" + id, { method: "DELETE" });
    mostrarResposta(resp.status, resp.data);
    if (resp.ok) listar();
}

function renderAlunos(lista) {
    let html = `<table><thead><tr>
        <th>id</th><th>nome</th><th>ra</th><th>nota1</th><th>nota2</th><th>ações</th>
        </tr></thead><tbody>`;
    lista.forEach(a => {
        html += `<tr>
            <td>${a.id}</td><td>${a.nome}</td><td>${a.ra}</td>
            <td>${a.nota1}</td><td>${a.nota2}</td>
            <td class="acoes">
                <button class="mini mini-edit" onclick='editarPorId(${a.id})'>Editar</button>
                <button class="mini mini-del" onclick='excluir(${a.id}, "${a.nome}")'>Excluir</button>
            </td></tr>`;
    });
    html += "</tbody></table>";
    $("tabelaWrap").innerHTML = html;
    window.__alunos = lista;
}

async function listar() {
    const { status, ok, data } = await apiAuth("/alunos");
    mostrarResposta(status, data);
    if (ok) renderAlunos(data);
}

async function buscarPorId() {
    const id = $("buscaId").value;
    if (!id) { mostrarResposta(0, { erro: "Informe um id para buscar." }); return; }
    const { status, ok, data } = await apiAuth("/alunos/" + id);
    mostrarResposta(status, data);
    if (ok) renderAlunos([data]);
    else $("tabelaWrap").innerHTML = `<p class="msg">Nenhum aluno para mostrar.</p>`;
}

async function verMedias() {
    const { status, ok, data } = await apiAuth("/alunos/medias");
    mostrarResposta(status, data);
    if (!ok) return;
    let html = `<table><thead><tr><th>nome</th><th>média</th></tr></thead><tbody>`;
    data.forEach(m => html += `<tr><td>${m.nome}</td><td>${m.media}</td></tr>`);
    $("tabelaWrap").innerHTML = html + "</tbody></table>";
}

async function verAprovados() {
    const { status, ok, data } = await apiAuth("/alunos/aprovados");
    mostrarResposta(status, data);
    if (!ok) return;
    let html = `<table><thead><tr><th>nome</th><th>status</th></tr></thead><tbody>`;
    data.forEach(a => {
        const pill = a.status === "aprovado"
            ? `<span class="pill pill-ok">aprovado</span>`
            : `<span class="pill pill-no">reprovado</span>`;
        html += `<tr><td>${a.nome}</td><td>${pill}</td></tr>`;
    });
    $("tabelaWrap").innerHTML = html + "</tbody></table>";
}

function editarPorId(id) {
    const aluno = (window.__alunos || []).find(a => a.id === id);
    if (aluno) editar(aluno);
}

$("btnRegister").onclick = registrar;
$("btnLogin").onclick = login;
$("btnLogout").onclick = logout;
$("btnSalvar").onclick = salvarAluno;
$("btnLimpar").onclick = limparForm;
$("btnListar").onclick = listar;
$("btnMedias").onclick = verMedias;
$("btnAprovados").onclick = verAprovados;
$("btnBuscarId").onclick = buscarPorId;

setStatus();
