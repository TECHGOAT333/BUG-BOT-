require("./settings")

const fs = require("fs")
const path = require("path")
const { connectBot } = require("./lib/connection")

// ===============================
// COMMAND LOADER
// ===============================

const commands = new Map()

const commandsPath =
    path.join(__dirname, "commands")

if (fs.existsSync(commandsPath)) {
    const files = fs
        .readdirSync(commandsPath)
        .filter(
            file => file.endsWith(".js")
        )

    for (const file of files) {
        try {
            const command =
                require(
                    path.join(
                        commandsPath,
                        file
                    )
                )

            if (
                command.name &&
                typeof command.execute ===
                    "function"
            ) {
                commands.set(
                    command.name.toLowerCase(),
                    command
                )

                console.log(
                    "✅ Loaded command: " +
                    command.name
                )
            }

        } catch (error) {
            console.error(
                "❌ Failed to load " +
                file +
                ":",
                error.message
            )
        }
    }
}

// ===============================
// START
// ===============================

console.log(`
==============================
🤖 BUG-BOT Starting...
==============================
`)

async function start() {
    const sock = await connectBot()

    if (!sock) {
        console.log(
            "❌ WhatsApp socket unavailable."
        )

        return
    }

    // ===============================
    // MESSAGE HANDLER
    // ===============================

    sock.ev.on(
        "messages.upsert",
        async ({ messages }) => {
            try {
                const msg = messages[0]

                if (
                    !msg ||
                    !msg.message
                ) {
                    return
                }

                if (
                    msg.key.fromMe
                ) {
                    return
                }

                const jid =
                    msg.key.remoteJid

                const text =
                    msg.message
                        .conversation ||
                    msg.message
                        .extendedTextMessage
                        ?.text ||
                    ""

                if (
                    !text.startsWith(
                        global.prefix
                    )
                ) {
                    return
                }

                const body =
                    text
                        .slice(
                            global.prefix.length
                        )
                        .trim()

                if (!body) {
                    return
                }

                const args =
                    body.split(/\s+/)

                const commandName =
                    args
                        .shift()
                        .toLowerCase()

                const command =
                    commands.get(
                        commandName
                    )

                if (!command) {
                    return
                }

                await command.execute(
                    sock,
                    msg,
                    args
                )

            } catch (error) {
                console.error(
                    "❌ Message Error:",
                    error
                )
            }
        }
    )
}

start()
