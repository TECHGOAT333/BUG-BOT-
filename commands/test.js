module.exports = {
    name: "test",
    description: "Run a safe bot test",

    async execute(sock, msg) {
        const jid = msg.key.remoteJid

        const start = Date.now()

        await sock.sendMessage(jid, {
            text: "🧪 Test la ap fèt..."
        })

        const ms = Date.now() - start

        await sock.sendMessage(jid, {
            text:
`✅ *TEST COMPLETED*

🤖 Bot: ${global.botName}
⚡ Response: ${ms}ms
🟢 Status: Working`
        })
    }
}
