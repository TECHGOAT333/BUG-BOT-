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
            const command = require(
                path.join(commandsPath, file)
            )

            if (
                command.name &&
                typeof command.execute === "function"
            ) {
                commands.set(
                    command.name.toLowerCase(),
                    command
                )

                console.log(
                    `✅ Loaded command: ${command.name}`
                )
            }
        } catch (error) {
            console.error(
                `❌ Failed to load ${file}:`,
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
            logger: P({
                level: "silent"
            }),
            browser: [
                "BUG-BOT",
                "Chrome",
                "1.0.0"
            ],
            generateHighQualityLinkPreview: false
        })

        sock.ev.on(
            "creds.update",
            saveCreds
        )

        let pairingRequested = false

        // ===============================
        // CONNECTION
        // ===============================

        sock.ev.on(
            "connection.update",
            async update => {
                const {
                    connection,
                    lastDisconnect
                } = update

                // ===============================
                // REQUEST PAIRING CODE
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
                            "❌ Invalid owner number in settings.js"
                        )
                        return
                    }

                    try {
                        console.log(
                            "\n📱 Requesting WhatsApp pairing code...\n"
                        )

                        const code =
                            await sock.requestPairingCode(
                                phoneNumber
                            )

                        console.log(`
╔══════════════════════════════════╗
║        🤖 BUG-BOT PAIRING        ║
╠══════════════════════════════════╣
║                                  ║
║      🔐 CODE: ${code}
║                                  ║
║ WhatsApp → Settings              ║
║ → Linked Devices                 ║
║ → Link a Device                  ║
║ → Link with phone number         ║
║                                  ║
╚══════════════════════════════════╝
`)
                    } catch (error) {
                        console.error(
                            "❌ Pairing Code Error
