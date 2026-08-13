module.exports = {
    name: "menu",
    description: "Show bot commands",

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid

        await sock.sendMessage(jid, {
            text:
`╭━━━〔 🤖 BUG-BOT 〕━━━╮
┃
┃ 📋 COMMANDS
┃
┃ ${global.prefix}menu
┃ ${global.prefix}ping
┃ ${global.prefix}alive
┃ ${global.prefix}test
┃ ${global.prefix}stress
┃ ${global.prefix}stop
┃ ${global.prefix}status
┃
╰━━━━━━━━━━━━━━━━━━━━╯`
        })
    }
}
