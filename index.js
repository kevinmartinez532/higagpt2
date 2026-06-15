const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  ChannelType
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ]
});

const prefix = ".";

// =======================
// IDS
// =======================

const WELCOME_CHANNEL_ID = "1515902507807936722";
const VOUCH_CHANNEL_ID = "1515887426860744807";

const STAFF_ROLE_ID = "1506430627501703249";

const BUY_CATEGORY_ID = "1515888821936324738";
const SELL_CATEGORY_ID = "1515888774154817699";
const SUPPORT_CATEGORY_ID = "1515901968030367915";

// =======================
// DATA
// =======================

const claimedTickets = new Map();

// =======================
// READY
// =======================

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);

// =======================
// WELCOME SYSTEM
// =======================

client.on("guildMemberAdd", async (member) => {

  const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
  if (!channel) return;

  const created = `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`;

  const embed = new EmbedBuilder()
    .setColor("#7BC96F")
    .setTitle("🌿 Welcome!")
    .setDescription(
      `👋 ${member} has joined **GAG 2 Trading & Middleman Server!**\n\n` +
      `👤 **Username:** ${member.user.username}\n` +
      `🆔 **User ID:** ${member.id}\n` +
      `📅 **Account Created:** ${created}\n` +
      `📈 **Member Count:** #${member.guild.memberCount}`
    )
    .setFooter({ text: `Member #${member.guild.memberCount}` })
    .setTimestamp();

  channel.send({ embeds: [embed] });
});

// =======================
// PANELS
// =======================

client.on("messageCreate", async (message) => {

  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const cmd = message.content.slice(prefix.length).toLowerCase();

  // BUY PANEL
  if (cmd === "buy") {

    const embed = new EmbedBuilder()
      .setColor("#57F287")
      .setTitle("🛒 Buy Tickets")
      .setDescription("Click below to request a BUY ticket.");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("buy_ticket")
        .setLabel("Request Buy Ticket")
        .setStyle(ButtonStyle.Success)
    );

    return message.channel.send({ embeds: [embed], components: [row] });
  }

  // SELL PANEL
  if (cmd === "sell") {

    const embed = new EmbedBuilder()
      .setColor("#FAA61A")
      .setTitle("💰 Sell Tickets")
      .setDescription("Click below to request a SELL ticket.");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("sell_ticket")
        .setLabel("Request Sell Ticket")
        .setStyle(ButtonStyle.Primary)
    );

    return message.channel.send({ embeds: [embed], components: [row] });
  }

  // SUPPORT PANEL
  if (cmd === "support") {

    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle("🎫 Support Tickets")
      .setDescription("Click below to request SUPPORT.");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("support_ticket")
        .setLabel("Request Support Ticket")
        .setStyle(ButtonStyle.Secondary)
    );

    return message.channel.send({ embeds: [embed], components: [row] });
  }

  // CLAIM
  if (cmd === "claim") {

    if (!message.member.roles.cache.has(STAFF_ROLE_ID)) return;

    if (claimedTickets.has(message.channel.id))
      return message.reply("❌ Already claimed.");

    claimedTickets.set(message.channel.id, message.author.id);

    return message.channel.send(
      "🎫 Ticket claimed by " + message.member
    );
  }

  // CLOSE
  if (cmd === "close") {

    const claimer = claimedTickets.get(message.channel.id);
    const isStaff = message.member.roles.cache.has(STAFF_ROLE_ID);

    if (claimer !== message.author.id && !isStaff) return;

    await message.channel.send("🔒 Closing ticket...");

    // VOUCH SYSTEM
    const vouchEmbed = new EmbedBuilder()
      .setColor("#57F287")
      .setTitle("⭐ Trade Completed")
      .setDescription(
        `👤 User: <@${claimer || "Unknown"}>\n` +
        `🧑‍💼 Closed by: ${message.author}\n` +
        `📦 Channel: ${message.channel.name}\n\n` +
        `Please leave honest feedback.`
      )
      .setTimestamp();

    const vouchChannel = message.guild.channels.cache.get(VOUCH_CHANNEL_ID);

    if (vouchChannel) {
      vouchChannel.send({ embeds: [vouchEmbed] });
    }

    setTimeout(async () => {
      claimedTickets.delete(message.channel.id);
      await message.channel.delete().catch(() => {});
    }, 5000);
  }
});

// =======================
// TICKET CREATION
// =======================

client.on("interactionCreate", async (interaction) => {

  if (!interaction.isButton()) return;

  let categoryId;
  let type;
  let color;
  let name;

  if (interaction.customId === "buy_ticket") {
    categoryId = BUY_CATEGORY_ID;
    type = "BUY";
    color = "#57F287";
    name = "buy";
  }

  if (interaction.customId === "sell_ticket") {
    categoryId = SELL_CATEGORY_ID;
    type = "SELL";
    color = "#FAA61A";
    name = "sell";
  }

  if (interaction.customId === "support_ticket") {
    categoryId = SUPPORT_CATEGORY_ID;
    type = "SUPPORT";
    color = "#5865F2";
    name = "support";
  }

  const channel = await interaction.guild.channels.create({
    name: `${name}-${interaction.user.username}`,
    type: ChannelType.GuildText,
    parent: categoryId,
    permissionOverwrites: [
      {
        id: interaction.guild.id,
        deny: [PermissionsBitField.Flags.ViewChannel]
      },
      {
        id: interaction.user.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory
        ]
      },
      {
        id: STAFF_ROLE_ID,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory
        ]
      }
    ]
  });

  let desc = "";

  if (type === "BUY") {
    desc =
      "🛒 Please provide what you are buying, budget, and payment method.";
  }

  if (type === "SELL") {
    desc =
      "💰 Please provide what you are selling, price, and proof if needed.";
  }

  if (type === "SUPPORT") {
    desc =
      "🎫 Please describe your issue clearly.";
  }

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`🎟️ ${type} Ticket`)
    .setDescription(desc);

  channel.send({
    content: `${interaction.user} <@&${STAFF_ROLE_ID}>`,
    embeds: [embed]
  });

  interaction.reply({
    content: `✅ Ticket created: ${channel}`,
    ephemeral: true
  });
});
