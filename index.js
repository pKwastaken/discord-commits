const github = require("@actions/github");
const core = require("@actions/core");
const { Webhook } = require("discord-webhook-node");

async function run() {
  const webhookUrl = core.getInput("webhookUrl").replace("/github", "");
  const hook = new Webhook(webhookUrl);

  const context = github.context;
  const payload = context.payload;

  let text = "";

  for (const commit of payload.commits) {
    text += `[\`${commit.id.substring(0, 7)}\`](${commit.url}) ${
      commit.message.includes("!private")
        ? "\`This commit has been marked as private!\`"
        : commit.message
    }\n`;
  }

  const sender = payload.sender.login;
  const repo = payload.repository.name;
  const branch = context.ref.replace("refs/heads/", "");
  const senderUrl = `<${payload.sender.html_url}>`;
  const repoUrl = `<${payload.repository.html_url}>`;
  const branchUrl = `<${repoUrl}/tree/${branch}>`;

  text += `- [${sender}](${senderUrl}) on [${repo}](${repoUrl})/[${branch}](${branchUrl})`;
  
  hook.setUsername(payload.sender.login)
  hook.setAvatar(payload.sender.avatar_url)

  hook.send(text);
}

run();