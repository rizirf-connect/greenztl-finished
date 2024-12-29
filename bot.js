import { Client, Events, GatewayIntentBits } from "discord.js";

// Replace with your bot token
const token = process.env.DISCORD_TOKEN;
export const runBot = () => {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  });

  client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
  });

  client.on("guildMemberAdd", (member) => {
    console.log(`${member.user.tag} has joined the server!`, member.user);
  });

  client.login(token);
};
