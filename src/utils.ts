import { Commit } from "@octokit/webhooks-definitions/schema"

const blocks = ["▂", "▄", "▆", "█"]

export function obfuscate(input: string): string {
	let output = ""

	for (let i = 0; i < input.length; i++) {
		const char = input.charAt(i)

		if (char.match(/\S+/)) {
			const rand = Math.random() * blocks.length
			output += blocks[Math.trunc(rand)]
		} else {
			output += char
		}
	}

	return output
}

export function generateText(commit: Commit): [string, boolean] {
	const id = commit.id.substring(0, 8)
	const repo = commit.url.split("/commit")[0]
	let text = `[\`${id}\`]`
	let message = commit.message
	let isPrivate = false

	if (message.startsWith("!") || message.startsWith("$")) {
		isPrivate = true
		text += `() [${obfuscate(message.substring(1).trim())}]`
	} else {
		text += `(<${repo}/commit/${id}>) ${message}`
	}

	text += "\n"
	return [text, isPrivate]
}