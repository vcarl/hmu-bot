// import { GatewayIntentBits, Client, Partials, ActivityType } from "discord.js";
import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();
app.get("/", (c) => c.text("Hello Node.js!"));

serve(app);

// export const client = new Client({
//   intents: [GatewayIntentBits.GuildMembers],
// });

// // export const reacord = new ReacordDiscordJs(client);

// export const login = () => {
//   console.log("INI", "Bootstrap starting…");
//   client
//     .login(process.env.DISCORD_HASH || "")
//     .then(async () => {
//       console.log("INI", "Bootstrap complete");

//       if (client.application) {
//         const { id } = client.application;
//         console.log(
//           "client started. If necessary, add it to your test server:",
//         );
//         console.log(
//           `https://discord.com/oauth2/authorize?client_id=${id}&permissions=8&scope=applications.commands%20bot`,
//         );
//       }
//     })
//     .catch((e) => {
//       console.log({ e });
//       console.log(
//         `Failed to log into discord client. Make sure \`.env.local\` has a discord token. Tried to use '${process.env.DISCORD_HASH}'`,
//       );
//       console.log(
//         'You can get a new discord token at https://discord.com/developers/applications, selecting your client (or making a new one), navigating to "client", and clicking "Copy" under "Click to reveal token"',
//       );
//       process.exit(1);
//     });
// };
