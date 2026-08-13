const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys")

const P = require("pino")
const readline = require("readline")

let reconnecting = false
let pairingStarted = false
let phoneNumber = null

// =================================
// ASK NUMBER FROM PANEL
// =================================

function askPhoneNumber() {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        })

        console.log("")
        console.log("╔══════════════════════════════════╗")
        console.log("║          🤖 BUG-BOT              ║")
        console.log("╠══════════════════════════════════╣")
        console.log("║                                  ║")
        console.log("║ 📱 Enter WhatsApp number         ║")
        console.log("║                                  ║")
        console.log("║ Example: 509XXXXXXXX             ║")
        console.log("║                                  ║")
        console.log("╚══════════════════════════════════╝")
        console.log("")

        rl.question(
            "📱 Number: ",
            answer => {
                rl.close()

                const number =
                    String(answer)
                        .replace(/[^0-9]/g, "")

                resolve(number)
            }
        )
    })
}

// =================================
// WAIT
// =================================

function delay(ms) {
    return new Promise(
        resolve => setTimeout(resolve, ms)
    )
}

// =================================
// CONNECT BOT
// =================================

async function connectBot() {
    try {
        const {
            state,
            saveCreds
        } = await useMultiFileAuthState("./auth")

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

            connectTimeoutMs: 60000,

            keepAliveIntervalMs: 30000
        })

        sock.ev.on(
            "creds.update",
            saveCreds
        )

        // =================================
        // REQUEST PAIRING CODE
        // =================================

        if (!state.creds.registered) {

            if (!phoneNumber) {
                phoneNumber =
                    await askPhoneNumber()
            }

            if (
                !phoneNumber ||
                phoneNumber.length < 8
            ) {
                console.log("")
                console.log(
                    "❌ Invalid WhatsApp number."
                )

                process.exit(1)
            }

            await delay(3000)

            if (!pairingStarted) {

                pairingStarted = true

                try {
                    console.log("")
                    console.log(
                        "⏳ Requesting WhatsApp pairing code..."
                    )
                    console.log("")

                    const code =
                        await sock.requestPairingCode(
                            phoneNumber
                        )

                    console.log("")
                    console.log(
                        "╔══════════════════════════════════╗"
                    )

                    console.log(
                        "║       🔐 BUG-BOT PAIRING        ║"
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

                    console.log("")
                    console.log(
                        "📱 WhatsApp → Settings"
                    )

                    console.log(
                        "→ Linked Devices"
                    )

                    console.log(
                        "→ Link a Device"
                    )

                    console.log(
                        "→ Link with phone number instead"
                    )

                    console.log("")
                    console.log(
                        "⚠️ Do not share this code."
                    )
                    console.log("")

                } catch (error) {

                    console.error(
                        "❌ Pairing Code Error:",
                        error.message
                    )

                    pairingStarted = false
                }
            }
        }

        // =================================
        // CONNECTION UPDATE
        // =================================

        sock.ev.on(
            "connection.update",
            update => {

                const {
                    connection,
                    lastDisconnect
                } = update

                if (
                    connection === "connecting"
                ) {
                    console.log(
                        "🔄 Connecting to WhatsApp..."
                    )
                }

                // =================================
                // CONNECTED
                // =================================

                if (
                    connection === "open"
                ) {
                    reconnecting = false
                    pairingStarted = false

                    console.log("")

                    console.log(
                        "╔══════════════════════════════╗"
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
                        "║ Number  : " +
                        phoneNumber
                    )

                    console.log(
                        "║ Prefix  : " +
                        global.prefix
                    )

                    console.log(
                        "╚══════════════════════════════╝"
                    )

                    console.log("")
                }

                // =================================
                // CLOSED
                // =================================

                if (
                    connection === "close"
                ) {

                    const statusCode =
                        lastDisconnect
                            ?.error
                            ?.output
                            ?.statusCode

                    const reason =
                        lastDisconnect
                            ?.error
                            ?.message ||
                        "Unknown error"

                    console.log("")

                    console.log(
                        "❌ WhatsApp connection closed."
                    )

                    console.log(
                        "Reason:",
                        reason
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
                            "🔄 Reconnecting in 5 seconds..."
                        )

                        setTimeout(
                            () => {
                                reconnecting = false
                                pairingStarted = false
                                connectBot()
                            },
                            5000
                        )

                    } else {

                        console.log(
                            "⚠️ WhatsApp session logged out."
                        )
                    }
                }
            }
        )

        return sock

    } catch (error) {

        console.error(
            "❌ Connection Error:",
            error.message
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
