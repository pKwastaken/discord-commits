import { context } from "@actions/github"
import * as core from "@actions/core"
import fetch, { Response } from "node-fetch"
import { obfuscate } from "./utils"
import { Commit, PushEvent } from "@octokit/webhooks-definitions/schema"

const url = core.getInput("webhookUrl").replace("/github", "")
const data = context.payload as PushEvent

const sender = data.sender!.login
const repo = data.repository!.name
const branch = context.ref.replace("refs/heads/", "")
const senderUrl = `${data.sender!.html_url}`
const repoUrl = `${data.repository!.html_url}`
const branchUrl = `${repoUrl}/tree/${branch}`

const originalFooter = `[${repo}](<${repoUrl}>)/[${branch}](<${branchUrl}>)`
const privateFooter = `${obfuscate(repo)}/${obfuscate(branch)}`

let isPrivate = false
const footer = () =>
	`- [${sender}](<${senderUrl}>) on ${
		isPrivate ? privateFooter : originalFooter
	}`

let text = new String()

async function send(): Promise<void> {
	const res = await fetch(url, {
		method: "POST",
		body: JSON.stringify({
			username: sender,
			avatar_url: data.sender.avatar_url,
			content: text
		}),
		headers: { "Content-Type": "application/json" }
	})

	if (!res.ok) {
		core.setFailed(await res.text())
	}

	text = new String()
}

function buildBuffer(commit: Commit): string {
	const id = commit.id.substring(0, 8)
	let buffer = `[\`${id}\`]`
	let message = commit.message
	let isPrivate = false

	if (message.startsWith("!") || message.startsWith("$")) {
		isPrivate = true
		buffer += `() [${obfuscate(message.substring(1).trim())}]`
	} else {
		buffer += `(<${repoUrl}/commit/${id}>) ${message}`
	}

	buffer += "\n"
	return buffer
}

async function run(): Promise<void> {
	if (context.eventName !== "push") return

	for (const commit of data.commits) {
		const buffer = buildBuffer(commit)
		text += buffer + footer()
		console.log(text.length)

		if (text.length >= 2000) await send()

		data.commits.shift()
	}

	await send()
}

run()
