const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys")

const P = require("pino")

let reconnecting = false

async function connectBot() {
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

        sock.ev.on(
            "creds.update",
            saveCreds
        )

        sock.ev.on(
            "connection.update",
            async (update) => {
                const {
                    connection,
                    lastDisconnect
                } = update

                if (connection === "connecting") {
                    console.log(
                        "🔄 Connecting to WhatsApp..."
                    )
                }

                if (
                    connection === "open"
                ) {
                    reconnecting = false

                    console.log(`
╔══════════════════════════════╗
║          BUG-BOT             ║
║       Successfully ON        ║
╠══════════════════════════════╣
║ Version : ${global.botVersion}
║ Owner   : ${global.owner}
║ Prefix  : ${global.prefix}
╚══════════════════════════════╝
`)
                }

                if (
                    connection === "close"
                ) {
                    const statusCode =
                        lastDisconnect
                            ?.error
                            ?.output
                            ?.statusCode

                    const reconnect =
                        statusCode !==
                        DisconnectReason.loggedOut

                    console.log(
                        "❌ WhatsApp connection closed."
                    )

                    if (
                        reconnect &&
                        !reconnecting
                    ) {
                        reconnecting = true

                        console.log(
                            "🔄 Reconnecting in 5 seconds..."
                        )

                        setTimeout(() => {
                            reconnecting = false
                            connectBot()
                        }, 5000)

                    } else if (!reconnect) {
                        console.log(
                            "⚠️ WhatsApp session logged out."
                        )
                    }
                }
            }
        )

        // ===============================
        // PAIRING CODE
        // ===============================

        if (!state.creds.registered) {
            const phoneNumber =
                String(global.owner)
                    .replace(/\D/g, "")

            if (
                !phoneNumber ||
                phoneNumber.length < 8
            ) {
                console.log(
                    "❌ Invalid owner number."
                )

                return sock
            }

            await new Promise(
                resolve =>
                    setTimeout(resolve, 3000)
            )

            try {
                console.log(
                    "\n📱 Requesting pairing code...\n"
                )

                const code =
                    await sock.requestPairingCode(
                        phoneNumber
                    )

                console.log(`
╔══════════════════════════════════╗
║       🤖 BUG-BOT PAIRING         ║
╠══════════════════════════════════╣
║                                  ║
║       CODE: ${code}              ║
║                                  ║
╚══════════════════════════════════╝
`)

            } catch (error) {
                console.error(
                    "❌ Pairing Code Error:",
                    error.message
                )
            }
        }

        return sock

    } catch (error) {
        console.error(
            "❌ Connection Error:",
            error.message
        )

        setTimeout(
            connectBot,
            5000
        )
    }
}

module.exports = {
    connectBot
}
