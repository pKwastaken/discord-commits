import { context } from "@actions/github"
import * as core from "@actions/core"
import fetch from "node-fetch"
import { PushEvent } from "@octokit/webhooks-definitions/schema"
import { generateText, obfuscate } from "./utils"

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

let buffer = new String()

async function send(): Promise<void> {
	const content = buffer + footer()
	const res = await fetch(url, {
		method: "POST",
		body: JSON.stringify({
			username: sender,
			avatar_url: data.sender.avatar_url,
			content: content
		}),
		headers: { "Content-Type": "application/json" }
	})

	if (!res.ok)
		core.setFailed(await res.text())

	buffer = new String()
}

async function run(): Promise<void> {
	if (context.eventName !== "push")
		return

	let hasSent = false
	console.log(data.commits)
	for (const commit of data.commits) {
		hasSent = false
		let [text, _private] = generateText(commit)
		if (_private) isPrivate = true
		console.log("text: " + text)
		console.log("buffer: " + buffer)
		console.log("length: " + Number(buffer.length + footer().length + text.length))

		if (buffer.length + footer().length + text.length >= 2000) {
			await send()
			hasSent = true
		}

		buffer += text
		data.commits.shift()
	}

	if (!hasSent)
		await send()
}

run()
