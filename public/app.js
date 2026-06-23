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

function showMsg(el, texto, ok = true) {
    el.textContent = texto;
    el.className = "msg " + (ok ? "ok" : "err");
}

async function registrar() {
    const body = { username: $("authUser").value, password: $("authPass").value };
    const r = await fetch(API + "/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    const data = await r.json();
    showMsg($("authMsg"), data.message, r.ok);
}

async function login() {
    const body = { username: $("authUser").value, password: $("authPass").value };
    const r = await fetch(API + "/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    const data = await r.json();
    if (r.ok) {
        token = data.jwt;
        localStorage.setItem("jwt", token);
        setStatus();
        showMsg($("authMsg"), data.message, true);
    } else {
        showMsg($("authMsg"), data.message, false);
    }
}

function logout() {
    token = null;
    localStorage.removeItem("jwt");
    setStatus();
    showMsg($("authMsg"), "Você saiu.", true);
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
    $("btnSalvar").dataset.modo = "criar";
    showMsg($("formMsg"), "");
}

async function salvarAluno() {
    const aluno = lerFormAluno();
    const modo = $("btnSalvar").dataset.modo || "criar";

    let resp;
    if (modo === "editar") {
        resp = await apiAuth("/alunos/" + aluno.id, {
            method: "PUT",
            body: JSON.stringify(aluno)
        });
    } else {
        resp = await apiAuth("/alunos", {
            method: "POST",
            body: JSON.stringify(aluno)
        });
    }

    showMsg($("formMsg"), resp.data.message || "OK", resp.ok);
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
    $("btnSalvar").dataset.modo = "editar";
}

async function excluir(id) {
    const resp = await apiAuth("/alunos/" + id, { method: "DELETE" });
    if (resp.ok) listar();
    else alert(resp.data.message || "Erro ao excluir");
}

async function listar() {
    const { ok, data } = await apiAuth("/alunos");
    const wrap = $("tabelaWrap");
    if (!ok) { wrap.innerHTML = `<p class="msg err">${data.message || "Erro"}</p>`; return; }

    let html = `<table><thead><tr>
        <th>id</th><th>nome</th><th>ra</th><th>nota1</th><th>nota2</th><th>ações</th>
        </tr></thead><tbody>`;
    data.forEach(a => {
        html += `<tr>
            <td>${a.id}</td><td>${a.nome}</td><td>${a.ra}</td>
            <td>${a.nota1}</td><td>${a.nota2}</td>
            <td class="acoes">
                <button onclick='editarPorId(${a.id})'>Editar</button>
                <button onclick='excluir(${a.id})'>Excluir</button>
            </td></tr>`;
    });
    html += "</tbody></table>";
    wrap.innerHTML = html;
    window.__alunos = data;
}

function editarPorId(id) {
    const aluno = (window.__alunos || []).find(a => a.id === id);
    if (aluno) editar(aluno);
}

async function verMedias() {
    const { ok, data } = await apiAuth("/alunos/medias");
    const wrap = $("tabelaWrap");
    if (!ok) { wrap.innerHTML = `<p class="msg err">${data.message || "Erro"}</p>`; return; }
    let html = `<table><thead><tr><th>nome</th><th>média</th></tr></thead><tbody>`;
    data.forEach(m => html += `<tr><td>${m.nome}</td><td>${m.media}</td></tr>`);
    wrap.innerHTML = html + "</tbody></table>";
}

async function verAprovados() {
    const { ok, data } = await apiAuth("/alunos/aprovados");
    const wrap = $("tabelaWrap");
    if (!ok) { wrap.innerHTML = `<p class="msg err">${data.message || "Erro"}</p>`; return; }
    let html = `<table><thead><tr><th>nome</th><th>status</th></tr></thead><tbody>`;
    data.forEach(a => {
        const pill = a.status === "aprovado"
            ? `<span class="pill pill-ok">aprovado</span>`
            : `<span class="pill pill-no">reprovado</span>`;
        html += `<tr><td>${a.nome}</td><td>${pill}</td></tr>`;
    });
    wrap.innerHTML = html + "</tbody></table>";
}

$("btnRegister").onclick = registrar;
$("btnLogin").onclick = login;
$("btnLogout").onclick = logout;
$("btnSalvar").onclick = salvarAluno;
$("btnLimpar").onclick = limparForm;
$("btnListar").onclick = listar;
$("btnMedias").onclick = verMedias;
$("btnAprovados").onclick = verAprovados;

setStatus();
