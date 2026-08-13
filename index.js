require("./settings")

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys")

const P = require("pino")
const fs = require("fs")
const path = require("path")

// ===============================
// COMMAND LOADER
// ===============================

const commands = new Map()
const commandsPath = path.join(__dirname, "commands")

if (fs.existsSync(commandsPath)) {
    const files = fs
        .readdirSync(commandsPath)
        .filter(file => file.endsWith(".js"))

    for (const file of files) {
        try {
            const command = require(path.join(commandsPath, file))

            if (
                command.name &&
                typeof command.execute === "function"
            ) {
                commands.set(
                    command.name.toLowerCase(),
                    command
                )

                console.log("Loaded command: " + command.name)
            }
        } catch (error) {
            console.error(
                "Failed to load " + file + ":",
                error.message
            )
        }
    }
}

// ===============================
// START BOT
// ===============================

async function startBot() {
    try {
        const { state, saveCreds } =
            await useMultiFileAuthState("./auth")

        const sock = makeWASocket({
            auth: state,
            logger: P({ level: "silent" }),
            browser: [
                "BUG-BOT",
                "Chrome",
                "1.0.0"
            ]
        })

        sock.ev.on("creds.update", saveCreds)

        let pairingRequested = false

        // ===============================
        // CONNECTION
        // ===============================

        sock.ev.on(
            "connection.update",
            async (update) => {
                const {
                    connection,
                    lastDisconnect
                } = update

                // ===============================
                // PAIRING CODE
                // ===============================

                if (
                    !pairingRequested &&
                    !state.creds.registered
                ) {
                    pairingRequested = true

                    const phoneNumber =
                        String(global.owner)
                            .replace(/\D/g, "")

                    if (
                        !phoneNumber ||
                        phoneNumber.length < 8
                    ) {
                        console.log(
                            "Invalid owner number in settings.js"
                        )
                        return
                    }

                    try {
                        console.log(
                            "Requesting WhatsApp pairing code..."
                        )

                        const code =
                            await sock.requestPairingCode(
                                phoneNumber
                            )

                        console.log(
                            "\n=============================="
                        )

                        console.log(
                            "BUG-BOT PAIRING CODE"
                        )

                        console.log(
                            "CODE: " + code
                        )

                        console.log(
                            "==============================\n"
                        )

                    } catch (error) {
                        console.error(
                            "Pairing Code Error:",
                            error.message
                        )

                        pairingRequested = false
                    }
                }

                // ===============================
                // CONNECTED
                // ===============================

                if (connection === "open") {
                    console.log(
                        "\n=============================="
                    )

                    console.log(
                        "BUG-BOT SUCCESSFULLY CONNECTED"
                    )

                    console.log(
                        "Version: " +
                        global.botVersion
                    )

                    console.log(
                        "Owner: " +
                        global.owner
                    )

                    console.log(
                        "Prefix: " +
                        global.prefix
                    )

                    console.log(
                        "==============================\n"
                    )
                }

                // ===============================
                // CLOSED
                // ===============================

                if (connection === "close") {
                    const statusCode =
                        lastDisconnect
                            ?.error
                            ?.output
                            ?.statusCode

                    const reconnect =
                        statusCode !==
                        DisconnectReason.loggedOut

                    console.log(
                        "Connection closed."
                    )

                    if (reconnect) {
                        console.log(
                            "Reconnecting in 5 seconds..."
                        )

                        setTimeout(
                            startBot,
                            5000
                        )
                    } else {
                        console.log(
                            "WhatsApp session logged out."
                        )
                    }
                }
            }
        )

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

                    if (msg.key.fromMe) {
                        return
                    }

                    const jid =
                        msg.key.remoteJid

                    const text =
                        msg.message.conversation ||
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
                        "Message Error:",
                        error
                    )
                }
            }
        )

    } catch (error) {
        console.error(
            "Start Error:",
            error
        )

        setTimeout(
            startBot,
            5000
        )
    }
}

// ===============================
// START
// ===============================

console.log(
    "=============================="
)

console.log(
    "BUG-BOT Starting..."
)

console.log(
    "=============================="
)

startBot()
