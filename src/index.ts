import { context } from "@actions/github"
import * as core from "@actions/core"
import fetch, { Response } from "node-fetch"
import { obfuscate } from "./utils"

const url = core.getInput("webhookUrl").replace("/github", "")
const data = context.payload

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

type Commit = {
	id: string
	message: string
	url: string
	[key: string]: any
}

async function sendWebhook(text: string): Promise<Response> {
	console.log(text)
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
	const response = await fetch(url, options)

	return response
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
	let workingFooter = footer
	let text = ""

	for (const commit of data.commits) {
		const [buffer, isPrivate] = buildBuffer(commit)
		
		if (isPrivate) workingFooter = privateFooter
		if (buffer.length + text.length + workingFooter.length > 2000) {
			text += workingFooter
			const response = await sendWebhook(text)

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
