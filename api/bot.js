const { Telegraf } = require('telegraf');
const axios = require('axios');

const botToken = process.env.BOT_TOKEN;
if (!botToken) {
    throw new Error('BOT_TOKEN is not set');
}

const bot = new Telegraf(botToken);

bot.start((ctx) => {
    return ctx.reply('Halo! bos izams Kirimkan link video TikTok, dan saya akan mengirimkan video HD tanpa watermark untukmu.');
});

bot.on('text', async (ctx) => {
    const text = ctx.message.text;

    if (text.includes('tiktok.com') || text.includes('vt.tiktok.com')) {
        await ctx.reply('🔄 Sedang memproses video HD, mohon tunggu sebentar...');

        try {
            const response = await axios.post('https://www.tikwm.com/api/', {}, {
                params: {
                    url: text,
                    hd: 1
                }
            });

            const apiData = response.data.data;

            if (apiData) {
                // Mengambil kualitas tertinggi (HD) terlebih dahulu
                const videoUrl = apiData.hdplay || apiData.play;

                return ctx.replyWithVideo(
                    { url: videoUrl },
                    { caption: '✅ Berhasil! Video TikTok Kualitas HD.' }
                );
            } else {
                return ctx.reply('❌ Gagal mengambil data video. Pastikan link-nya benar.');
            }
        } catch (error) {
            return ctx.reply('❌ Terjadi kesalahan saat memproses permintaan.');
        }
    } else {
        return ctx.reply('Silakan kirimkan link TikTok (contoh: https://vt.tiktok.com/...)');
    }
});

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try {
            await bot.handleUpdate(req.body, res);
            return res.status(200).send('OK');
        } catch (err) {
            console.error('Error handling update:', err);
            return res.status(500).send('Internal Server Error');
        }
    } else {
        return res.status(200).send('Bot is running!');
    }
};
