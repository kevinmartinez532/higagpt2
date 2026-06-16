const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  PermissionFlagsBits,
  PermissionsBitField
} = require("discord.js");

const TOKEN = process.env.TOKEN;
const prefix = ".";

const config = {
  welcomeChannelId: "1515902507807936722",
  vouchChannelId: "1515887426860744807",
  logChannelId: "PUT_LOG_CHANNEL_ID_HERE",

  staffRoleId: "1506430627501703249",

  buyCategoryId: "1515888821936324738",
  sellCategoryId: "1515888774154817699",
  supportCategoryId: "1515901968030367915",

  brandName: "GAG2 Helper Bot",
  panelColor: "#2B2D31",
  successColor: "#57F287",
  warnColor: "#FEE75C",
  errorColor: "#ED4245"
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ]
});

const claimedTickets = new Map();
const ticketOwners = new Map();
const ticketTypes = new Map();
const vouchCount = new Map();

const vouchReasons = [
  "Smooth trade and trusted service.",
  "Fast deal with clear communication.",
  "Payment and item were handled correctly.",
  "Reliable member, deal completed successfully.",
  "Helpful support and clean transaction."
];

const panelTypes = {
  buy: {
    id: "buy",
    buttonId: "ticket:create:buy",
    label: "Buy Ticket",
    emoji: "🛒",
    style: ButtonStyle.Success,
    categoryId: config.buyCategoryId,
    color: "#57F287",
    channelPrefix: "buy",
    title: "Buy Ticket",
    panelTitle: "Buy Tickets",
    panelDescription: "Open a private ticket to buy an item.",
    ticketDescription:
      "Thanks for opening a buy ticket.\n\nPlease send:\n- Item you want to buy\n- Your budget\n- Payment method\n- Extra details"
  },

  sell: {
    id: "sell",
    buttonId: "ticket:create:sell",
    label: "Sell Ticket",
    emoji: "💰",
    style: ButtonStyle.Primary,
    categoryId: config.sellCategoryId,
    color: "#FAA61A",
    channelPrefix: "sell",
    title: "Sell Ticket",
    panelTitle: "Sell Tickets",
    panelDescription: "Open a private ticket to sell an item.",
    ticketDescription:
      "Thanks for opening a sell ticket.\n\nPlease send:\n- Item you are selling\n- Price\n- Payment method\n- Proof/screenshots"
  },

  support: {
    id: "support",
    buttonId: "ticket:create:support",
    label: "Support Ticket",
    emoji: "🎫",
    style: ButtonStyle.Secondary,
    categoryId: config.supportCategoryId,
    color: "#5865F2",
    channelPrefix: "support",
    title: "Support Ticket",
    panelTitle: "Support Tickets",
    panelDescription: "Open a private ticket for help or reports.",
    ticketDescription:
      "Thanks for opening a support ticket.\n\nPlease explain your issue clearly and include screenshots if needed."
  }
};

function isConfigured(value) {
  return value && !value.startsWith("PUT_");
}

function cleanChannelName(value) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "user"
  );
}

function isStaff(member) {
  return Boolean(
    member.permissions.has(PermissionFlagsBits.Administrator) ||
      member.permissions.has(PermissionFlagsBits.BanMembers) ||
      member.roles.cache.has(config.staffRoleId)
  );
}

function makeEmbed(title, description, color = config.panelColor) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: config.brandName })
    .setTimestamp();
}

async function replySafe(source, payload) {
  if (source.isButton && source.isButton()) {
    if (source.replied || source.deferred) return source.followUp(payload).catch(() => {});
    return source.reply(payload).catch(() => {});
  }

  if (typeof payload === "string") return source.reply(payload).catch(() => {});
  return source.reply(payload.content || "Done.").catch(() => {});
}

async function sendLog(guild, embed) {
  if (!isConfigured(config.logChannelId)) return;

  const channel = guild.channels.cache.get(config.logChannelId);
  if (!channel || !channel.isTextBased()) return;

  await channel.send({ embeds: [embed] }).catch(() => {});
}

function panelRow(types = ["buy", "sell", "support"]) {
  return new ActionRowBuilder().addComponents(
    types.map((key) => {
      const type = panelTypes[key];

      return new ButtonBuilder()
        .setCustomId(type.buttonId)
        .setLabel(type.label)
        .setEmoji(type.emoji)
        .setStyle(type.style);
    })
  );
}

function ticketControlsRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket:claim")
      .setLabel("Claim")
      .setEmoji("🙋")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("ticket:close")
      .setLabel("Close")
      .setEmoji("🔒")
      .setStyle(ButtonStyle.Danger)
  );
}

async function sendPanel(channel, typeKeys) {
  const shownTypes = typeKeys.map((key) => panelTypes[key]);
  const title = shownTypes.length === 1 ? shownTypes[0].panelTitle : "Ticket Center";

  const description = shownTypes
    .map((type) => `${type.emoji} **${type.panelTitle}**\n${type.panelDescription}`)
    .join("\n\n");

  const embed = makeEmbed(title, description, config.panelColor).addFields({
    name: "Before opening a ticket",
    value: "Have your details ready. Do not open duplicate tickets for the same issue."
  });

  return channel.send({
    embeds: [embed],
    components: [panelRow(typeKeys)]
  });
}

async function createTicket(interaction, type) {
  const existing = interaction.guild.channels.cache.find(
    (channel) =>
      channel.type === ChannelType.GuildText &&
      ticketOwners.get(channel.id) === interaction.user.id &&
      ticketTypes.get(channel.id) === type.id
  );

  if (existing) {
    return interaction.reply({
      content: `You already have a ${type.label.toLowerCase()}: ${existing}`,
      ephemeral: true
    });
  }

  const category = interaction.guild.channels.cache.get(type.categoryId);

  if (!category || category.type !== ChannelType.GuildCategory) {
    return interaction.reply({
      content: "That ticket category ID is wrong. Fix the category ID in index.js.",
      ephemeral: true
    });
  }

  const channelName = `${type.channelPrefix}-${cleanChannelName(interaction.user.username)}`;

  const channel = await interaction.guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: type.categoryId,
    topic: `${type.title} for ${interaction.user.tag} (${interaction.user.id})`,

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
          PermissionsBitField.Flags.ReadMessageHistory,
          PermissionsBitField.Flags.AttachFiles,
          PermissionsBitField.Flags.EmbedLinks
        ]
      },
      {
        id: config.staffRoleId,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
          PermissionsBitField.Flags.ManageMessages
        ]
      }
    ]
  });

  ticketOwners.set(channel.id, interaction.user.id);
  ticketTypes.set(channel.id, type.id);

  const embed = makeEmbed(`${type.emoji} ${type.title}`, type.ticketDescription, type.color)
    .addFields(
      { name: "Opened By", value: `${interaction.user}`, inline: true },
      { name: "Status", value: "Waiting for staff", inline: true }
    );

  await channel.send({
    content: `${interaction.user} <@&${config.staffRoleId}>`,
    embeds: [embed],
    components: [ticketControlsRow()]
  });

  await sendLog(
    interaction.guild,
    makeEmbed("Ticket Opened", `${interaction.user} opened ${channel}.`, type.color)
      .addFields({ name: "Type", value: type.title, inline: true })
  );

  return interaction.reply({
    content: `Ticket created: ${channel}`,
    ephemeral: true
  });
}

async function claimTicket(source) {
  const member = source.member;
  const channel = source.channel;

  if (!isStaff(member)) {
    return replySafe(source, {
      content: "Only staff can claim tickets.",
      ephemeral: true
    });
  }

  if (!ticketOwners.has(channel.id)) {
    return replySafe(source, {
      content: "This channel is not a ticket.",
      ephemeral: true
    });
  }

  if (claimedTickets.has(channel.id)) {
    return replySafe(source, {
      content: `This ticket is already claimed by <@${claimedTickets.get(channel.id)}>.`,
      ephemeral: true
    });
  }

  claimedTickets.set(channel.id, member.id);

  const embed = makeEmbed("Ticket Claimed", `Claimed by ${member}.`, config.warnColor);
  await channel.send({ embeds: [embed] });

  if (source.isButton && source.isButton()) {
    return source.reply({
      content: "Ticket claimed.",
      ephemeral: true
    });
  }
}

async function closeTicket(source) {
  const member = source.member;
  const channel = source.channel;
  const guild = source.guild;
  const closer = source.user || source.author;
  const ownerId = ticketOwners.get(channel.id);

  if (!ownerId) {
    return replySafe(source, {
      content: "This channel is not a ticket.",
      ephemeral: true
    });
  }

  const allowed = isStaff(member) || ownerId === closer.id;

  if (!allowed) {
    return replySafe(source, {
      content: "Only the ticket owner or staff can close this ticket.",
      ephemeral: true
    });
  }

  const current = vouchCount.get(ownerId) || 0;
  vouchCount.set(ownerId, current + 1);

  const vouchEmbed = makeEmbed(
    "New Vouch",
    "A ticket was completed successfully.",
    config.successColor
  ).addFields(
    { name: "Vouched For", value: `<@${ownerId}>`, inline: true },
    { name: "Vouched By", value: `${closer}`, inline: true },
    {
      name: "Reason",
      value: vouchReasons[Math.floor(Math.random() * vouchReasons.length)]
    },
    { name: "Total Vouches", value: `${current + 1}`, inline: true }
  );

  const vouchChannel = guild.channels.cache.get(config.vouchChannelId);
  if (vouchChannel && vouchChannel.isTextBased()) {
    await vouchChannel.send({ embeds: [vouchEmbed] }).catch(() => {});
  }

  await sendLog(
    guild,
    makeEmbed("Ticket Closed", `${closer} closed ${channel}.`, config.errorColor)
      .addFields({ name: "Owner", value: `<@${ownerId}>`, inline: true })
  );

  if (source.isButton && source.isButton()) {
    await source.reply({
      content: "Closing this ticket in 5 seconds.",
      ephemeral: true
    });
  } else {
    await channel.send("Closing this ticket in 5 seconds.");
  }

  setTimeout(async () => {
    ticketOwners.delete(channel.id);
    ticketTypes.delete(channel.id);
    claimedTickets.delete(channel.id);

    await channel.delete().catch(() => {});
  }, 5000);
}

async function banCommand(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.BanMembers) && !isStaff(message.member)) {
    return message.reply("You do not have permission to ban members.");
  }

  if (!message.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
    return message.reply("I need the **Ban Members** permission to do that.");
  }

  const targetId = args[0]?.replace(/[<@!>]/g, "");
  const target =
    message.mentions.members.first() ||
    (targetId ? await message.guild.members.fetch(targetId).catch(() => null) : null);

  if (!target) {
    return message.reply(`Usage: \`${prefix}ban @user [reason]\``);
  }

  if (target.id === message.author.id) {
    return message.reply("You cannot ban yourself.");
  }

  if (target.id === client.user.id) {
    return message.reply("I cannot ban myself.");
  }

  if (!target.bannable) {
    return message.reply("I cannot ban that member. Their role may be higher than mine.");
  }

  const authorIsOwner = message.guild.ownerId === message.author.id;
  const targetRoleTooHigh =
    message.member.roles.highest.comparePositionTo(target.roles.highest) <= 0;

  if (!authorIsOwner && targetRoleTooHigh) {
    return message.reply("You cannot ban someone with an equal or higher role.");
  }

  const reason = args.slice(1).join(" ") || "No reason provided";

  await target.ban({
    reason: `${reason} | Banned by ${message.author.tag}`
  });

  const embed = makeEmbed("Member Banned", `${target.user.tag} was banned.`, config.errorColor)
    .addFields(
      { name: "User", value: `${target.user} (${target.id})` },
      { name: "Moderator", value: `${message.author}` },
      { name: "Reason", value: reason }
    );

  await message.channel.send({ embeds: [embed] });
  await sendLog(message.guild, embed);
}

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log(`Commands loaded: ${prefix}help, ${prefix}panel, ${prefix}buy, ${prefix}sell, ${prefix}support, ${prefix}claim, ${prefix}close, ${prefix}ban`);
});

client.on("guildMemberAdd", async (member) => {
  const channel = member.guild.channels.cache.get(config.welcomeChannelId);
  if (!channel || !channel.isTextBased()) return;

  const created = `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`;

  const embed = makeEmbed("Welcome", `${member} joined the server.`, config.successColor)
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .addFields(
      { name: "Username", value: member.user.tag, inline: true },
      { name: "User ID", value: member.id, inline: true },
      { name: "Account Created", value: created, inline: true },
      { name: "Member Count", value: `${member.guild.memberCount}`, inline: true }
    );

  await channel.send({ embeds: [embed] }).catch(() => {});
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const command = args.shift()?.toLowerCase();

  if (!command) return;

  try {
    if (command === "help" || command === "commands") {
      const embed = makeEmbed(
        "Commands",
        [
          `\`${prefix}panel\` - post the full ticket panel`,
          `\`${prefix}buy\` - post the buy ticket panel`,
          `\`${prefix}sell\` - post the sell ticket panel`,
          `\`${prefix}support\` - post the support ticket panel`,
          `\`${prefix}claim\` - staff claim the current ticket`,
          `\`${prefix}close\` - close the current ticket`,
          `\`${prefix}ban @user [reason]\` - ban a member`,
          `\`${prefix}help\` - show this menu`
        ].join("\n"),
        "#5865F2"
      );

      return message.channel.send({ embeds: [embed] });
    }

    if (command === "panel" || command === "tickets") {
      return sendPanel(message.channel, ["buy", "sell", "support"]);
    }

    if (command === "buy") {
      return sendPanel(message.channel, ["buy"]);
    }

    if (command === "sell") {
      return sendPanel(message.channel, ["sell"]);
    }

    if (command === "support") {
      return sendPanel(message.channel, ["support"]);
    }

    if (command === "claim") {
      return claimTicket(message);
    }

    if (command === "close") {
      return closeTicket(message);
    }

    if (command === "ban") {
      return banCommand(message, args);
    }
  } catch (error) {
    console.error(error);
    return message.reply("Something went wrong. Check the console for the error.");
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;
  if (!interaction.guild) return;

  try {
    if (interaction.customId.startsWith("ticket:create:")) {
      const typeId = interaction.customId.split(":").pop();
      const type = panelTypes[typeId];

      if (!type) {
        return interaction.reply({
          content: "Unknown ticket type.",
          ephemeral: true
        });
      }

      return createTicket(interaction, type);
    }

    if (interaction.customId === "ticket:claim") {
      return claimTicket(interaction);
    }

    if (interaction.customId === "ticket:close") {
      return closeTicket(interaction);
    }
  } catch (error) {
    console.error(error);

    const payload = {
      content: "Something went wrong while handling that button.",
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      return interaction.followUp(payload).catch(() => {});
    }

    return interaction.reply(payload).catch(() => {});
  }
});

if (!TOKEN) {
  console.error("Missing TOKEN environment variable.");
  process.exit(1);
}

client.login(TOKEN);
