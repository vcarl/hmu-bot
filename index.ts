// started with https://developers.cloudflare.com/workers/get-started/quickstarts/
import {
  MessageComponentTypes,
  ButtonStyleTypes,
  verifyKey,
  InteractionResponseType,
} from "discord-interactions";
import { Hono } from "hono";
import { logger } from "hono/logger";

import { KVNamespace } from "@cloudflare/workers-types";
import { fetchSheet, init } from "./google-sheets";
import { fetchEmailFromCode, grantRole } from "./discord";
import { layout, success } from "./templates";

type HonoBindings = {
  DISCORD_APP_ID: string;
  DISCORD_GUILD_ID: string;
  DISCORD_PUBLIC_KEY: string;
  DISCORD_TOKEN: string;
  DISCORD_SECRET: string;
  DISCORD_OAUTH_DESTINATION: string;
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
        const setupResult = await setup(c.env, interaction.data.options);

        if (setupResult.ok) {
          return c.json({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: `Welcome to Hit Me Up NYC! Please verify your account to gain access to the correct private spaces.`,
              components: [
                {
                  type: MessageComponentTypes.ACTION_ROW,
                  components: [
                    {
                      type: MessageComponentTypes.BUTTON,
                      style: ButtonStyleTypes.LINK,
                      label: "Verify me",
                      url: `https://discord.com/oauth2/authorize?client_id=1255713553965518859&response_type=code&redirect_uri=${encodeURIComponent(
                        c.env.DISCORD_OAUTH_DESTINATION,
                      )}&scope=email+identify`,
                    },
                  ],
                },
              ],
            },
          });
        }
        return c.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `Something broke! Here's all I know: '${setupResult.reason}'`,
          },
        });
      }
      if (interaction.data.name === "verify-email") {
        const documentId = await c.env.hmu_bot.get("sheet");
        const emailOption = interaction.data.options.find(
          (x) => x.name === "email",
        );
        const email = emailOption.value;
        if (!documentId || !email) {
          return c.json({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: `Needed both an email (${
                email ? "ok" : "not ok"
              }) and documentId (${documentId ? "ok" : "not ok"})`,
            },
          });
        }
        const { isVetted, isPrivate } = await checkMembership(
          documentId,
          email,
        );
        return c.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `This email ${
              isVetted ? "IS" : "is NOT"
            } a vetted member and ${
              isPrivate ? "IS" : "is NOT"
            } a private member`,
          },
        });
      }
  }
  return c.json({ message: "Something went wrong" });
});
app.get("/oauth", async (c) => {
  // Currently this doesn't require that the user's email be verified in Discord
  const { id: userId, email: rawEmail } = await fetchEmailFromCode(
    c.req.query("code") || "",
    c.env.DISCORD_APP_ID,
    c.env.DISCORD_SECRET,
    c.env.DISCORD_OAUTH_DESTINATION,
  );

  const [documentId, vettedRoleId, privateRoleId] = await Promise.all([
    c.env.hmu_bot.get("sheet"),
    c.env.hmu_bot.get("vetted"),
    c.env.hmu_bot.get("private"),
  ]);

  if (!documentId || !vettedRoleId || !privateRoleId) {
    return c.html(
      layout(
        "<p>Oh no, for some reason a required value was missing. Please report this to the Discord admins, this shouldn't have been possible.</p>",
      ),
    );
  }
  try {
    const { isVetted, isPrivate } = await checkMembership(
      documentId,
      cleanEmail(rawEmail),
    );
    if (isVetted) {
      console.log(`Granting vetted role to user ${userId}`);
      await grantRole(
        c.env.DISCORD_TOKEN,
        c.env.DISCORD_GUILD_ID,
        vettedRoleId,
        userId,
      );
    }

    if (isPrivate) {
      console.log(`Granting private role to user ${userId}`);
      await grantRole(
        c.env.DISCORD_TOKEN,
        c.env.DISCORD_GUILD_ID,
        privateRoleId,
        userId,
      );
    }

    if (!isPrivate && !isVetted) {
      return c.html(
        `<p>${rawEmail} was not found in the list of vetted members.</p>`,
      );
    }
  } catch (e) {
    return c.html(
      layout(
        "<p>Oh no, something went wrong while checking your membership! Please report this to the Discord admins, this shouldn't have been possible.</p>",
      ),
    );
  }

  return c.html(success());
});

const checkMembership = async (documentId: string, email: string) => {
  const [vettedSheet, privateSheet] = await Promise.all([
    fetchSheet(documentId, "Vetted Members!D2:D"),
    fetchSheet(documentId, "Private Members!D2:D"),
  ]);

  const vettedEmails = getEmailListFromSheetValues(vettedSheet.values);
  const isVetted = vettedEmails.some((e) => e.toLowerCase() === email);

  const privateEmails = getEmailListFromSheetValues(privateSheet.values);
  const isPrivate = privateEmails.some((e) => e.toLowerCase() === email);
  return { isVetted, isPrivate };
};

const getEmailListFromSheetValues = (sheetValues) =>
  sheetValues.flatMap((v) => v.flat());

export default app;

enum ApplicationCommandOptionType {
  Subcommand = 1,
  SubcommandGroup = 2,
  String = 3,
  Integer = 4,
  Boolean = 5,
  User = 6,
  Channel = 7,
  Role = 8,
  Mentionable = 9,
  Number = 10,
  Attachment = 11,
}

type SetupOptions = (
  | {
      name: "sheet-url";
      type: ApplicationCommandOptionType.String;
      value: string;
    }
  | {
      name: "private-role";
      type: ApplicationCommandOptionType.Role;
      value: string;
    }
  | {
      name: "vetted-role";
      type: ApplicationCommandOptionType.Role;
      value: string;
    }
)[];

const setupFailureReasons = {
  invalidUrl: "That URL doesn’t look like a Google Sheet",
  errorFetching: "There was a problem fetching from the Google Sheet",
  wrongHeadings:
    "The Google Sheet provided did not have the sheet name or column headers expected. Looked for sheets named 'Private Members' and 'Vetted Members', looked for 'Email Address' in column D.",
} as const;
type SetupFailureReason =
  (typeof setupFailureReasons)[keyof typeof setupFailureReasons];

async function setup(
  env: HonoBindings,
  options: SetupOptions,
): Promise<
  { ok: true; data: string[] } | { ok: false; reason: SetupFailureReason }
> {
  const url = options.find((o) => o.name === "sheet-url");
  const vettedRoleId =
    options.find((o) => o.name === "vetted-role")?.value || "";
  const privateRoleId =
    options.find((o) => o.name === "private-role")?.value || "";
  const documentId = url ? retrieveSheetId(url.value) : "";
  if (!documentId) {
    return { ok: false, reason: setupFailureReasons.invalidUrl };
  }

  await Promise.all([
    env.hmu_bot.put("sheet", documentId),
    env.hmu_bot.put("vetted", vettedRoleId),
    env.hmu_bot.put("private", privateRoleId),
  ]);

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

const cleanEmail = (email: string) => {
  return email.toLowerCase();
};
