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