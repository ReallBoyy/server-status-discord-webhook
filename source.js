const { exec } = require("child_process");
const { WebhookClient, EmbedBuilder } = require("discord.js");
const fs = require('fs');
const config = require("./config.json");
const WEBHOOK_URL = config.webhook_url;

const filter = WEBHOOK_URL.split('/');
const webhook_id = filter[filter.length - 2]
const webhook_token = filter[filter.length - 1]

const hook = new WebhookClient({id: webhook_id, token: webhook_token});

let lastMessageId = null;

function checkProcess(processName) {
  return new Promise((resolve, reject) => {
    exec("tasklist", (err, stdout, stderr) => {
      if (err || stderr) {
        return reject(err || stderr);
      }
      resolve(stdout.toLowerCase().includes(processName.toLowerCase()));
    });
  });
}

async function updateDiscordStatus(isRunning) {
  const status = isRunning
    ? "Status: :green_circle:"
    : "Status: :red_circle:";
const online = fs.readFileSync(config.online_file_path, 'utf-8');
  const embed = new EmbedBuilder()
    .setTitle("Server Update:")
    .setDescription(`${status}\nOnline Player: ${online} :globe_with_meridians:`)
    .setTimestamp();

  try {
    if (!lastMessageId) {
      const sentMessage = await hook.send({embeds: [embed]});
      lastMessageId = sentMessage.id;
    } else {
      await hook.editMessage(lastMessageId, {embeds: [embed]});
    }
  } catch (error) {
    console.error("Error updating Discord webhook:", error);
  }
}

async function monitorProcess() {
  try {
    const isRunning = await checkProcess(config.enet_server_name);
    await updateDiscordStatus(isRunning);
  } catch (error) {
    console.error("Error checking process:", error);
  }
}

setInterval(monitorProcess, 30000);

monitorProcess();
