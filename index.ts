// import { GatewayIntentBits, Client, Partials, ActivityType } from "discord.js";
// started with https://developers.cloudflare.com/workers/get-started/quickstarts/

import { InteractionResponseType, verifyKey } from "discord-interactions";
import { Context, Hono } from "hono";
import { logger } from "hono/logger";

import { APIInteractionResponse, APIMessageInteraction } from "discord.js";
import { KVNamespace } from "@cloudflare/workers-types";
import { getJWTFromServiceAccount } from "./google-auth";

type HonoBindings = {
  DISCORD_APP_ID: string;
  DISCORD_PUBLIC_KEY: string;
  DISCORD_TOKEN: string;
  GOOGLE_SA_PRIVATE_KEY: string;
  hmu_bot: KVNamespace;
};

const app = new Hono<{
  Bindings: HonoBindings;
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

// Actual logic
app.post("/discord", async (c) => {
  const interaction = await c.req.json();
  switch (interaction.type) {
    case 1:
      return c.json({ type: 1, data: {} });
    case 2:
      if (interaction.data.name === "setup") {
        const setupResult = await setup(
          c.env,
          interaction.guild_id,
          interaction.data.options,
        );

        if (setupResult.ok) {
          return c.json({
            type: 4,
            data: {
              content: `That looks like it worked! Here are the column headers I found where I expected to find 'email': ${setupResult.data.join(
                ", ",
              )}`,
            },
          } as APIInteractionResponse);
        }
        return c.json({
          type: 4,
          data: {
            content: `Something broke! Here's all I know: '${setupResult.reason}'`,
          },
        } as APIInteractionResponse);
      }
  }
  return c.json({ message: "Something went wrong" });
});

export default app;

// export const client = new Client({
//   intents: [GatewayIntentBits.GuildMembers],
type SetupOptions = {
  name: "sheet-url";
  type: 3;
  value: string;
}[];

const setupFailureReasons = {
  invalidUrl: "That URL doesn’t look like a Google Sheet",
} as const;
type SetupFailureReason =
  typeof setupFailureReasons[keyof typeof setupFailureReasons];

async function setup(
  env: HonoBindings,
  guildId: string,
  options: SetupOptions,
): Promise<
  { ok: true; data: string[] } | { ok: false; reason: SetupFailureReason }
> {
  const url = options.find((o) => o.name === "sheet-url");
  const documentId = url ? retrieveSheetId(url.value) : "";
  if (!documentId) {
    return { ok: false, reason: setupFailureReasons.invalidUrl };
  }

  await env.hmu_bot.put(guildId, documentId);

  return {
    ok: true,
    data: ["these", "should be", "column headers", "eventually"],
  };
}

const retrieveSheetId = (url: string) => {
  const match = url.match(/\/d\/([^/]+)\/edit/);
  return match ? match[1] : null;
};
// });

// // export const reacord = new ReacordDiscordJs(client);
const SERVICE_ACCOUNT = {
  type: "service_account",
  project_id: "auth-project-189019",
  private_key_id: "68afb592c1d3108f5fa04da86a9089d0d418e3b3",
  // private_key: "",
  client_email: "hmu-bot@auth-project-189019.iam.gserviceaccount.com",
  client_id: "116274722892340415772",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/hmu-bot%40auth-project-189019.iam.gserviceaccount.com",
  universe_domain: "googleapis.com",
};

async function getSheetData(env: HonoBindings, spreadsheetId: string) {
  // const authClient = "butts";
  const authClient = await getJWTFromServiceAccount(
    { ...SERVICE_ACCOUNT, private_key: env.GOOGLE_SA_PRIVATE_KEY },
    {
      aud: "https://www.googleapis.com/auth/spreadsheets.readonly",
    },
  );


  try {
    // const response = await GoogleSheets.spreadsheets.values.get(request);
    // console.log(response.data.values);
    // return response;
    return { test: "butts" };
  } catch (error) {
    console.error(error);
  }
}

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
