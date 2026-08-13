const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys")

const P = require("pino")

const delay = ms =>
    new Promise(resolve => setTimeout(resolve, ms))

let reconnecting = false
let pairingStarted = false

async function connectBot() {
    try {
        const { state, saveCreds } =
            await useMultiFileAuthState("./auth")

        const sock = makeWASocket({
            auth: state,

            logger: P({
                level: "silent"
            }),

            printQRInTerminal: false,

            markOnlineOnConnect: false,

            browser: [
                "BUG-BOT",
                "Chrome",
                "1.0.0"
            ],

            syncFullHistory: false,

            connectTimeoutMs: 60000,

            keepAliveIntervalMs: 30000
        })

        sock.ev.on(
            "creds.update",
            saveCreds
        )

        // =================================
        // CONNECTION UPDATE
        // =================================

        sock.ev.on(
            "connection.update",
            async update => {
                const {
                    connection,
                    qr,
                    lastDisconnect
                } = update

                // =================================
                // PAIRING CODE
                // =================================

                if (
                    (connection === "connecting" || qr) &&
                    !state.creds.registered &&
                    !pairingStarted
                ) {
                    pairingStarted = true

                    await delay(3000)

                    const phoneNumber =
                        String(global.owner)
                            .replace(/[^0-9]/g, "")

                    if (
                        !phoneNumber ||
                        phoneNumber.length < 8
                    ) {
                        console.log(
                            "❌ Invalid owner number."
                        )

                        return
                    }

                    try {
                        console.log(
                            "\n📱 Preparing WhatsApp pairing...\n"
                        )

                        const code =
                            await sock.requestPairingCode(
                                phoneNumber
                            )

                        console.log(
                            "\n╔══════════════════════════════════╗"
                        )

                        console.log(
                            "║       🤖 BUG-BOT PAIRING        ║"
                        )

                        console.log(
                            "╠══════════════════════════════════╣"
                        )

                        console.log(
                            "║                                  ║"
                        )

                        console.log(
                            "║ CODE: " + code
                        )

                        console.log(
                            "║                                  ║"
                        )

                        console.log(
                            "╚══════════════════════════════════╝"
                        )

                        console.log(
                            "\n📲 WhatsApp → Settings → Linked Devices"
                        )

                        console.log(
                            "→ Link a Device → Link with phone number instead"
                        )

                        console.log(
                            "\n⚠️ Do not share this code."
                        )

                    } catch (error) {
                        console.error(
                            "\n❌ Pairing Code Error:",
                            error.message
                        )

                        pairingStarted = false
                    }
                }

                // =================================
                // CONNECTED
                // =================================

                if (
                    connection === "open"
                ) {
                    reconnecting = false
                    pairingStarted = false

                    console.log(
                        "\n╔══════════════════════════════╗"
                    )

                    console.log(
                        "║          BUG-BOT             ║"
                    )

                    console.log(
                        "║       SUCCESSFULLY ON        ║"
                    )

                    console.log(
                        "╠══════════════════════════════╣"
                    )

                    console.log(
                        "║ Version : " +
                        global.botVersion
                    )

                    console.log(
                        "║ Owner   : " +
                        global.owner
                    )

                    console.log(
                        "║ Prefix  : " +
                        global.prefix
                    )

                    console.log(
                        "╚══════════════════════════════╝\n"
                    )
                }

                // =================================
                // CONNECTION CLOSED
                // =================================

                if (
                    connection === "close"
                ) {
                    const statusCode =
                        lastDisconnect
                            ?.error
                            ?.output
                            ?.statusCode

                    const errorMessage =
                        lastDisconnect
                            ?.error
                            ?.message ||
                        "Unknown error"

                    console.log(
                        "\n❌ WhatsApp connection closed."
                    )

                    console.log(
                        "Reason:",
                        errorMessage
                    )

                    console.log(
                        "Status:",
                        statusCode || "unknown"
                    )

                    const shouldReconnect =
                        statusCode !==
                        DisconnectReason.loggedOut

                    if (
                        shouldReconnect &&
                        !reconnecting
                    ) {
                        reconnecting = true

                        console.log(
                            "\n🔄 Reconnecting in 5 seconds..."
                        )

                        setTimeout(
                            () => {
                                pairingStarted = false
                                reconnecting = false
                                connectBot()
                            },
                            5000
                        )
                    } else {
                        console.log(
                            "\n⚠️ WhatsApp session logged out."
                        )
                    }
                }
            }
        )

        return sock

    } catch (error) {
        console.error(
            "\n❌ Connection Error:",
            error
        )

        if (!reconnecting) {
            reconnecting = true

            setTimeout(
                () => {
                    reconnecting = false
                    pairingStarted = false
                    connectBot()
                },
                5000
            )
        }
    }
}

module.exports = {
    connectBot
                }
