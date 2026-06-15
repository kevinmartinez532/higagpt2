const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// ticket owner storage
const claimedTickets = new Map(); // channelId -> userId

const prefix = ".";

client.on("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// =========================
// COMMAND SYSTEM
// =========================
client.on("messageCreate", async (message) => {
  if (!message.guild || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift()?.toLowerCase();

  // helper: ticket owner
  const owner = claimedTickets.get(message.channel.id);
  const isOwner = owner === message.author.id;

  // =========================
  // 🎫 CLAIM TICKET
  // =========================
  if (cmd === "claim") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return message.reply("❌ No permission.");
    }

    if (claimedTickets.has(message.channel.id)) {
      return message.reply("❌ Ticket already claimed.");
    }

    claimedTickets.set(message.channel.id, message.author.id);

    const embed = new EmbedBuilder()
      .setTitle("🎫 Ticket Claimed")
      .setDescription(`Claimed by <@${message.author.id}>`)
      .setColor(0x00ff99);

    return message.channel.send({ embeds: [embed] });
  }

  // =========================
  // 🚫 BAN USER
  // =========================
  if (cmd === "ban") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return message.reply("❌ No permission.");
    }

    const user = message.mentions.members.first();
    if (!user) return message.reply("❌ Mention a user.");

    try {
      await user.ban();

      const embed = new EmbedBuilder()
        .setTitle("🚫 User Banned")
        .setDescription(`${user.user.tag} was banned.`)
        .setColor(0xff0000);

      return message.channel.send({ embeds: [embed] });
    } catch {
      return message.reply("❌ Failed to ban user.");
    }
  }

  // =========================
  // 🔒 CLOSE TICKET
  // =========================
  if (cmd === "close") {
    const isStaff = message.member.permissions.has(PermissionsBitField.Flags.ManageChannels);

    if (!isStaff && !isOwner) {
      return message.reply("❌ Only staff or ticket claimer can close this.");
    }

    const embed = new EmbedBuilder()
      .setTitle("🔒 Closing Ticket")
      .setDescription("Ticket will delete in 5 seconds...")
      .setColor(0xffcc00);

    await message.channel.send({ embeds: [embed] });

    setTimeout(() => {
      claimedTickets.delete(message.channel.id);
      message.channel.delete().catch(() => {});
    }, 5000);
  }

  // =========================
  // 🎟️ TICKET PANEL
  // =========================
  if (message.content === ".ticketpanel") {
    const embed = new EmbedBuilder()
      .setTitle("🎟️ Support Tickets")
      .setDescription(
        `Create a ticket for help.\n\n` +
        `⚡ Rules:\n` +
        `• No spam\n` +
        `• Be respectful\n` +
        `• Wait for staff`
      )
      .setColor(0x2b2d31);

    message.channel.send({ embeds: [embed] });
  }

  // =========================
  // 🎫 INSIDE TICKET INFO
  // =========================
  if (cmd === "ticketinfo") {
    const embed = new EmbedBuilder()
      .setTitle("🎫 Ticket Commands")
      .setDescription(
        `Commands:\n` +
        `• .claim → claim this ticket\n` +
        `• .close → close ticket\n` +
        `• .ban @user → staff only`
      )
      .setColor(0x5865f2);

    message.channel.send({ embeds: [embed] });
  }
});

// =========================
// LOGIN (RAILWAY SAFE)
// =========================
client.login(process.env.TOKEN);
