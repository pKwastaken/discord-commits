const github = require("@actions/github");
const core = require("@actions/core");
const webhook = require("webhook-discord");

async function run() {
  const webhookUrl = core.getInput("webhookUrl").replace("/github", "");
  const hook = new webhook.Webhook(webhookUrl);

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

  const name = payload.sender.login;
  const repo = payload.repository.name;
  const branch = context.ref.replace("refs/heads/", "");
  const url = payload.repository.html_url;

  text += `- [${name}](${payload.sender.url}) on [${repo}](${url})/[${branch}](${url}/tree/${branch})`;

  const msg = new webhook.MessageBuilder()
    .setName(payload.sender.login)
    .setAvatar(payload.sender.avatar_url)
    .setText(text);

  hook.send(msg);
}

run();
