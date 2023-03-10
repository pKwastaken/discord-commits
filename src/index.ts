import { context } from "@actions/github"
import * as core from "@actions/core"
import fetch, { Response } from "node-fetch"
import { obfuscate } from "./utils"
import { Commit, PushEvent } from "@octokit/webhooks-definitions/schema"

const url = core.getInput("webhookUrl").replace("/github", "")
const data = context.payload as PushEvent

// https://docs.github.com/webhooks-and-events/webhooks/webhook-events-and-payloads#push

console.log(context)

const sender = data.sender!.login
const repo = data.repository!.name
const branch = context.ref.replace("refs/heads/", "")
const senderUrl = `${data.sender!.html_url}`
const repoUrl = `${data.repository!.html_url}`
const branchUrl = `${repoUrl}/tree/${branch}`

console.log(url, sender, repo, branch, senderUrl, repoUrl, branchUrl)

const footer = `- [${sender}](<${senderUrl}>) on [${repo}](<${repoUrl}>)/[${branch}](<${branchUrl}>)`
const privateFooter = `- [${sender}](<${senderUrl}>) on ${obfuscate(repo)}/${obfuscate(branch)}`

async function sendWebhook(text: string): Promise<Response> {
	console.log("INSIDE WEBHOOK")
	const options = {
		method: "POST",
		body: JSON.stringify({
			username: data.sender!.login,
			avatar_url: data.sender!.avatar_url,
			content: text
		}),
		headers: { "Content-Type": "application/json" }
	}
	console.log(options)

	return fetch(url, options)
}

function buildBuffer(commit: Commit): [string, boolean] {
	const id = commit.id.substring(0, 8)
	let buffer = `[\`${id}\`]`
	let message = commit.message
	let isPrivate = false

	if (message.startsWith("!") || message.startsWith("$")) {
		isPrivate = true
		buffer += `() `
		message = message.substring(1).trim()
		buffer += obfuscate(message)
	} else {
		buffer += `(<${repoUrl}/commit/${id}>) ${message}`
	}

	buffer += "\n"
	return [buffer, isPrivate]
}

async function run() {
	console.log("running???")
	let workingFooter = footer
	let text = ""

	for (const commit of data.commits) {
		const [buffer, isPrivate] = buildBuffer(commit)
		console.log(buffer)
		
		if (isPrivate) workingFooter = privateFooter
		if (buffer.length + text.length + workingFooter.length > 2000) {
			text += workingFooter
			console.log("SENDING WEBHOOK")
			const response = await sendWebhook(text)
			console.log(response)

			if (!response.ok) {
				core.setFailed(await response.text())
			}

			workingFooter = footer
			text = ""
		}

		text += buffer
		data.commits.shift()
	}
}

run()
