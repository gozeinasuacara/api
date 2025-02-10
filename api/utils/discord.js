const axios = require("axios");

async function getUserInfo(accessToken) {
    try {
        const response = await axios.get("https://discord.com/api/users/@me", {
            headers: { authorization: `Bearer ${accessToken}` },
        });
        return response.data;
    } catch (error) {
        return null;
    }
}

async function getGuildMember(guildId, userId, botToken) {
    try {
        const response = await axios.get(
            `https://discord.com/api/v9/guilds/${guildId}/members/${userId}`,
            { headers: { Authorization: `Bot ${botToken}` } }
        );
        return response.data;
    } catch (error) {
        return null;
    }
}

async function getGuild(guildId, botToken) {
    try {
        const response = await axios.get(
            `https://discord.com/api/v9/guilds/${guildId}`,
            { headers: { Authorization: `Bot ${botToken}` } }
        );
        return response.status;
    } catch (error) {
        return 404;
    }
}

async function updateUserRoles(guildId, userId, roleId, botToken) {
    try {

        const guildMember = await getGuildMember(guildId, userId, botToken);
        if (!guildMember) {
            return false;
        }

        if (guildMember.roles.includes(roleId)) {
            return true;
        }

        const newRoles = [...guildMember.roles, roleId];

        await axios.patch(
            `https://discord.com/api/v9/guilds/${guildId}/members/${userId}`,
            { roles: newRoles },
            { headers: { Authorization: `Bot ${botToken}`, "Content-Type": "application/json" } }
        );

        return true;
    } catch (error) {
        return false;
    }
}

module.exports = { getGuild, getUserInfo, getGuildMember, updateUserRoles };
