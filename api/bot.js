const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');

const botToken = process.env.BOT_TOKEN;
if (!botToken) {
    throw new Error('BOT_TOKEN is not set');
}

const bot = new Telegraf(botToken);

bot.start((ctx) => {
    return ctx.reply('Halo!bos izams Kirimkan link video TikTok, dan saya akan mengirimkan video tanpa watermark untukmu.');
});

// Menangani saat pengguna mengirimkan teks/link TikTok
bot.on('text', async (ctx) => {
    const text = ctx.message.text;

    if (text.includes('tiktok.com') || text.includes('vt.tiktok.com')) {
        const hiddenLink = text;
        // Menyimpan URL di dalam entity tak terlihat menggunakan zero-width space
        const displayMessage = `🔄 Silakan pilih kualitas video yang ingin diunduh:\n\n<a href="${hiddenLink}">&#8203;</a>`;

        return ctx.reply(
            displayMessage,
            {
                parse_mode: 'HTML',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('Kualitas HD', 'hd')],
                    [Markup.button.callback('Kualitas Standar', 'sd')]
                ])
            }
        );
    } else {
        return ctx.reply('Silakan kirimkan link TikTok (contoh: https://vt.tiktok.com/...)');
    }
});

// Menangani tombol yang ditekan oleh pengguna
bot.on('callback_query', async (ctx) => {
    const quality = ctx.callbackQuery.data; // 'hd' atau 'sd'
    const message = ctx.callbackQuery.message;

    // Mengambil URL dari dalam link tersembunyi
    let text = '';
    if (message && message.entities) {
        for (const entity of message.entities) {
            if (entity.type === 'text_link') {
                text = entity.url;
            }
        }
    }

    if (!text) {
        return ctx.answerCbQuery('Pesan telah kedaluwarsa. Silakan kirim ulang link-nya.');
    }

    await ctx.answerCbQuery('Sedang memproses video...');

    try {
        const response = await axios.post('https://www.tikwm.com/api/', {}, {
            params: {
                url: text,
                hd: 1
            }
        });

        const apiData = response.data.data;

        if (apiData) {
            const videoUrl = (quality === 'hd') ? (apiData.hdplay || apiData.play) : apiData.play;
            const qualityName = (quality === 'hd') ? 'HD' : 'Standar';

            // Hapus keyboard pilihan setelah diproses
            await ctx.editMessageReplyMarkup({});

            await ctx.replyWithVideo(
                { url: videoUrl },
                { caption: `✅ Berhasil! Video TikTok Kualitas ${qualityName}.` }
            );
        } else {
            await ctx.reply('❌ Gagal mengambil data video. Pastikan link-nya benar.');
        }
    } catch (error) {
        await ctx.reply('❌ Terjadi kesalahan saat memproses permintaan.');
    }
});

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
