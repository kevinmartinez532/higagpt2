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

const GHOSTPING_CHANNEL_ID = "1516211030538322043";

const RANDOM_MEMBER_ROLE_ID = "1506425155189084250";
const RANDOM_VOUCH_ROLE_ID = "1506430627501703249";

const BUY_CATEGORY_ID = "1515888821936324738";
const SELL_CATEGORY_ID = "1515888774154817699";
const SUPPORT_CATEGORY_ID = "1515901968030367915";
// =======================
// SYSTEM DATA
// =======================

const claimedTickets = new Map();
const ticketOwners = new Map();
const vouchCount = new Map();

const vouchReasons = [
  "bought racoon from him trusted ty",
  "sold racoon hes trusted i got my money",
  "sold dragonfly W mans",
  "bought unicorn W hes so trusted",
  "bought dragonfly omg hes so trusted",
  "sold my unicorn for robux HOLY"
];

// =======================
// READY
// =======================

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});
setInterval(async () => {

  const guild = client.guilds.cache.first();
  if (!guild) return;

  const memberRole = guild.roles.cache.get(RANDOM_MEMBER_ROLE_ID);
  const vouchRole = guild.roles.cache.get(RANDOM_VOUCH_ROLE_ID);

  if (!memberRole || !vouchRole) return;

  const members = memberRole.members.map(m => m);
  const vouchTargets = vouchRole.members.map(m => m);

  if (!members.length || !vouchTargets.length) return;

  const randomMember =
    members[Math.floor(Math.random() * members.length)];

  const randomTarget =
    vouchTargets[Math.floor(Math.random() * vouchTargets.length)];

  const vouchChannel = guild.channels.cache.get(VOUCH_CHANNEL_ID);
  if (!vouchChannel) return;

  const current = vouchCount.get(randomTarget.id) || 0;
  vouchCount.set(randomTarget.id, current + 1);

  const randomReason =
    vouchReasons[Math.floor(Math.random() * vouchReasons.length)];

  const embed = new EmbedBuilder()
    .setColor("#57F287")
    .setTitle("⭐ New Vouch")
    .addFields(
      {
        name: "Vouched For",
        value: `${randomTarget}`
      },
      {
        name: "Vouched By",
        value: `${randomMember}`
      },
      {
        name: "Reason",
        value: randomReason
      },
      {
        name: "Total Vouches",
        value: `${current + 1}`
      }
    )
    .setFooter({ text: "Powered by GAG2 Helper Bot" })
    .setTimestamp();

  vouchChannel.send({ embeds: [embed] });

}, 20 * 60 * 1000);
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
      `👋 ${member} joined the server!\n\n` +
      `👤 Username: ${member.user.username}\n` +
      `🆔 User ID: ${member.id}\n` +
      `📅 Account Created: ${created}\n` +
      `📈 Member Count: #${member.guild.memberCount}`
    )
    .setTimestamp();

  channel.send({ embeds: [embed] });

const ghostChannel = member.guild.channels.cache.get(GHOSTPING_CHANNEL_ID);

if (ghostChannel) {
  ghostChannel.send(`${member}`).then(msg => {
    setTimeout(() => {
      msg.delete().catch(() => {});
    }, 1000);
  });
}
});

// =======================
// PANELS
// =======================

client.on("messageCreate", async (message) => {

  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const cmd = message.content.slice(prefix.length).toLowerCase();

  if (cmd === "buy") {

    const embed = new EmbedBuilder()
      .setColor("#57F287")
      .setTitle("🛒 Buy Tickets")
      .setDescription("Click below to create a BUY ticket.");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("buy_ticket")
        .setLabel("Request Buy Ticket")
        .setStyle(ButtonStyle.Success)
    );

    return message.channel.send({ embeds: [embed], components: [row] });
  }

  if (cmd === "sell") {

    const embed = new EmbedBuilder()
      .setColor("#FAA61A")
      .setTitle("💰 Sell Tickets")
      .setDescription("Click below to create a SELL ticket.");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("sell_ticket")
        .setLabel("Request Sell Ticket")
        .setStyle(ButtonStyle.Primary)
    );

    return message.channel.send({ embeds: [embed], components: [row] });
  }

  if (cmd === "support") {

    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle("🎫 Support Tickets")
      .setDescription("Click below to create SUPPORT ticket.");

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

    return message.channel.send("🎫 Ticket claimed.");
  }

  // CLOSE
  if (cmd === "close") {

    const ownerId = ticketOwners.get(message.channel.id);
    const isStaff = message.member.roles.cache.has(STAFF_ROLE_ID);

    if (!isStaff && ownerId !== message.author.id) return;

    await message.channel.send("🔒 Closing ticket...");

    // increase vouch count
    if (ownerId) {
      const current = vouchCount.get(ownerId) || 0;
      vouchCount.set(ownerId, current + 1);
    }

    const randomReason =
      vouchReasons[Math.floor(Math.random() * vouchReasons.length)];

    const total = vouchCount.get(ownerId) || 1;

    const vouchEmbed = new EmbedBuilder()
      .setColor("#57F287")
      .setTitle("⭐ New Vouch")
      .addFields(
        {
          name: "Vouched For",
          value: `<@${ownerId}>`
        },
        {
          name: "Vouched By",
          value: `${message.author}`
        },
        {
          name: "Reason",
          value: randomReason
        },
        {
          name: "Total Vouches",
          value: `${total}`
        }
      )
      .setFooter({ text: "Powered by GAG2 Helper Bot" })
      .setTimestamp();

    const vouchChannel = message.guild.channels.cache.get(VOUCH_CHANNEL_ID);

    if (vouchChannel) {
      vouchChannel.send({ embeds: [vouchEmbed] });
    }

    setTimeout(async () => {
      ticketOwners.delete(message.channel.id);
      claimedTickets.delete(message.channel.id);
      await message.channel.delete().catch(() => {});
    }, 5000);
  }
});

// =======================
// TICKETS
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

  ticketOwners.set(channel.id, interaction.user.id);

  let desc = "";

  if (type === "BUY") desc = "🛒 Provide what you're buying + budget + payment method.";
  if (type === "SELL") desc = "💰 Provide what you're selling + price + proof.";
  if (type === "SUPPORT") desc = "🎫 Explain your issue clearly.";

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
