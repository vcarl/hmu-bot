import { Client, GatewayIntentBits, Partials } from "discord.js";

export const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  partials: [Partials.GuildMember],
});

const privateRole = "723757745030955009";
const subscriberRole = "949302893582884935";
const accessRole = "784093868181946368"; // talk

client
  .login(process.env.DISCORD_TOKEN)
  .then(() => {
    console.log("bot started…");
  })
  .catch((e) => {
    console.log({ e });
    console.log(
      `Failed to log into discord client. Make sure \`.env.local\` has a discord token. Tried to use '${process.env.DISCORD_TOKEN}'`,
    );
    console.log(
      'You can get a new discord token at https://discord.com/developers/applications, selecting your client (or making a new one), navigating to "client", and clicking "Copy" under "Click to reveal token"',
    );
    process.exit(1);
  });

client.on("guildMemberUpdate", async (_, newMember) => {
  console.log(
    "guildmemberupdate",
    `old: ${_.roles.cache.size}. new: ${
      newMember.roles.cache.size
    } (${newMember.roles.cache.map((r) => r.name).join(",")})`,
  );
  if (newMember.roles.cache.has(accessRole)) {
    // If they have the access role but not private+patreon, remove the access role
    if (!newMember.roles.cache.hasAll(privateRole, subscriberRole)) {
      console.log(
        `User ${newMember.id} no longer has private+patreon, removing access`,
      );
      await newMember.roles.remove(accessRole);
    }
  } else {
    if (newMember.roles.cache.hasAll(privateRole, subscriberRole)) {
      console.log(`User ${newMember.id} now has access to subscriber channels`);
      await newMember.roles.add(accessRole);
    }
  }
});

process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);
