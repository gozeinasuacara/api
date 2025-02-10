const fs = require('fs');
const configPath = './config.json';

// config -> config.json

function loadConfig() {
    if (!fs.existsSync(configPath)) {
      fs.writeFileSync(configPath, JSON.stringify({}, null, 2));
    }
    return JSON.parse(fs.readFileSync(configPath, "utf-8"));
}
  
function saveConfig(config) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

// config -> users.json

function loadConfig2() {
    if (!fs.existsSync("./databases/users.json")) {
      fs.writeFileSync("./databases/users.json", JSON.stringify({}, null, 2));
    }
    return JSON.parse(fs.readFileSync("./databases/users.json", "utf-8"));
}

function saveConfig2(config) {
    fs.writeFileSync("./databases/users.json", JSON.stringify(config, null, 2));
}

module.exports = {
    loadConfig,
    saveConfig,
    loadConfig2,
    saveConfig2
};