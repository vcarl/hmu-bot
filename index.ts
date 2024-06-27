// import { GatewayIntentBits, Client, Partials, ActivityType } from "discord.js";
// started with https://developers.cloudflare.com/workers/get-started/quickstarts/

import { verifyKey } from "discord-interactions";
import { Hono } from "hono";
import { logger } from "hono/logger";

const app = new Hono<{
  Bindings: {
    DISCORD_APP_ID: string;
    DISCORD_PUBLIC_KEY: string;
    DISCORD_TOKEN: string;
  };
}>();

app.use(logger());

// Discord signature verification
app.use("/discord", async (c, next) => {
  const isValidRequest = await verifyKey(
    await c.req.arrayBuffer(),
    c.req.header("X-Signature-Ed25519")!,
    c.req.header("X-Signature-Timestamp")!,
    c.env.DISCORD_PUBLIC_KEY,
  );
  if (!isValidRequest) {
    console.log("[REQ] Invalid request signature");
    return c.json({ message: "Bad request signature" }, 401);
  }

  const data = await c.req.json();
  console.log("[REQ]", JSON.stringify({ data }));
  await next();
});

app.post("/discord", async (c) => {
  const data = await c.req.json();
  switch (data.type) {
    case 1:
      return c.json({ type: 1, data: {} });
  }
  return c.json({ message: "Something went wrong" });
});

export default app;

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
