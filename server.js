import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));

const users = [];

const alunos = [
    {
        id: 1,
        nome: "Asdrubal",
        ra: "11111",
        nota1: 8.5,
        nota2: 9.5
    },
    {
        id: 2,
        nome: "Lupita",
        ra: "22222",
        nota1: 7.5,
        nota2: 7
    },
    {
        id: 3,
        nome: "Zoroastro",
        ra: "33333",
        nota1: 3,
        nota2: 4
    }
];

function buscaAluno(id) {
    return alunos.findIndex(aluno => aluno.id === Number(id));
}

app.post("/register", async (req, res) => {
    const { username, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    users.push({ username, password: hashedPassword });
    console.log(users);

    return res.status(201).json({ message: "Usuário criado!" });
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    const user = users.find(user => user.username === username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Login Incorreto!" });
    }

    const token = jwt.sign(
        { username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "1h", algorithm: "HS256" }
    );

    console.log("Login efetuado pelo usuário " + user.username);

    return res.status(200).json({
        message: "Login efetuado pelo usuário " + user.username,
        jwt: token
    });
});

const authenticateJWT = (req, res, next) => {
    const authHeader = req.header("Authorization");
    console.log("Authorization: " + authHeader);

    let token;
    if (authHeader) {
        const parts = authHeader.split(" ");
        if (parts.length === 2) {
            token = parts[1];
        }
    }

    if (!token) {
        return res.status(401).json({ message: "Acesso negado. Token não fornecido." });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            if (err.name === "TokenExpiredError") {
                return res.status(401).json({ message: "Acesso negado. Token expirado." });
            } else if (err.name === "JsonWebTokenError") {
                return res.status(403).json({ message: "Acesso negado. Token inválido." });
            } else {
                return res.status(403).json({ message: "Acesso negado. Erro na verificação do token." });
            }
        }

        req.user = user;
        const issuedAtISO = new Date(user.iat * 1000).toISOString();
        const expiresAtISO = new Date(user.exp * 1000).toISOString();
        console.log(`Token validado para usuário: ${user.username}
            Emitido em: ${issuedAtISO}
            Expira em: ${expiresAtISO}
        `);

        next();
    });
};

app.use(authenticateJWT);

app.get("/alunos", (req, res) => {
    return res.status(200).json(alunos);
});

app.get("/alunos/medias", (req, res) => {
    const medias = alunos.map(aluno => ({
        nome: aluno.nome,
        media: (aluno.nota1 + aluno.nota2) / 2
    }));
    return res.status(200).json(medias);
});

app.get("/alunos/aprovados", (req, res) => {
    const resultado = alunos.map(aluno => {
        const media = (aluno.nota1 + aluno.nota2) / 2;
        return {
            nome: aluno.nome,
            status: media >= 6 ? "aprovado" : "reprovado"
        };
    });
    return res.status(200).json(resultado);
});

app.get("/alunos/:id", (req, res) => {
    const index = buscaAluno(req.params.id);

    if (index === -1) {
        return res.status(404).json({ message: "Aluno não encontrado!" });
    }

    return res.status(200).json(alunos[index]);
});

app.post("/alunos", (req, res) => {
    const { id, nome, ra, nota1, nota2 } = req.body;

    alunos.push({ id, nome, ra, nota1, nota2 });
    console.log(alunos);

    return res.status(201).json({ message: "Aluno criado com sucesso!" });
});

app.put("/alunos/:id", (req, res) => {
    const index = buscaAluno(req.params.id);

    if (index === -1) {
        return res.status(404).json({ message: "Aluno não encontrado!" });
    }

    const { nome, ra, nota1, nota2 } = req.body;

    alunos[index].nome = nome;
    alunos[index].ra = ra;
    alunos[index].nota1 = nota1;
    alunos[index].nota2 = nota2;

    return res.status(200).json(alunos[index]);
});

app.delete("/alunos/:id", (req, res) => {
    const index = buscaAluno(req.params.id);

    if (index === -1) {
        return res.status(404).json({ message: "Aluno não encontrado!" });
    }

    alunos.splice(index, 1);
    console.log(alunos);

    return res.status(200).json({ message: "Aluno removido!" });
});

app.listen(PORT, () => {
    console.log("Servidor ativo e aguardando requisições...");
});
