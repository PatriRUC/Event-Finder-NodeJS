// geo.js
const axios = require('axios');
const geohash = require('ngeohash');

// === API Keys ===
const GOOGLE_API_KEY = "AIzaSyAoF9K80AmRLSq8BXcJvIJ-IA0EwpuIB_w";
const TICKETMASTER_API_KEY = "LlrRfYQsMaRIIcvk127MTDu0SWurP6DV";

// === API URLs ===
const google_url = "https://maps.googleapis.com/maps/api/geocode/json";
const ticketmaster_url_event = "https://app.ticketmaster.com/discovery/v2/events";

const segmentId = {
  "Default": null,
  "Music": "KZFzniwnSyZfZ7v7nJ",
  "Sports": "KZFzniwnSyZfZ7v7nE",
  "Arts & Theatre": "KZFzniwnSyZfZ7v7na",
  "Film": "KZFzniwnSyZfZ7v7nn",
  "Miscellaneous": "KZFzniwnSyZfZ7v7n1"
};

// ✅ 主函数：查找活动
async function findEvents(keyword, distance, category, location) {
  let returnData = [];

  try {
    // 1️⃣ 调用 Google Geocoding API：地址 → 经纬度
    const googleResponse = await axios.get(google_url, {
      params: {
        address: location,
        key: GOOGLE_API_KEY
      }
    });

    if (!googleResponse.data.results?.length) {
      console.log("❌ No results from Google Geocoding API");
      return [];
    }

    const { lat, lng } = googleResponse.data.results[0].geometry.location;
    const encode = geohash.encode(lat, lng, 7);

    // 2️⃣ 调用 Ticketmaster API
    const tmResponse = await axios.get(ticketmaster_url_event, {
      params: {
        apikey: TICKETMASTER_API_KEY,
        geoPoint: encode,
        radius: distance || 10,
        unit: "miles",
        segmentId: segmentId[category] || undefined,
        keyword: keyword
      }
    });

    const tmData = tmResponse.data;
    if (!tmData._embedded?.events) {
      console.log("⚠️ No events found");
      return [];
    }

    // 3️⃣ 解析结果
    for (const event of tmData._embedded.events) {
      returnData.push({
        Date: event.dates?.start?.localDate + " " + (event.dates?.start?.localTime || ""),
        Image: event.images?.[0]?.url || null,
        Event: event.name || null,
        Genre: event.classifications?.[0]?.segment?.name || null,
        Venue: event._embedded?.venues?.[0]?.name || null,
        Id: event.id || null
      });
    }

  } catch (error) {
    console.error("Error in findEvents:", error.message);
  }

  return returnData;
}


async function findDetails(id) {
  try {
    // 调用 Ticketmaster Event Details API (必须用 /events/{id})
    const tmResponse = await axios.get(`${ticketmaster_url_event}/${id}`, {
      params: {
        apikey: TICKETMASTER_API_KEY
      }
    });

    const event = tmResponse.data;

    // 处理 Artist / Team 信息
    let Artist_Team = {};
    const attractions = event._embedded?.attractions;

    if (Array.isArray(attractions)) {
      attractions.forEach(a => {
        const name = a?.name;
        const url = a?.url;
        if (name && url) {
          Artist_Team[name] = url;   // 同 Python: {name: url}
        }
      });
    }
    const venue = event._embedded?.venues?.[0];

    // 返回格式化的数据
    const returnData = {
      Date: event.dates?.start?.localDate + " " + (event.dates?.start?.localTime || ""),
      Event: event.name || null,
      Genre: event.classifications?.[0]?.segment?.name || null,
      Venue: venue.name || null,
      Artist_Team: Artist_Team,
      Ticket_Status: event.dates?.status?.code || null,
      Buy_Ticket: event.url || null, 
      Seat_Map: event.seatmap?.staticUrl || null,
      VenueInfo: {
        name: venue?.name || null, 
        image: venue?.images?.[0]?.url || null, 
        url: venue?.url || null,
        address: venue?.address?.line1 || null,
        city: venue?.city?.name || null,
        state: venue?.state?.stateCode || null, 
        country: venue?.country?.countryCode || null, 
        lnt: venue?.location?.longitude || null, 
        lat: venue?.location?.latitude || null, 
        parking: venue?.parkingDetail || null, 
        general_rule: venue?.generalInfo?.generalRule || null, 
        child_rule: venue?.generalInfo?.childRule || null
      }
    };

    return returnData;

  } catch (error) {
    console.error("Error in findDetails:", error.message);
    return null;  // 返回 null 表示失败
  }
}


// ✅ 导出函数供 server.js 使用
module.exports = { findEvents, findDetails };
