module.exports = {
    name: "ping",
    description: "Check bot response",

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid

        await sock.sendMessage(jid, {
            text: "🏓 *PONG!*\n\n🤖 BUG-BOT is online."
        })
    }
}
