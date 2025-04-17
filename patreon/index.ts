import { Client, GatewayIntentBits, Partials } from "discord.js";

const makeLogger =
  (prefix, attr: "log" | "warn" | "error" = "log") =>
  (...args) =>
    console[attr](prefix, ...args);

const log = makeLogger("guildMemberUpdate");

export const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  partials: [Partials.GuildMember],
});

const privateRole = "1260328377940836462";
const vettedRole = "1260328524087033896";
const subscriberRole = "1334572997687771196";
const accessRole = "1336774844292923533";
// const privateRole = "1258145608628178964";
// const vettedRole = "1258145631231410376";
// const subscriberRole = "1351259749798121562";
// const accessRole = "1351259716617109634";

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

client.on("guildMemberUpdate", async (oldMember, newMember) => {
  log(`Partials? new: ${newMember.partial}, old: ${oldMember.partial}`);
  if (newMember.partial) {
    newMember = await newMember.fetch();
  }
  if (oldMember.partial) {
    oldMember = await oldMember.fetch();
  }
  log(
    `User ${newMember.displayName} had ${
      oldMember.roles.cache.size
    } roles, now ${newMember.roles.cache.size}: (${newMember.roles.cache
      .map((r) => r.name)
      .join(",")})`,
  );
  // Disabled because Discord apparently is not super reliable at emitting the
  // information required to use it. Spotted an instance in practice where a role
  // change wasn't reflected in old/new data
  // if (
  //   oldMember.roles.cache.size === newMember.roles.cache.size &&
  //   oldMember.roles.cache.every((r) => newMember.roles.cache.has(r.id))
  // )

  if (newMember.roles.cache.has(accessRole)) {
    // If they have the access role but not private+patreon, remove the access role
    if (
      !newMember.roles.cache.hasAll(privateRole, subscriberRole) &&
      !newMember.roles.cache.hasAll(vettedRole, subscriberRole)
    ) {
      console.log(
        `Outcome: User ${newMember.displayName} (${newMember.id}) no longer has private+patreon, removing access`,
      );
      await newMember.roles.remove(accessRole);
    }
    return;
  }
  if (
    !newMember.roles.cache.has(accessRole) &&
    (newMember.roles.cache.hasAll(subscriberRole, privateRole) ||
      newMember.roles.cache.hasAll(subscriberRole, vettedRole))
  ) {
    console.log(
      `Outcome: User ${newMember.displayName} (${newMember.id}) now has access to subscriber channels`,
    );
    await newMember.roles.add(accessRole);
    return;
  }
  log(
    `Outcome: User ${newMember.displayName} (${newMember.id}) update ignored`,
  );
});

process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);
