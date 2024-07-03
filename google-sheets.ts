import { getAccessToken } from "./google-auth";

let accessToken = "";
let reloadAccessToken = async () => {};

export function init(privateKey: string) {
  const alreadyHadToken = accessToken !== "";
  reloadAccessToken = async () => {
    accessToken = await getAccessToken(privateKey);
  };
  return { alreadyHadToken, reloadAccessToken };
}

export async function fetchSheet(id: string, range: string) {
  const response = await retry(() =>
    fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${encodeURIComponent(
        range,
      )}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${accessToken}`,
        },
      },
    ),
  );
  return await response.json();
}

function retry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const attempt = (retryCount: number) => {
      fn()
        .then(resolve)
        .catch(async (error) => {
          await reloadAccessToken();
          if (retryCount <= 0) {
            reject(error);
          } else {
            setTimeout(() => {
              attempt(retryCount - 1);
            }, delayMs * Math.pow(2, retries - retryCount));
          }
        });
    };

    attempt(retries);
  });
}
