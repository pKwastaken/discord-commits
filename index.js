const github = require("@actions/github");
const core = require("@actions/core");
const { Webhook } = require("discord-webhook-node");

const blocks = ["▂", "▄", "▆", "█"];

function obfuscate(input) {
  let output = "";

  for (let i = 0; i < input.length; i++) {
    const char = input.charAt(i);

    if (char.match(/\S+/)) {
      output += blocks[(blocks.length * Math.random()) | 0];
    } else {
      output += char;
    }
  }

  return output;
}

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

  let text = "";
  let isPrivate = false;

  for (const commit of payload.commits) {
    text += `[\`${commit.id.substring(0, 7)}\`](<${commit.url}>) `;

    let message = commit.message;

    if (message.includes("!")) {
      message = message.replace("!", "");
      isPrivate = true;
      text += obfuscate(message);
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

  if (isPrivate) {
    text += `- [${sender}](<${senderUrl}>) on ${obfuscate(repo)}/${obfuscate(branch)}`;
  } else {
    text += `- [${sender}](<${senderUrl}>) on [${repo}](<${repoUrl}>)/[${branch}](<${branchUrl}>)`;
  }

  hook.setUsername(payload.sender.login);
  hook.setAvatar(payload.sender.avatar_url);

  hook.send(text);
}

run();
