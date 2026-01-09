const axios = require("axios");
const { getAccessToken } = require("./spotifyAuth");  // ✅ 确保有这行

async function searchSpotify(query) {

  const token = await getAccessToken();  // ✅ 使用 getAccessToken()

  const response = await axios.get("https://api.spotify.com/v1/search", {
    params: {
      q: query,
      type: "artist",
      limit: 5
    },
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.data;
}

async function getArtistAlbums(artistId) {
  const token = await getAccessToken();
  const url = `https://api.spotify.com/v1/artists/${artistId}/albums`;

  const response = await axios.get(url, {
    params: {
      include_groups: "album,single",
      limit: 20
    },
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.data.items.map(album => ({
    id: album.id,
    name: album.name,
    release: album.release_date,
    image: album.images[0]?.url,
    url: album.external_urls.spotify
  }));
}

module.exports = { searchSpotify, getArtistAlbums };


