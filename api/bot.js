const { Telegraf } = require('telegraf');
const axios = require('axios');

const botToken = process.env.BOT_TOKEN;
if (!botToken) {
    throw new Error('BOT_TOKEN is not set');
}

const bot = new Telegraf(botToken);

bot.start((ctx) => {
    return ctx.reply('Halo! Bos Izams.Silakan Kirim Link Video Tiktok');
});

bot.on('text', async (ctx) => {
    const text = ctx.message.text;

    if (text.includes('tiktok.com') || text.includes('vt.tiktok.com')) {
        await ctx.reply('🔄 Sedang memproses video, mohon tunggu sebentar bos izams...');

        try {
            const response = await axios.post('https://www.tikwm.com/api/', {}, {
                params: {
                    url: text,
                    hd: 1
                }
            });

            const data = response.data.data;

            if (data && data.play) {
                const videoUrl = data.play;
                return ctx.replyWithVideo(
                    { url: videoUrl },
                    { caption: '✅ Berhasil! Video TikTok tanpa watermark.' }
                );
            } else {
                return ctx.reply('❌ Gagal mengunduh video. Pastikan link yang Anda masukkan benar.');
            }
        } catch (error) {
            return ctx.reply('❌ Terjadi kesalahan saat memproses permintaan Anda.');
        }
    } else {
        return ctx.reply('Silakan kirimkan link TikTok (contoh: https://vt.tiktok.com/...)');
    }
});

// Handler untuk Vercel Serverless Function
module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try {
            await bot.handleUpdate(req.body, res);
        } catch (err) {
            console.error('Error handling update:', err);
            return res.status(500).send('Internal Server Error');
        }
    } else {
        return res.status(200).send('Bot is running!');
    }
};
