// Prints the chats that wrote to the bot, so you can copy TELEGRAM_CHAT_ID.
// Send /start to the bot (or add it to a group and post a message) first.
// Usage: TELEGRAM_BOT_TOKEN=123:abc node scripts/telegram-chat-id.mjs
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('Set TELEGRAM_BOT_TOKEN');
  process.exit(1);
}

const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
const body = await response.json();
if (!body.ok) {
  console.error(`Telegram error: ${body.description}`);
  process.exit(1);
}

const chats = new Map();
for (const update of body.result) {
  const chat = (update.message ?? update.my_chat_member ?? update.channel_post)?.chat;
  if (chat) chats.set(chat.id, chat.title ?? chat.username ?? chat.first_name ?? chat.type);
}

if (chats.size === 0) {
  console.log('No messages yet. Send /start to the bot and run this again.');
} else {
  for (const [id, name] of chats) console.log(`${id}\t${name}`);
}
