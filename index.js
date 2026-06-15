const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const prefix = ".";
const claimedTickets = new Map();

// =========================
// LOGIN
// =========================
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);

// =========================
// PANEL COMMANDS
// =========================
client.on("messageCreate", async (message) => {
  if (!message.guild || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift()?.toLowerCase();

  const owner = claimedTickets.get(message.channel.id);
  const isOwner = owner === message.author.id;

  // -------------------------
  // 🛒 BUY PANEL
  // -------------------------
  if (cmd === "buy") {
    const embed = new EmbedBuilder()
      .setTitle("🛒 BUY TICKETS")
      .setDescription("Click below to create a BUY ticket.")
      .setColor(0x00ff99);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("buy_ticket")
        .setLabel("Request Buy Ticket")
        .setStyle(ButtonStyle.Success)
    );

    return message.channel.send({ embeds: [embed], components: [row] });
  }

  // -------------------------
  // 💰 SELL PANEL
  // -------------------------
  if (cmd === "sell") {
    const embed = new EmbedBuilder()
      .setTitle("💰 SELL TICKETS")
      .setDescription("Click below to create a SELL ticket.")
      .setColor(0xff9900);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("sell_ticket")
        .setLabel("Request Sell Ticket")
        .setStyle(ButtonStyle.Primary)
    );

    return message.channel.send({ embeds: [embed], components: [row] });
  }

  // -------------------------
  // 🎫 SUPPORT PANEL
  // -------------------------
  if (cmd === "support") {
    const embed = new EmbedBuilder()
      .setTitle("🎫 SUPPORT TICKETS")
      .setDescription("Click below to create a SUPPORT ticket.")
      .setColor(0x5865f2);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("support_ticket")
        .setLabel("Request Support Ticket")
        .setStyle(ButtonStyle.Secondary)
    );

    return message.channel.send({ embeds: [embed], components: [row] });
  }

  // -------------------------
  // CLAIM
  // -------------------------
  if (cmd === "claim") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
      return message.reply("❌ No permission.");

    if (claimedTickets.has(message.channel.id))
      return message.reply("❌ Already claimed.");

    claimedTickets.set(message.channel.id, message.author.id);

    return message.channel.send("🎫 Ticket claimed.");
  }

  // -------------------------
  // CLOSE
  // -------------------------
  if (cmd === "close") {
    const staff = message.member.permissions.has(PermissionsBitField.Flags.ManageChannels);

    if (!staff && !isOwner)
      return message.reply("❌ Not allowed.");

    await message.channel.send("🔒 Closing ticket...");

    setTimeout(() => {
      claimedTickets.delete(message.channel.id);
      message.channel.delete().catch(() => {});
    }, 4000);
  }
});

// =========================
// BUTTON SYSTEM (FIXED CATEGORIES)
// =========================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  const guild = interaction.guild;
  const user = interaction.user;

  let categoryId = "";
  let type = "";
  let color = 0x2b2d31;
  let prefixName = "";

  // 🛒 BUY → CATEGORY
  if (interaction.customId === "buy_ticket") {
    categoryId = "1515888821936324738";
    type = "BUY";
    color = 0x00ff99;
    prefixName = "buy";
  }

  // 💰 SELL → CATEGORY
  if (interaction.customId === "sell_ticket") {
    categoryId = "1515888774154817699";
    type = "SELL";
    color = 0xff9900;
    prefixName = "sell";
  }

  // 🎫 SUPPORT → CATEGORY
  if (interaction.customId === "support_ticket") {
    categoryId = "1515901968030367915";
    type = "SUPPORT";
    color = 0x5865f2;
    prefixName = "support";
  }

  const channel = await guild.channels.create({
    name: `${prefixName}-${user.username}`,
    type: ChannelType.GuildText,
    parent: categoryId,
    permissionOverwrites: [
      {
        id: guild.id,
        deny: [PermissionsBitField.Flags.ViewChannel]
      },
      {
        id: user.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory
        ]
      }
    ]
  });

  const embed = new EmbedBuilder()
    .setTitle(`🎟️ ${type} TICKET OPENED`)
    .setDescription(
      `Welcome <@${user.id}>\n\n` +
      `Commands:\n` +
      `• .claim → claim ticket\n` +
      `• .close → close ticket\n\n` +
      `Explain your request clearly.`
    )
    .setColor(color);

  channel.send({ embeds: [embed] });

  return interaction.reply({
    content: `✅ Ticket created: ${channel}`,
    ephemeral: true
  });
});
