const express = require("express");
const router = express.Router();
const { loadConfig, saveConfig } = require('../utils/config');

module.exports = router;

router.post("/", (req, res) => {
    const config = loadConfig();

    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || authHeader !== config.authorization) {
            return res.status(401).json({ status: 401, message: "token inválido" });
        }

        const requiredFields = ['clientid', 'secret', 'url', 'guild_id', 'role', 'token'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            return res.status(401).json({ status: 401, message: `faltando: ${missingFields.join(', ')}` });
        }

        const { clientid, secret, url, guild_id, role, token } = req.body;

        config.clientid = clientid;
        config.secret = secret;
        config.url = url;
        config.guild_id = guild_id;
        config.role = role;
        config.token = token;

        saveConfig(config);

        res.status(200).json({ status: 200, message: "informacoes salvas com sucesso" });

    } catch (error) {
        res.status(500).json({ status: 500, message: "erro na requisição", error: error.message });
    }
});