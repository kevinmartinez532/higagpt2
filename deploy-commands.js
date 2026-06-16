const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [

new SlashCommandBuilder()
.setName("vouch_add")
.setDescription("Add a vouch")
.addUserOption(option =>
  option
    .setName("user")
    .setDescription("User")
    .setRequired(true)
)
.addStringOption(option =>
  option
    .setName("reason")
    .setDescription("Reason")
    .setRequired(true)
),

new SlashCommandBuilder()
.setName("log")
.setDescription("Create a log")
.addStringOption(option =>
  option
    .setName("hit")
    .setDescription("Hit")
    .setRequired(true)
)
.addUserOption(option =>
  option
    .setName("for")
    .setDescription("User")
    .setRequired(true)
)

].map(command => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {

  await rest.put(
    Routes.applicationCommands("1515896777142702290"),
    {
      body: commands
    }
  );

  console.log("Slash commands loaded.");

})();
