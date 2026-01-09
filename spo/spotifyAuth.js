require("dotenv").config({ path: __dirname + "/.env" });  // ✅ 强制从当前目录加载
const axios = require("axios");
const qs = require("qs");

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

async function getAccessToken() {
  const tokenUrl = "https://accounts.spotify.com/api/token";
  const response = await axios.post(
    tokenUrl,
    qs.stringify({ grant_type: "client_credentials" }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
      }
    }
  );

  return response.data.access_token;
}

module.exports = { getAccessToken };
