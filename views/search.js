const searchPage = document.getElementById("searchPage");
const favoritesPage = document.getElementById("favoritesPage");
const btnSearchPage = document.getElementById("btnSearchPage");
const btnFavPage = document.getElementById("btnFavPage");
const favoritesContainer = document.getElementById("favoritesContainer");
const keywordInput = document.getElementById("keyword");
const suggestionsBox = document.getElementById("suggestions");
const detailsPage = document.getElementById("detailsPage");
const detailsTitle = document.getElementById("detailsTitle");
const tabContent = document.getElementById("tabContent");
const buyTicket = document.getElementById("buy_ticket")
const distance = document.getElementById("distance");
const errorDistanceExceed = document.getElementById("error_distance_exceed");
const clearBtn = document.getElementById("clearKeyword");
const toggleBtn = document.getElementById("toggleSuggest");


let suggestVisible = false;
let isLoading = false;

lucide.createIcons(); // 初始渲染 lucide

// === 监听输入 ===
keywordInput.addEventListener("input", async () => {
  const query = keywordInput.value.trim();
  clearBtn.style.visibility = query ? "visible" : "hidden";

  if (!query) {
    hideSuggestions();
    return;
  }

  await fetchSuggestions(query);
});

// === 点击 × 清空输入 ===
clearBtn.addEventListener("click", () => {
  keywordInput.value = "";
  keywordInput.focus();
  hideSuggestions();
  clearBtn.style.visibility = "hidden";
});

// === 点击箭头切换 ===
toggleBtn.addEventListener("click", async () => {
  if (isLoading) return; // 加载中不响应

  if (suggestVisible) {
    // 🔽 已展开 → 收起
    hideSuggestions();
  } else {
    // 🔼 收起状态 → 如果有内容，重新加载
    const query = keywordInput.value.trim();
    if (query) {
      await fetchSuggestions(query);
    }
  }
});

// === 获取建议函数 ===
async function fetchSuggestions(query) {
  isLoading = true;
  toggleBtn.innerHTML = `<i data-lucide="loader-2" class="spin"></i>`;
  lucide.createIcons();

  try {
    const res = await fetch(`/suggest?keyword=${encodeURIComponent(query)}`);
    const data = await res.json();
    const suggestions = data.suggestions;

    isLoading = false;

    if (!suggestions || suggestions.length === 0) {
      hideSuggestions();
      return;
    }

    // ✅ 渲染 suggestions
    suggestionsBox.innerHTML = "";
    suggestionsBox.style.display = "block";
    suggestVisible = true;

    suggestions.forEach(item => {
      const div = document.createElement("div");
      div.className = "suggest-item";
      div.textContent = item;
      div.addEventListener("click", () => {
        keywordInput.value = item;
        hideSuggestions();
      });
      suggestionsBox.appendChild(div);
    });

    toggleBtn.innerHTML = `<i data-lucide="chevron-up"></i>`;
    lucide.createIcons();

  } catch (err) {
    console.error("Suggestion Error", err);
    isLoading = false;
    hideSuggestions();
  }
}

// === 显示 / 隐藏 ===
function hideSuggestions() {
  suggestionsBox.style.display = "none";
  suggestionsBox.innerHTML = "";
  suggestVisible = false;
  toggleBtn.innerHTML = `<i data-lucide="chevron-down"></i>`;
  lucide.createIcons();
}


// 全局 Toast 容器（只会创建一次）
function ensureToastContainer() {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    document.body.appendChild(container);
  }
  return container;
}

// 显示一个新的 toast 提示
function showToast(message, type = "info") {
  const container = ensureToastContainer();

  // 创建 toast 元素
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
  <div style="display: flex">
    <div style="display: flex; align-items: center; gap: 8px;">
     <div class="toast-icon"><i data-lucide="check"></i></div>
    </div>

    <div>
      <div><b>${message}</b></div>
      <div>You can view it in the Favorites Page.</div>
    </div>
  </div>`;
  
  container.appendChild(toast);
  lucide.createIcons();

  // 动画进入
  setTimeout(() => {
    toast.classList.add("show");
  }, 50);

  // 自动隐藏并删除
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 4000); // 显示 3 秒
}

function showUndoToast(event) {
  const container = ensureToastContainer();

  const toast = document.createElement("div");
  toast.className = "toast success"; // 使用已有样式
  toast.innerHTML = `
  <div style="display: flex; align-items: center;">
    <div style="display: flex; align-items: center; gap: 8px;">
      <div class="toast-icon"><i data-lucide="x"></i></div>
    </div>
    <div>
      ${event.Event} removed from favorites!
      <button class="undo-btn">Undo</button>
    </div>
    

  </div>

  `;
  

  container.appendChild(toast);
  lucide.createIcons();

  // 延时进入动画
  setTimeout(() => toast.classList.add("show"), 50);

  // 🔙 点击 Undo：重新收藏 + 弹出 re-add 提示
  const undoBtn = toast.querySelector(".undo-btn");
  let undone = false;
  undoBtn.addEventListener("click", async () => {
    undone = true;
    toast.remove();
    await fetch("/favorites/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event })
    });
    showToast(`"${event.Event}" re-added to favorites`, "success");
    renderFavorites();
    syncFavoriteIcons();
  });

  // 自动消失逻辑
  setTimeout(() => {
    if (!undone) toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 4000); // 4秒后消失
}


distance.addEventListener("input", () => {
  const val = distance.value.trim();

  // 每次输入都先重置状态
  distance.classList.remove("error-input");
  errorDistanceExceed.style.display = "none";

  if (val === "") return; // 空值不报错（交给提交时处理默认值）
  // 超过100
  if (Number(val) > 100) {
    distance.classList.add("error-input");
    errorDistanceExceed.style.display = "inline";
    return;
  }
});


// let favorites = new Map(); // key = eventId, value = eventObject
async function showSearchPage() {
  searchPage.style.display = "block";
  favoritesPage.style.display = "none";
  detailsPage.style.display = "none";

  btnSearchPage.classList.add("active");
  btnFavPage.classList.remove("active");
  await syncFavoriteIcons();
}

async function syncFavoriteIcons() {
  try {
    // 1️⃣ 从后端获取收藏的活动 ID 列表
    const res = await fetch("/favorites");
    const favList = await res.json();
    favIds = new Set(favList.map(f => f.Id));

    // 2️⃣ 遍历所有活动卡片
    const cards = document.querySelectorAll("#resultContainer .event-card");

    cards.forEach(card => {
      const id = card.getAttribute("data-id");
      const favIconContainer = card.querySelector(".favorite-icon");
      if (!favIconContainer) return;

      // 3️⃣ 生成 Lucide 图标元素
      const filledClass = favIds.has(id) ? "filled" : "";
      favIconContainer.innerHTML = `<i data-lucide="heart" class="icon-heart ${filledClass}"></i>`;
    });

    // 4️⃣ 重新渲染 Lucide 图标
    if (window.lucide) lucide.createIcons();

  } catch (err) {
    console.error("❌ syncFavoriteIcons error:", err);
  }
}


function showFavoritesPage() {
  searchPage.style.display = "none";
  favoritesPage.style.display = "block";
  detailsPage.style.display = "none";
  btnSearchPage.classList.remove("active");
  btnFavPage.classList.add("active");
  renderFavorites();
}

btnSearchPage.addEventListener("click", showSearchPage);
btnFavPage.addEventListener("click", showFavoritesPage);

document.getElementById("searchForm").addEventListener("submit", function (event) {
  event.preventDefault(); // ❌ 阻止表单默认提交
  let valid = true;

  const keyword = document.getElementById("keyword");
  const category = document.getElementById("category");
  const location = document.getElementById("location");
  const distance = document.getElementById("distance");
  
  const labelKeyword = document.getElementById("label_keyword");
  const labelLocation = document.getElementById("label_location");

  const errorKeyword = document.getElementById("error_keyword");
  const errorLocation = document.getElementById("error_location");

  const resultContainer = document.getElementById("resultContainer");
  resultContainer.innerHTML = `      <div id=no-result>
      <p id="no-result-1">🔍</p>
      <p id="no-result-2">Enter search criteria and click the Search button to find events</p>
      </div>`;

  // 检查 keyword
  if (!keyword.value.trim()) {
    keyword.classList.add("error-input");
    labelKeyword.classList.add("error-label");
    errorKeyword.style.display = 'inline'
    valid = false;
  }

  // 检查 location
  if (!autoDetect.checked && !location.value.trim()) {
    location.classList.add("error-input");
    labelLocation.classList.add("error-label");
    errorLocation.style.display = 'inline'
    valid = false;
  }

  if (distance.value > 100) {
    valid = false;
  }

  if (!valid) return; // ❌ 阻止发送
  // 构造参数字符串
  const params = new URLSearchParams({
    keyword: keyword.value.trim(),
    category: category.value,
    location: location.value.trim(),
    distance: distance.value.trim() || "10"
  });

// ✅ 使用 fetch 向 Node.js 后端发送 GET 请求
fetch("/submit?" + params.toString(), { method: "GET" })
  .then(res => res.json())
  .then(async data => {
    const resultContainer = document.getElementById("resultContainer");
    resultContainer.innerHTML = ""; 

    if (!data.events || data.events.length === 0) {
      resultContainer.innerHTML = `
      <div id=no-result>
      <p id="no-result-1">🔍</p>
      <p id="no-result-2">Nothing found</p>
      <p id="no-result-3">Update the query to find the events around you</p>
      </div>
      `;
      return;
    }

    // 🔥 获取收藏列表（从 DB）
    const favRes = await fetch("/favorites");
    const favList = await favRes.json();
    favIds = new Set(favList.map(f => f.Id)); // 用 Id 快速判断

    data.events.sort((a, b) => new Date(a.Date) - new Date(b.Date));

    data.events.forEach(event => {
      const card = document.createElement("div");
      card.className = "event-card";

      const imgSrc = event.Image || "https://via.placeholder.com/300?text=No+Image";
      const genreText = event.Genre || "N/A";
      const venueText = event.Venue || "Unknown Venue";
      const titleText = event.Event || "Unknown Event";
      const dateLabel = event.Date ? event.Date.split(" ")[0] : "TBD";

      card.innerHTML = `
        <img src="${imgSrc}" class="event-img" alt="Event image">
        <div class="badge badge-genre">${genreText}</div>
        <div class="badge badge-date">${dateLabel}</div>
        <div class="event-info">
        <div style="width: 90%;">
          <p class="event-title">${titleText}</p>
          <p class="event-venue">${venueText}</p>
        </div>
        <div style="width: 10%;">
            <div class="favorite-icon" data-id="${event.Id}">
            <i data-lucide="heart" class="${favIds.has(event.Id) ? 'icon-heart filled' : 'icon-heart'}"></i>
          </div>
        </div>
        </div>
      `;
      
      card.setAttribute("data-id", event.Id);
      // 点击卡片 = 查看详情
      card.addEventListener("click", () => loadDetails(event.Id, event));

      // ❤️ 点击收藏图标
      const favIcon = card.querySelector(".favorite-icon");
      favIcon.addEventListener("click", async (eventClick) => {
        eventClick.stopPropagation();
        // 找到实际的图标元素
        const heart = favIcon.querySelector(".icon-heart");

        if (favIds.has(event.Id)) {
          // ❌ 从数据库移除
          await fetch(`/favorites/remove/${event.Id}`, { method: "DELETE" });
          heart.classList.remove("filled");
          favIds.delete(event.Id);
        } else {
          // ✅ 加入数据库
          await fetch("/favorites/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event })
          });
          heart.classList.add("filled");
          favIds.add(event.Id);
          showToast(`"${event.Event}" added to favorites!`, "success");
        }
      });

      resultContainer.appendChild(card);
      lucide.createIcons();
      
    });
  })

    .catch(err => {
      resultContainer.textContent = "Error contacting server: " + err;
    });
});

async function renderFavorites() {
  const favoritesContainer = document.getElementById("favoritesContainer");
  const res = await fetch("/favorites");
  const data = await res.json();
  favoritesContainer.innerHTML = "";

  if (!data || data.length === 0) {
    favoritesContainer.innerHTML = `<div id=no-fav>
      <p id="no-fav-1">No favorite events yet.</p>
      <p id="no-fav-2">Add events to your favorites by clicking the heart icon on any event.</p>
      </div>`
    return;
  }

  data.forEach(event => {
    const card = document.createElement("div");
    card.className = "event-card";

    const imgSrc = event.Image || "https://via.placeholder.com/300?text=No+Image";
    const dateLabel = event.Date ? event.Date.split(" ")[0] : "TBD";

    card.innerHTML = `
      <img src="${imgSrc}" class="event-img">
      <div class="badge badge-genre">${event.Genre || "N/A"}</div>
      <div class="badge badge-date">${dateLabel}</div>

      <div class="event-info">
      <div style="width: 90%;">
        <p class="event-title">${event.Event}</p>
        <p class="event-venue">${event.Venue}</p>
      </div>
      <div style="width: 10%;">
        <div class="favorite-icon"><i data-lucide="heart" class="icon-heart filled"></i></div>
      </div> 
      </div>
    `;
    
    // 🔴 点击红心 = 从数据库移除
    const favIcon = card.querySelector(".favorite-icon");
    favIcon.addEventListener("click", async (e) => {
      e.stopPropagation();
      await fetch(`/favorites/remove/${event.Id}`, { method: "DELETE" });
      renderFavorites(); // 更新收藏页
      syncFavoriteIcons(); // 同步搜索页
      showUndoToast(event);
    });

    // 🟢 点击卡片 = 进入详情页
    card.addEventListener("click", () => loadDetails(event.Id));
    favoritesContainer.appendChild(card);
  });
  if (window.lucide) lucide.createIcons();
}

// 🔸 实时清除错误提示
function clearErrorOnInput(input, label, errorDiv) {
  input.addEventListener("input", () => {
    input.classList.remove("error-input");
    label.classList.remove("error-label");
    errorDiv.style.display = 'none';
  });
}

// 应用到两个输入框
clearErrorOnInput(
  document.getElementById("keyword"),
  document.getElementById("label_keyword"),
  document.getElementById("error_keyword")
);

clearErrorOnInput(
  document.getElementById("location"),
  document.getElementById("label_location"),
  document.getElementById("error_location")
);

// ========== Auto-detect toggle ==========
document.getElementById("autoDetect").addEventListener("change", async function () {
    
    const locationInput = document.getElementById("location");
    if (this.checked) {
        
        const labelLocation = document.getElementById("label_location");
        const errorLocation = document.getElementById("error_location");
        locationInput.disabled = true;
        locationInput.classList.remove("error-input");
        labelLocation.classList.remove("error-label");
        errorLocation.style.display = "none";

        try {
            const response = await fetch("https://ipinfo.io/json?token=addd0db258399c"); // your ipinfo token
            const data = await response.json();
            console.log("Auto-detected location:", data);
            locationInput.value = data.city + ", " + data.region;
        } catch (error) {
            console.error("IPInfo error:", error);
            locationInput.value = "";
        }
    } else {  // retrieve previous manual input
        locationInput.disabled = false;
        locationInput.value = "";
    }
});


// 输入时显示建议
keywordInput.addEventListener("input", async function () {
  const query = keywordInput.value.trim();

  if (query.length < 1) {
    hideSuggestions();
    return;
  }

  try {
    const res = await fetch(`/suggest?keyword=${encodeURIComponent(query)}`);
    const data = await res.json();

    const suggestions = data.suggestions;
    if (!suggestions || suggestions.length === 0) {
      hideSuggestions();
      return;
    }

    suggestionsBox.innerHTML = "";
    suggestionsBox.style.display = "block";

    suggestions.forEach(item => {
      const div = document.createElement("div");
      div.className = "suggest-item";
      div.textContent = item;

      div.addEventListener("click", () => {
        keywordInput.value = item;
        hideSuggestions();
      });

      suggestionsBox.appendChild(div);
    });

  } catch (err) {
    console.error("Suggestion Error", err);
    hideSuggestions();
  }
});


// ========== Details Page Logic ==========


let currentEventObject = null;   // 用于详情页收藏 add
let lastScrollY = 0;             // 已有，用于返回定位

async function loadDetails(id, e) {
  lastScrollY = window.scrollY; // ✅ 保存滚动位置

  // ⬇️ 获取详情数据
  const res = await fetch(`/details?id=${id}`);
  const data = await res.json();
  const details = data.details;

  // 显示详情页，隐藏搜索 & 收藏
  searchPage.style.display = "none";
  favoritesPage.style.display = "none";
  detailsPage.style.display = "block";

  // 设置标题 & Buy Ticket 链接
  detailsTitle.textContent = details.Event;
  buyTicket.setAttribute("href", details.Buy_Ticket);

  // Spotify 按钮仅音乐类可用
  document.getElementById("tab_artist").disabled = (details.Genre !== "Music");

  // ✅ 保存当前活动对象，用于点击 ❤️ 时写入数据库
  currentEventObject = e;

  // ⬇️ 初始化详情页爱心状态
  const favRes = await fetch("/favorites");
  const favList = await favRes.json();
  favIds = new Set(favList.map(f => f.Id));

  const favDetailsIcon = document.getElementById("detailsFavorite");
    favDetailsIcon.innerHTML = `
  <i data-lucide="heart" class="icon-heart ${favIds.has(id) ? 'filled' : ''}"></i>
`;

    // 初始化 Lucide 图标（只执行一次）
    if (window.lucide) lucide.createIcons();

    // ❤️ 点击详情页爱心：收藏 / 取消收藏
    favDetailsIcon.onclick = async () => {
      const heart = favDetailsIcon.querySelector(".icon-heart");

      if (favIds.has(id)) {
        // ❌ 取消收藏
        await fetch(`/favorites/remove/${id}`, { method: "DELETE" });
        heart.classList.remove("filled");
        favIds.delete(id);
      } else {
        // ✅ 加入收藏
        await fetch("/favorites/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: currentEventObject })
        });
        heart.classList.add("filled");
        favIds.add(id);
        showToast(`"${details.Event}" added to favorites`, "success");
      }


    // 🔁 同步其它两个页面状态
    syncFavoriteIcons();
    renderFavorites();
  };
  // 显示默认 tab
  showTab("info", details);
}

// Switch Tabs 这里
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", function () {
    const selected = this.dataset.tab;
    showTab(selected, window.currentDetails);
  });
});

// Render tab content
async function showTab(tab, details) {
  window.currentDetails = details; // keep in memory
  document.getElementById("tab_info").classList.remove("active");
  document.getElementById("tab_artist").classList.remove("active");
  document.getElementById("tab_venue").classList.remove("active");

if (tab === "info") {
  document.getElementById("tab_info").classList.add("active");
  const statusSet = {
    "onsale": ["green", "On Sale"], 
    "rescheduled": ["orange", "Rescheduled"], 
    "offsale": ["red", "Off Sale"], 
    "cancelled": ["black", "Canceled"], 
    "postponed": ["orange", "Postponed"]
  };

  // --- Artist 字段处理 ---
  let artists = "N/A";
  if (details.Artist_Team && Object.keys(details.Artist_Team).length > 0) {
    artists = Object.keys(details.Artist_Team).join(", ");
  }

  const status = details["Ticket_Status"].toLowerCase();
  my_text = `Check ` + details.Event + `.`;
  tabContent.innerHTML = `
  <div id="info-content">
    <div id="info-text">
      <p class="info-key">Date</p><p class="info-value">${details.Date}</p>
      <p class="info-key">Artist/Team</p><p class="info-value">${artists}</p>
      <p class="info-key">Venue</p><p class="info-value">${details.Venue}</p>
      <p class="info-key">Genre</p><p class="info-value">${details.Genre}</p>
      <p class="info-key">Ticket Status</p>
      <p class="info-value" id="status" style="background-color: ${statusSet[status][0]}">${statusSet[status][1]}</p>
      <p class="info-key">Share</p>
      <div id="fb-tt">
        <a class="social-icon" href="https://www.facebook.com/sharer/sharer.php?u=${details.Buy_Ticket}" target="_blank">
          <i data-lucide="facebook"></i>
        </a>
        <a class="social-icon" href="https://twitter.com/intent/tweet?text=${my_text}&url=${details.Buy_Ticket}" target="_blank">
          <i data-lucide="twitter"></i>
        </a>
      </div>

    </div>
    <div id="info-img">
      <p class="info-key">Seatmap</p>
      <img src="${details.Seat_Map}" onerror="this.style.display='none'">
    </div>
  </div>
  `;
  lucide.createIcons();
}
 else if (tab === "artist") {
  document.getElementById("tab_artist").classList.add("active");
  // 如果没有艺人，直接显示 N/A
  if (!details.Artist_Team || Object.keys(details.Artist_Team).length === 0) {
    tabContent.innerHTML = "<p>No Artist Information Found</p>";
    return;
  }

  const firstArtist = Object.keys(details.Artist_Team)[0];
  console.log("🎤 Loading artist:", firstArtist);

  // 清空内容，先显示加载中
  tabContent.innerHTML = `<p>Loading artist info...</p>`;

  try {
    // 请求艺人基本资料 & 专辑
    const resArtist = await fetch(`/artist?name=${encodeURIComponent(firstArtist)}`);
    const artistData = await resArtist.json();

    const resAlbums = await fetch(`/artist/albums?name=${encodeURIComponent(firstArtist)}`);
    const albumsData = await resAlbums.json();

    // ✅ 艺人资料区域
    const artist = artistData.artist;
    let html = `
      <div class="artist-info">
        <img src="${artist.image}" class="artist-img" alt="Artist Image">
        <div id="artist-key">
          <h3>${artist.name}</h3>
          <p><b>Followers:</b> ${artist.followers.toLocaleString()}</p>
          <p><b>Popularity:</b> ${artist.popularity}%</p>
          <p><a id="spotify" href="${artist.url}" target="_blank">Open in Spotify <i data-lucide="external-link"></i></a></p>
        </div>
      </div>
    `;
    
    

    // ✅ 专辑区域
    const albums = albumsData.albums;
    if (!albums.length) {
      html += "<p>No Albums Found</p>";
    } else { 
      html += `
        <h3 style="margin-top:20px;">Albums</h3>
        <div id="albumsGrid"></div>
      `;
    }
    html = `<div id="artist-content">` + html + `</div>`

    tabContent.innerHTML = html;
    lucide.createIcons();

    // 渲染专辑卡片
    const container = document.getElementById("albumsGrid");
    if (container) {
      albums.forEach(album => {
        const div = document.createElement("div");
        div.className = "album-card";
        div.innerHTML = `
          <img src="${album.image}" alt="Album Cover">
          <p class="album-name">${album.name}</p>
          <p class="album-date">${album.release}</p>
        `;
        div.addEventListener("click", () => {
        window.open(album.url, "_blank");
        });
        container.appendChild(div);
      });
    }

  } catch (err) {
    console.error("❌ Artist Tab Error:", err);
    tabContent.innerHTML = "<p>Error loading artist data</p>";
  }
} else if (tab === "venue") {
  document.getElementById("tab_venue").classList.add("active");
  const fullAddress = `${details.VenueInfo.address}, 
  ${details.VenueInfo.city}, ${details.VenueInfo.state}`;
  const encodedAddress = encodeURIComponent(fullAddress);
  tabContent.innerHTML = `
    <div id="venue-content">
      
      <div id="venue-col1">
        <h3 style="display: inline-block; margin-top: 0;">${details.VenueInfo.name}</h3>
        <div>
        <a href="https://www.google.com/maps?q=${encodedAddress}" target="_blank" id="map-link">
          ${fullAddress}<i data-lucide="external-link"></i>
        </a>
        </div>
        <div id="venue-img" style="display: inline-block">
          <img src="${details.VenueInfo.image}" alt="Venue Image" onerror="this.style.display='none'">
        </div>
      </div>

      <div id="venue-col2">

      <a href="${details.VenueInfo.url}" id="venue-link" target="_blank" style="margin-bottom: 30px">
      See Events
      <i data-lucide="external-link"></i></a>
        <div id="venue-text" style="display: inline-block">
          <div id="v1"><p class="venue-key">Parking:</p><p class="venue-value">${details.VenueInfo.parking}</p></div>
          <div id="v2"><p class="venue-key">General Rule:</p><p class="venue-value"> ${details.VenueInfo.general_rule}</p></div>
          <div id="v3"><p class="venue-key">Child Rule:</p><p class="venue-value"> ${details.VenueInfo.child_rule}</p></div>
        </div>
      </div>

    </div>
  `;
  if (!details.VenueInfo.parking) document.getElementById("v1").style.display = "none";
  if (!details.VenueInfo.general_rule) document.getElementById("v2").style.display = "none";
  if (!details.VenueInfo.child_rule) document.getElementById("v3").style.display = "none";
  lucide.createIcons();
}

}

// Back to search
document.getElementById("backToSearch").addEventListener("click", () => {
  detailsPage.style.display = "none";
  searchPage.style.display = "block";

  window.scrollTo(0, lastScrollY); // ✅ 恢复位置
});


let notificationTimeout = null;

function showNotification(message) {
  let box = document.getElementById("notification");

  // 第一次使用时创建 DOM
  if (!box) {
    box = document.createElement("div");
    box.id = "notification";
    box.className = "notification";
    document.body.appendChild(box);
  }

  box.textContent = message;
  box.classList.add("visible");

  // 清理上一次的计时器，避免多次点击叠加
  if (notificationTimeout) {
    clearTimeout(notificationTimeout);
  }

  notificationTimeout = setTimeout(() => {
    box.classList.remove("visible");
  }, 2500); // 显示 2.5 秒，你想多或少自己改
}


