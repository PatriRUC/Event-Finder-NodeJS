require("dotenv").config();
const express = require('express');
const path = require('path');
const { findEvents, findDetails } = require('./geo'); // ✅ 引入 findEvents
const { searchSpotify, getArtistAlbums } = require("./spo/spotifyAPI");
const {connectDB } = require("./db");

const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'views')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'search.html'));
});

app.get('/submit', async (req, res) => {
  try {
    const { keyword, category, location, distance } = req.query;
    const data = await findEvents(keyword, distance, category, location);

    res.json({
      events: data
    });
  } catch (err) {
    console.error("🔥 Server crashed:", err);
    res.status(500).json({ error: "Server error" }); // ✅ 永远返回 JSON
  }
});

app.get("/suggest", async (req, res) => {
  const keyword = req.query.keyword;
  if (!keyword) return res.json({ suggestions: [] });

  try {
    const response = await axios.get("https://app.ticketmaster.com/discovery/v2/suggest", {
      params: {
        apikey: "LlrRfYQsMaRIIcvk127MTDu0SWurP6DV",
        keyword
      }
    });

    const data = response.data;
    let results = new Set();
    results.add(keyword);

    // 从 events, attractions, venues 中收集建议词
    if (data._embedded) {
      if (data._embedded.attractions) {
        data._embedded.attractions.forEach(a => results.add(a.name));
      }
    }

    res.json({ suggestions: Array.from(results).slice(0, 10) });

  } catch (err) {
    console.error("Suggest API Error", err.response?.data || err);
    res.json({ suggestions: [] });
  }
});


app.get('/details', async (req, res) => {
  try {
    const { id } = req.query;    // ✅ 解析出 id
    const data = await findDetails(id);  // ✅ 传入 id 字符串
    res.json({ details: data });
  } catch (err) {
    console.error("Error in /details:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.get('/artist', async (req, res) => {
  try {
    const artistName = req.query.name;
    console.log(`🎤 /artist called with: ${artistName}`);

    const data = await searchSpotify(artistName);

    if (!data.artists.items.length) {
      return res.json({ artist: null });
    }

    const artist = data.artists.items[0];

    res.json({
      artist: {
        name: artist.name,
        followers: artist.followers.total,
        popularity: artist.popularity,
        image: artist.images?.[0]?.url || null,
        url: artist.external_urls.spotify
      }
    });

  } catch (err) {
    console.error("❌ Artist API error:", err);
    res.status(500).json({ error: "Failed to fetch artist info" });
  }
});


app.get('/artist/albums', async (req, res) => {
  try {
    const artistName = req.query.name;
    console.log(`🎵 /artist/albums called with: ${artistName}`);

    const data = await searchSpotify(artistName);

    if (!data.artists.items.length) {
      return res.json({ albums: [] });
    }

    const artist = data.artists.items[0];
    const albums = await getArtistAlbums(artist.id);

    res.json({
      artist: artist.name,
      albums
    });

  } catch (err) {
    console.error("❌ Artist Albums API error:", err);
    res.status(500).json({ error: "Failed to fetch albums" });
  }
});

// ✅ Add Favorite
app.post("/favorites/add", async (req, res) => {
  console.log("📩 Received add request:", req.body);

  try {
    const db = await connectDB();
    const favorites = db.collection("favorite");

    const { event } = req.body;

    // ✅ 用 Id 而不是 eventId
    if (!event || !event.Id) {
      return res.status(400).json({ error: "Invalid event data" });
    }

    await favorites.insertOne({ ...event, createdAt: new Date() });

    res.json({ message: "Added to favorites" });
  } catch (err) {
    console.error("❌ Add Favorite Error:", err);
    res.status(500).json({ error: "DB Error" });
  }
});


// ❌ Remove Favorite
app.delete("/favorites/remove/:eventId", async (req, res) => {
  try {
    const db = await connectDB();
    const favorites = db.collection("favorite");

    const { eventId } = req.params;
    await favorites.deleteOne({ Id: eventId }); // ✅ 改这里

    res.json({ message: "Removed from favorites" });
  } catch (err) {
    console.error("❌ Remove Favorite Error:", err);
    res.status(500).json({ error: "DB Error" });
  }
});


// 📌 Get All Favorites
app.get("/favorites", async (req, res) => {
  try {
    const db = await connectDB();
    const favorites = db.collection("favorite");

    const all = await favorites.find().toArray();
    res.json(all);
  } catch (err) {
    console.error("❌ Get Favorites Error:", err);
    res.status(500).json({ error: "DB Error" });
  }
});



app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});
