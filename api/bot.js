const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');

const botToken = process.env.BOT_TOKEN;
if (!botToken) {
    throw new Error('BOT_TOKEN is not set');
}

const bot = new Telegraf(botToken);

// Penyimpanan sementara untuk URL link (sementara di memori selama proses berlangsung)
const pendingLinks = new Map();

bot.start((ctx) => {
    return ctx.reply('Halo! Kirimkan link video TikTok bos izams. dan saya akan mendownloadnya.');
});

// Menangani saat pengguna mengirimkan teks/link TikTok
bot.on('text', async (ctx) => {
    const text = ctx.message.text;

    if (text.includes('tiktok.com') || text.includes('vt.tiktok.com')) {
        // Simpan link dengan ID pesan sebagai kuncinya
        pendingLinks.set(ctx.message.message_id, text);

        // Tampilkan tombol pilihan kualitas
        return ctx.reply(
            '🔄 Silakan pilih kualitas video yang ingin diunduh:',
            Markup.inlineKeyboard([
                [Markup.button.callback('Kualitas HD', `hd_${ctx.message.message_id}`)],
                [Markup.button.callback('Kualitas Standar', `sd_${ctx.message.message_id}`)]
            ])
        );
    } else {
        return ctx.reply('Silakan kirimkan link TikTok (contoh: https://vt.tiktok.com/...)');
    }
});

// Menangani tombol yang ditekan oleh pengguna
bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery.data; // Contoh: "hd_12345" atau "sd_12345"
    const [quality, messageId] = data.split('_');

    // Ambil link dari memori
    const text = pendingLinks.get(parseInt(messageId));

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
            // Tentukan URL berdasarkan tombol yang ditekan
            const videoUrl = (quality === 'hd') ? (apiData.hdplay || apiData.play) : apiData.play;
            const qualityName = (quality === 'hd') ? 'HD' : 'Standar';

            // Hapus keyboard pilihan setelah diproses
            await ctx.editMessageReplyMarkup({});

            await ctx.replyWithVideo(
                { url: videoUrl },
                { caption: `✅ Berhasil! Video TikTok Kualitas ${qualityName}.` }
            );

            // Bersihkan memori agar tidak penuh
            pendingLinks.delete(parseInt(messageId));
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
