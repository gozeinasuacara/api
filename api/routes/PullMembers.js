const { Router } = require("express");
const router = Router();
const axios = require("axios");

const { loadConfig, loadConfig2, saveConfig2 } = require('../utils/config');
const { getGuild } = require("../utils/discord");

async function getTokens({ code, refreshToken, grantType, redirectUri }) {
    const config = loadConfig();
    let body;
  
    if (grantType === "authorization_code") {
      if (!code) throw new Error("cod. de autorização não informado");
      body = `client_id=${config.clientid}&client_secret=${config.secret}&code=${code}&grant_type=authorization_code&redirect_uri=${redirectUri}&scope=identify`;
    } else if (grantType === "refresh_token") {
      if (!refreshToken) throw new Error("refresh token não informado");
      body = `client_id=${config.clientid}&client_secret=${config.secret}&refresh_token=${refreshToken}&grant_type=refresh_token&redirect_uri=${redirectUri}&scope=identify`;
    } else {
      throw new Error("grant inválido");
    }
  
    const response = await axios.post(
      "https://discord.com/api/oauth2/token",
      body,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    return response.data;
}

router.get("/guild", async (req, res) => {
  const config = loadConfig();

  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== config.authorization) {
    return res.status(401).json({ status: 401, message: "token inválido" });
  }

  const { guildID } = req.body;
  if (!guildID) {
    return res.status(400).json({ status: 400, message: "guildID é obrigatório" });
  }

  const status = await getGuild(guildID, config.token);
  
  if (status === 200) {
    return res.status(200).json({ status: 200, message: guildID });
  } else {
    return res.status(400).json({ status: 400, message: guildID });
  }
});


router.post("/1", async (req, res) => {
    const config = loadConfig();
    const config2 = loadConfig2();

    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== config.authorization) {
        return res.status(401).json({ status: 401, message: "token inválido" });
    }

    const { guildID } = req.body;
    if (!guildID) {
        return res.status(400).json({ status: 400, message: "guildID é obrigatório" });
    }
    
    let pulled = 0;
    let notPulled = 0;
    const userIds = Object.keys(config2);

    for (const userId of userIds) {
        const userData = config2[userId];
        try {
            const token = await getTokens({
                refreshToken: userData.refreshToken,
                grantType: "refresh_token",
                redirectUri: `${config.url}/auth/callback`
            });
            
            if (!token || !token.access_token || !token.refresh_token) {
                console.error(`Falha ao renovar token para o membro ${userId}`);
                notPulled++;
                continue;
            }
            
            config2[userId] = config2[userId] || {};
            config2[userId].acessToken = token.access_token;
            config2[userId].refreshToken = token.refresh_token;
            saveConfig2(config2);

            const access_token = token.access_token;
            const url = `https://discord.com/api/guilds/${guildID}/members/${userId}`;
            const payload = {
                access_token: access_token,
                roles: [],
                mute: false,
                deaf: false
            };
    
            const headers = {
                "Authorization": `Bot ${config.token}`,
                "Content-Type": "application/json"
            };
    
            await axios.put(url, payload, { headers });
            pulled++;
        } catch (error) {
            notPulled++;
        }
    }
    
    return res.status(200).json({
        status: 200,
        message: "processo de puxar membros concluído.",
        total: userIds.length,
        pulled,
        notPulled
    });
});

router.get("/2", async (req, res) => {
  const config = loadConfig();
  const usersData = loadConfig2();

  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== config.authorization) {
      return res.status(401).json({ status: 401, message: "token inválido" });
  }

  const { guildID } = req.body;
  if (!guildID) {
      return res.status(400).json({ status: 400, message: "guildID é obrigatório" });
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  });

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const userIds = Object.keys(usersData);
  let processed = 0;

  for (const userId of userIds) {
    const userData = usersData[userId];
    try {
      const token = await getTokens({
        refreshToken: userData.refreshToken,
        grantType: "refresh_token",
        redirectUri: `${config.url}/auth/callback`
      });

      if (!token.access_token || !token.refresh_token) {
        throw new Error("Token inválido na renovação");
      }

      usersData[userId] = usersData[userId] || {};
      usersData[userId].acessToken = token.access_token;
      usersData[userId].refreshToken = token.refresh_token;
      saveConfig2(usersData);

      const access_token = token.access_token;
      const url = `https://discord.com/api/guilds/${guildID}/members/${userId}`;
      const payload = {
        access_token: access_token,
        nick: userData.username,
        roles: [],
        mute: false,
        deaf: false
      };
      const headers = {
        "Authorization": `Bot ${config.token}`,
        "Content-Type": "application/json"
      };

      await axios.put(url, payload, { headers });

      sendEvent({
        status: "valid",
        user: { id: userId, email: userData.email || "não informado" },
        message: `membro puxado com sucesso (${++processed}/${userIds.length})`
      });
    } catch (error) {
      sendEvent({
        status: "invalid",
        user: { id: userId },
        error: error.response?.data || error.message,
        message: `erro ao puxar o membro ${userId} (${++processed}/${userIds.length})`
      });
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  sendEvent({ message: "processo de puxar membros concluído" });
  res.end();
});

module.exports = router;