module.exports = {
    name: "status",
    description: "Show bot status",

    async execute(sock, msg) {
        const jid = msg.key.remoteJid

        const uptime = process.uptime()

        const hours = Math.floor(uptime / 3600)
        const minutes = Math.floor(
            (uptime % 3600) / 60
        )
        const seconds = Math.floor(uptime % 60)

        await sock.sendMessage(jid, {
            text:
`╭━━━〔 📊 STATUS 〕━━━╮
┃
┃ 🤖 Bot: ${global.botName}
┃ 🟢 Status: Online
┃ ⏱️ Uptime: ${hours}h ${minutes}m ${seconds}s
┃ ⚡ Node: ${process.version}
┃
╰━━━━━━━━━━━━━━━━━━━━╯`
        })
    }
}
