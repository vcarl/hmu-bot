// started with https://developers.cloudflare.com/workers/get-started/quickstarts/
import { verifyKey } from "discord-interactions";
import { Hono } from "hono";
import { logger } from "hono/logger";

import { APIInteractionResponse, APIMessageInteraction } from "discord.js";
import { KVNamespace } from "@cloudflare/workers-types";
import { fetchSheet, init } from "./google-sheets";

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

app.use("/*", async (c, next) => {
  const { alreadyHadToken, reloadAccessToken } = init(
    c.env.GOOGLE_SA_PRIVATE_KEY,
  );
  if (!alreadyHadToken) {
    await reloadAccessToken();
  }
  await next();
});

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
              content: `That looks like it worked! Here are the column headers I found where I expected to find 'Email Address': ${setupResult.data.join(
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

type SetupOptions = {
  name: "sheet-url";
  type: 3;
  value: string;
}[];

const setupFailureReasons = {
  invalidUrl: "That URL doesn’t look like a Google Sheet",
  errorFetching: "There was a problem fetching from the Google Sheet",
  wrongHeadings:
    "The Google Sheet provided did not have the sheet name or column headers expected. Looked for sheets named 'Private Members' and 'Vetted Members', looked for 'Email Address' in column D.",
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

  try {
    const data = await Promise.all([
      fetchSheet(documentId, "Vetted Members!D1"),
      fetchSheet(documentId, "Private Members!D1"),
    ]);

    const columnHeadings = data.flatMap((d) => d.values.flat());
    console.log({ columnHeadings });
    if (!columnHeadings.every((h) => h === "Email Address")) {
      return { ok: false, reason: setupFailureReasons.wrongHeadings };
    }

    return { ok: true, data: columnHeadings };
  } catch (e) {
    console.log("[ERR]", e);
  }

  return {
    ok: false,
    reason: setupFailureReasons.errorFetching,
  };
}

const retrieveSheetId = (url: string) => {
  const match = url.match(/\/d\/([^/]+)\/edit/);
  return match ? match[1] : null;
};
