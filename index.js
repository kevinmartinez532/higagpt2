const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  PermissionFlagsBits,
  PermissionsBitField,
  SlashCommandBuilder
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
    panelDescription: "Open a private ticket to buy an item. Staff will help with price, proof, and next steps.",
    ticketDescription: "Thanks for opening a buy ticket. Please send the item you want, your budget, payment method, and any details staff should know."
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
    panelDescription: "Open a private ticket to sell an item. Staff can review proof and help complete the deal.",
    ticketDescription: "Thanks for opening a sell ticket. Please send the item, price, payment method, and proof or screenshots."
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
    panelDescription: "Open a private ticket for help, reports, questions, or server issues.",
    ticketDescription: "Thanks for opening a support ticket. Explain the issue clearly and include screenshots if they help."
  }
};

const vouchReasons = [
  "Smooth trade and trusted service.",
  "Fast deal with clear communication.",
  "Payment and item were handled correctly.",
  "Reliable member, deal completed successfully.",
  "Helpful support and clean transaction."
];

const claimedTickets = new Map();
const ticketOwners = new Map();
const ticketTypes = new Map();
const vouchCount = new Map();

const slashCommands = [
  new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Post a ticket panel")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Which panel to post")
        .setRequired(false)
        .addChoices(
          { name: "All", value: "all" },
