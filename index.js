const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  ChannelType,
  SlashCommandBuilder
} = require("discord.js");
const WELCOME_CHANNEL_ID = "1515902507807936722";
const VOUCH_CHANNEL_ID = "1515887426860744807";

const STAFF_ROLE_ID = "1506430627501703249";

const BUY_CATEGORY_ID = "1515888821936324738";
const SELL_CATEGORY_ID = "1515888774154817699";
const SUPPORT_CATEGORY_ID = "1515901968030367915";

const LOG_CHANNEL_ID = "PUT_LOG_CHANNEL_ID_HERE";
const claimedTickets = new Map();
const ticketOwners = new Map();
const vouchCount = new Map();
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});
client.login(process.env.TOKEN);
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

  channel.send({
    embeds: [embed]
  });

});
// =======================
// PANEL COMMANDS
// =======================

client.on("messageCreate", async (message) => {

  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const cmd = message.content.slice(prefix.length).toLowerCase();

  // =======================
  // BUY PANEL
  // =======================

  if (cmd === "buy") {

    const embed = new EmbedBuilder()
      .setColor("#57F287")
      .setTitle("🛒 Buy Tickets")
      .setDescription(
        "Click the button below to create a private buy ticket."
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("buy_ticket")
        .setLabel("Request Buy Ticket")
        .setStyle(ButtonStyle.Success)
    );

    return message.channel.send({
      embeds: [embed],
      components: [row]
    });
  }

  // =======================
  // SELL PANEL
  // =======================

  if (cmd === "sell") {

    const embed = new EmbedBuilder()
      .setColor("#FAA61A")
      .setTitle("💰 Sell Tickets")
      .setDescription(
        "Click the button below to create a private sell ticket."
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("sell_ticket")
        .setLabel("Request Sell Ticket")
        .setStyle(ButtonStyle.Primary)
    );

    return message.channel.send({
      embeds: [embed],
      components: [row]
    });
  }

  // =======================
  // SUPPORT PANEL
  // =======================

  if (cmd === "support") {

    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle("🎫 Support Tickets")
      .setDescription(
        "Click the button below to create a support ticket."
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("support_ticket")
        .setLabel("Request Support Ticket")
        .setStyle(ButtonStyle.Secondary)
    );

    return message.channel.send({
      embeds: [embed],
      components: [row]
    });
  }

  // =======================
  // CLAIM
  // =======================

  if (cmd === "claim") {

    if (!message.member.roles.cache.has(STAFF_ROLE_ID)) {
      return;
    }

    if (claimedTickets.has(message.channel.id)) {
      return message.reply("❌ This ticket has already been claimed.");
    }

    claimedTickets.set(
      message.channel.id,
      message.author.id
    );

    const embed = new EmbedBuilder()
      .setColor("#FEE75C")
      .setTitle("🎫 Ticket Claimed")
      .setDescription(
        `Claimed by ${message.member}`
      );

    return message.channel.send({
      embeds: [embed]
    });
  }

  // =======================
  // CLOSE
  // =======================

  if (cmd === "close") {

    const ownerId = ticketOwners.get(
      message.channel.id
    );

    const isStaff =
      message.member.roles.cache.has(
        STAFF_ROLE_ID
      );

    if (
      !isStaff &&
      ownerId !== message.author.id
    ) {
      return;
    }

    await message.channel.send(
      "🔒 Closing ticket..."
    );

    // increase vouches

    if (ownerId) {

      const current =
        vouchCount.get(ownerId) || 0;

      vouchCount.set(
        ownerId,
        current + 1
      );
    }

    const total =
      vouchCount.get(ownerId) || 1;

    const randomReason =
      vouchReasons[
        Math.floor(
          Math.random() *
          vouchReasons.length
        )
      ];

    // =======================
    // VOUCH EMBED
    // =======================

    const embed = new EmbedBuilder()
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
      .setFooter({
        text: "Powered by GAG2 Helper Bot"
      })
      .setTimestamp();

    const channel =
      message.guild.channels.cache.get(
        VOUCH_CHANNEL_ID
      );

    if (channel) {

      await channel.send({
        embeds: [embed]
      });

    }

    setTimeout(async () => {

      ticketOwners.delete(
        message.channel.id
      );

      claimedTickets.delete(
        message.channel.id
      );

      await message.channel
        .delete()
        .catch(() => {});

    }, 5000);

  }

});
// =======================
// TICKET BUTTONS
// =======================

client.on("interactionCreate", async (interaction) => {

  if (!interaction.isButton()) return;

  let categoryId;
  let ticketType;
  let channelName;
  let color;
  let description;

  // =======================
  // BUY TICKET
  // =======================

  if (interaction.customId === "buy_ticket") {

    categoryId = BUY_CATEGORY_ID;
    ticketType = "BUY";
    color = "#57F287";

    channelName = `buy-${interaction.user.username}`;

    description =
      "🛒 Welcome to your buy ticket.\n\n" +
      "Please provide:\n\n" +
      "• Item you are buying\n" +
      "• Budget\n" +
      "• Payment method\n" +
      "• Additional details\n\n" +
      "A staff member will assist you shortly.";
  }

  // =======================
  // SELL TICKET
  // =======================

  if (interaction.customId === "sell_ticket") {

    categoryId = SELL_CATEGORY_ID;
    ticketType = "SELL";
    color = "#FAA61A";

    channelName = `sell-${interaction.user.username}`;

    description =
      "💰 Welcome to your sell ticket.\n\n" +
      "Please provide:\n\n" +
      "• Item you are selling\n" +
      "• Price\n" +
      "• Payment method\n" +
      "• Proof or screenshots\n\n" +
      "A staff member will assist you shortly.";
  }

  // =======================
  // SUPPORT TICKET
  // =======================

  if (interaction.customId === "support_ticket") {

    categoryId = SUPPORT_CATEGORY_ID;
    ticketType = "SUPPORT";
    color = "#5865F2";

    channelName = `support-${interaction.user.username}`;

    description =
      "🎫 Welcome to support.\n\n" +
      "Please explain your issue clearly.\n\n" +
      "Include screenshots if needed.\n\n" +
      "A staff member will help you soon.";
  }

  if (!categoryId) return;

  // =======================
  // PREVENT DUPLICATES
  // =======================

  const existing = interaction.guild.channels.cache.find(
    c => c.name === channelName
  );

  if (existing) {

    return interaction.reply({
      content: `❌ You already have a ticket: ${existing}`,
      ephemeral: true
    });

  }

  // =======================
  // CREATE CHANNEL
  // =======================

  const channel = await interaction.guild.channels.create({

    name: channelName,

    type: ChannelType.GuildText,

    parent: categoryId,

    permissionOverwrites: [

      {
        id: interaction.guild.id,
        deny: [
          PermissionsBitField.Flags.ViewChannel
        ]
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

  // =======================
  // SAVE OWNER
  // =======================

  ticketOwners.set(
    channel.id,
    interaction.user.id
  );

  // =======================
  // EMBED INSIDE TICKET
  // =======================

  const embed = new EmbedBuilder()

    .setColor(color)

    .setTitle(`🎟️ ${ticketType} Ticket`)

    .setDescription(description)

    .setFooter({
      text: "GAG2 Helper Bot"
    })

    .setTimestamp();

  // =======================
  // SEND MESSAGE
  // =======================

  await channel.send({

    content:
      `${interaction.user} <@&${STAFF_ROLE_ID}>`,

    embeds: [embed]

  });

  await interaction.reply({

    content:
      `✅ Ticket created: ${channel}`,

    ephemeral: true

  });

});
// =======================
// SLASH COMMANDS
// =======================

client.on("interactionCreate", async (interaction) => {

  if (!interaction.isChatInputCommand()) return;

  // =======================
  // /vouch_add
  // =======================

  if (interaction.commandName === "vouch_add") {

    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason");

    const current =
      vouchCount.get(user.id) || 0;

    vouchCount.set(
      user.id,
      current + 1
    );

    const embed = new EmbedBuilder()

      .setColor("#57F287")

      .setTitle("⭐ New Vouch")

      .addFields(

        {
          name: "Vouched For",
          value: `${user}`
        },

        {
          name: "Vouched By",
          value: `${interaction.user}`
        },

        {
          name: "Reason",
          value: reason
        },

        {
          name: "Total Vouches",
          value: `${current + 1}`
        }

      )

      .setFooter({
        text: "Powered by GAG2 Helper Bot"
      })

      .setTimestamp();

    const channel =
      interaction.guild.channels.cache.get(
        VOUCH_CHANNEL_ID
      );

    if (channel) {

      await channel.send({
        embeds: [embed]
      });

    }

    await interaction.reply({

      content: "✅ Vouch added.",

      ephemeral: true

    });

  }

  // =======================
  // /log
  // =======================

  if (interaction.commandName === "log") {

    const hit =
      interaction.options.getString("hit");

    const target =
      interaction.options.getUser("for");

    const embed = new EmbedBuilder()

      .setColor("#5865F2")

      .setTitle("📜 New Log")

      .addFields(

        {
          name: "Hit",
          value: hit
        },

        {
          name: "For",
          value: `${target}`
        },

        {
          name: "Logged By",
          value: `${interaction.user}`
        }

      )

      .setFooter({
        text: "GAG2 Helper Bot"
      })

      .setTimestamp();

    const channel =
      interaction.guild.channels.cache.get(
        LOG_CHANNEL_ID
      );

    if (channel) {

      await channel.send({
        embeds: [embed]
      });

    }

    await interaction.reply({

      content: "✅ Log created.",

      ephemeral: true

    });

  }

});
