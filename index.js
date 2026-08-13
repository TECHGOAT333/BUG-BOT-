require("./settings")

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys")

const P = require("pino")
const qrcode = require("qrcode-terminal")

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("./auth")

    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        auth: state,
        logger: P({ level: "silent" }),
        printQRInTerminal: false,
        browser: ["BUG-BOT", "Chrome", "3.0.0"]
    })

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update

        if (qr) {
            console.log("\n📱 Scan QR Code la ak WhatsApp ou:\n")
            qrcode.generate(qr, { small: true })
        }

        if (connection === "open") {
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

        if (connection === "close") {
            const statusCode =
                lastDisconnect?.error?.output?.statusCode

            const shouldReconnect =
                statusCode !== DisconnectReason.loggedOut

            console.log("❌ Connection closed.")

            if (shouldReconnect) {
                console.log("🔄 Reconnecting...")
                startBot()
            } else {
                console.log("⚠️ WhatsApp session logged out.")
            }
        }
    })

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0]

        if (!msg || !msg.message) return
        if (msg.key.fromMe) return

        const jid = msg.key.remoteJid

        const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            ""

        if (!text.startsWith(global.prefix)) return

        const args = text
            .slice(global.prefix.length)
            .trim()
            .split(/\s+/)

        const command = args.shift()?.toLowerCase()

        if (command === "ping") {
            await sock.sendMessage(jid, {
                text: "🏓 BUG-BOT: Pong!"
            })
        }

        if (command === "alive") {
            await sock.sendMessage(jid, {
                text:
`🤖 *${global.botName}*

Status: Online 🟢
Version: ${global.botVersion}
Prefix: ${global.prefix}`
            })
        }

        if (command === "menu") {
            await sock.sendMessage(jid, {
                text:
`╭━━━〔 🤖 BUG-BOT 〕━━━╮
┃
┃ 🏓 ${global.prefix}ping
┃ 🤖 ${global.prefix}alive
┃ 📋 ${global.prefix}menu
┃
╰━━━━━━━━━━━━━━━━━━━━╯`
            })
        }
    })
}

startBot().catch((error) => {
    console.error("❌ Bot Error:", error)
})
