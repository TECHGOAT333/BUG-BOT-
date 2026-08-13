module.exports = {
    name: "alive",
    description: "Check bot status",

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid

        await sock.sendMessage(jid, {
            text:
`╭━━━〔 🤖 BUG-BOT 〕━━━╮
┃
┃ 🟢 Status: Online
┃ ⚡ Version: ${global.botVersion}
┃ 👑 Owner: ${global.ownerName}
┃
╰━━━━━━━━━━━━━━━━━━━━╯`
        })
    }
}
