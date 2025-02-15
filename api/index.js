const discordOauth = require("discord-oauth2");
const oauth = new discordOauth();
const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require('path');
const rateLimit = require("express-rate-limit");

const verifyKeyLimiter = rateLimit({
    windowMs: 3 * 60 * 1000,
    max: 15,
    message: {
        status: 429,
        message: "Muitas requisições. Por favor, tente novamente mais tarde."
    },
    headers: true
});

const { loadConfig, saveConfig, loadConfig2 } = require('./utils/config');

const app = express();
const port = 80;

// config: obter, salvar e gerar Key
function generateKey() {
    return crypto.randomBytes(32).toString("hex");
}

function obterKey() {
    const config = loadConfig();

    if (!config.authorization) {
        config.authorization = generateKey();
        saveConfig(config);
    }

    return config.authorization;
}


// api

app.use(express.json());

app.get("/", (req, res) => {
    res.status(200).json({ status: 200, message: "EaseAPI_Website" });
});

app.get("/members", (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || authHeader !== obterKey()) {
            return res.status(401).json({ status: 401, message: "token inválido" });
        }

        const db = loadConfig2();

        if (!db || (typeof db !== 'object' && !Array.isArray(db))) {
            return res.status(500).json({
                status: 500,
                message: "faltam informacoes"
            });
        }

        const memberCount = Array.isArray(db) ? db.length : Object.keys(db).length;

        return res.status(200).json({
            status: 200,
            message: memberCount
        });

    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: "internal error",
            error: error.message
        });
    }
});

app.get("/verifyKey", verifyKeyLimiter, (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || authHeader !== obterKey()) {
            return res.status(401).json({ status: 401, message: "token inválido" });
        }

        return res.status(200).json({
            status: 200,
            message: "token válido"
        });

    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: "internal error",
            error: error.message
        });
    }
});

const loginRoutes = require("./routes/Login");
const configRoutes = require("./routes/Config");
const responseRoutes = require("./routes/Response");
const pullMembers = require("./routes/PullMembers")

app.use("/login", loginRoutes);
app.use("/config", configRoutes);
app.use("/auth", responseRoutes);
app.use("/pullmembers", pullMembers);

// start

app.listen(port, () => {
    console.clear()
    console.log("\x1b[36m%s\x1b[0m", "   .___.__. __..___  .__..  ..___..  .")
    console.log("\x1b[36m%s\x1b[0m", "   [__ [__](__ [__   [__]|  |  |  |__|")
    console.log("\x1b[36m%s\x1b[0m", "   [___|  |.__)[___  |  ||__|  |  |  |")
    console.log("\x1b[36m%s\x1b[0m", "           Developed by gui ;)        ")
    console.log("")
    key = obterKey()
    console.log(`   Chave de acesso: ${key}`)
});
