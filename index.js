const github = require("@actions/github");
const core = require("@actions/core");
const { Webhook } = require("discord-webhook-node");

async function run() {
  const webhookUrl = core.getInput("webhookUrl").replace("/github", "");

  const context = github.context;
  const payload = context.payload;
  
  const branches = core.getMultilineInput("branches");
  const branch = context.ref.replace("refs/heads/", "");
  
  try {
    if (branches.length != 0 && !branches.includes(branch)) return;
  } catch (error) {}
  
  const hook = new Webhook(webhookUrl);

  const blocks = ["▂", "▄", "▆", "█"];
  let text = "";

  for (const commit of payload.commits) {
    text += `[\`${commit.id.substring(0, 7)}\`](<${commit.url}>) `;

    let message = commit.message;

    if (message.includes("!")) {
      message = message.replace("!", "");

      for (let i = 0; i < message.length; i++) {
        const code = message.charAt(i);

        if (code.match(/^[\p{L}\p{N}]*$/u)) {
          text += blocks[(blocks.length * Math.random()) | 0];
        } else {
          text += code;
        }
      }
    } else {
      text += message;
    }
    text += "\n";
  }

  const sender = payload.sender.login;
  const repo = payload.repository.name;
  const senderUrl = `${payload.sender.html_url}`;
  const repoUrl = `${payload.repository.html_url}`;
  const branchUrl = `${repoUrl}/tree/${branch}`;

  text += `- [${sender}](<${senderUrl}>) on [${repo}](<${repoUrl}>)/[${branch}](<${branchUrl}>)`;

  hook.setUsername(payload.sender.login);
  hook.setAvatar(payload.sender.avatar_url);

  hook.send(text);
}

run();
