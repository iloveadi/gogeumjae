// Google Analytics 4 측정 ID (예: "G-XXXXXXXXXX")를 입력하면 방문자 및 글별 열람 통계가 자동 기록됩니다.
const GA_MEASUREMENT_ID = "";

const BLOGS = [
  {
    id: "hanjeom",
    name: "한 점의 시선",
    shortLabel: "유물 · 회화",
    tagline: "옛 그림과 유물 한 점을 골라 소장처와 기록을 따라 읽는 시선",
    url: "https://hanjeom-siseon.blogspot.com/",
    feedBase: "https://hanjeom-siseon.blogspot.com/feeds/posts/default",
  },
{
  id: "samhan",
    name: "삼한시귀감 선독",
      shortLabel: "고려 한시",
        tagline: "『삼한시귀감』에 담긴 고려·신라 한시의 원문과 번역, 여운",
          url: "https://samhansigwigam.blogspot.com/",
            feedBase: "https://samhansigwigam.blogspot.com/feeds/posts/default",
  },
{
  id: "baengnyeon",
    name: "종이 위의 백년",
      shortLabel: "근현대 신문",
        tagline: "1900~1990년대 옛 신문과 잡지 속 사건과 생활사의 장면",
          url: "https://baengnyeon.blogspot.com/",
            feedBase: "https://baengnyeon.blogspot.com/feeds/posts/default",
  },
{
  id: "saryo",
    name: "사료의 뒤편",
      shortLabel: "실록 · 인물",
        tagline: "사료의 행간에 숨은 인물과 사건의 사람 냄새 나는 뒷이야기",
          url: "https://saryo-dwipyeon.blogspot.com/",
            feedBase: "https://saryo-dwipyeon.blogspot.com/feeds/posts/default",
  },
{
  id: "jido",
    name: "지도 위의 이름",
      shortLabel: "지명 · 물길",
        tagline: "도읍과 성곽, 나루와 고개에 새겨진 옛 지명의 유래",
          url: "https://jido-name.blogspot.com/",
            feedBase: "https://jido-name.blogspot.com/feeds/posts/default",
  },
{
  id: "butkkeut",
    name: "붓끝의 안부",
      shortLabel: "편지 · 서간",
        tagline: "옛사람이 붓끝에 담아 보낸 편지와 서간 속 마음의 기록",
          url: "https://butkkeut-anbu.blogspot.com/",
            feedBase: "https://butkkeut-anbu.blogspot.com/feeds/posts/default",
  },
];

const state = {
  posts: [],
  blogMeta: {},
  filterBlog: "all", // 'all' | blog.id | 'latest'
  sortBy: "newest",
  searchQuery: "",
  activeTag: "",
  searchOpen: false,
  loading: false,
  errors: [],
  currentPostUid: null,
  readerFont: "md",
  readerDark: false,
};

const els = {
  todayDate: document.getElementById("todayDate"),
  totalIssueText: document.getElementById("totalIssueText"),
  seriesNavList: document.getElementById("seriesNavList"),
  searchDrawer: document.getElementById("searchDrawer"),
  toggleSearchBtn: document.getElementById("toggleSearchBtn"),
  searchInput: document.getElementById("searchInput"),
  clearSearchBtn: document.getElementById("clearSearchBtn"),
  sortSelect: document.getElementById("sortSelect"),
  tagBar: document.getElementById("tagBar"),
  refreshBtn: document.getElementById("refreshBtn"),
  homeLogoBtn: document.getElementById("homeLogoBtn"),
  mainView: document.getElementById("mainView"),
  footerLinks: document.getElementById("footerLinks"),
  readerModal: document.getElementById("readerModal"),
  readerShell: document.getElementById("readerShell"),
  readerScroll: document.getElementById("readerScroll"),
  closeReaderBtn: document.getElementById("closeReaderBtn"),
  readerThemeBtn: document.getElementById("readerThemeBtn"),
  readerOriginalLink: document.getElementById("readerOriginalLink"),
  readerSeriesTag: document.getElementById("readerSeriesTag"),
  readerDate: document.getElementById("readerDate"),
  readerTitle: document.getElementById("readerTitle"),
  readerTags: document.getElementById("readerTags"),
  readerBody: document.getElementById("readerBody"),
  readerOriginBlogName: document.getElementById("readerOriginBlogName"),
  readerOriginCtaLink: document.getElementById("readerOriginCtaLink"),
  prevPostBtn: document.getElementById("prevPostBtn"),
  prevPostTitle: document.getElementById("prevPostTitle"),
  nextPostBtn: document.getElementById("nextPostBtn"),
  nextPostTitle: document.getElementById("nextPostTitle"),
  readerRelated: document.getElementById("readerRelated"),
};

function initAnalytics() {
  if (!GA_MEASUREMENT_ID) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID);
}

function trackPostRead(post) {
  if (typeof window.gtag !== "function") return;
  window.gtag("event", "post_read", {
    blog_name: post.blogName,
    post_title: post.title,
    post_url: post.url,
  });
}

function initHeaderMeta() {
  const now = new Date();
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  els.todayDate.textContent = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 (${weekdays[now.getDay()]})`;

  els.footerLinks.innerHTML = BLOGS.map(
    (b) => `<a href="${escapeHtml(b.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(b.name)} ↗</a>`
  ).join("");
}

function fetchJsonp(url, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const cb = `__bs_cb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const script = document.createElement("script");
    let settled = false;

    const cleanup = () => {
      if (script.parentNode) script.parentNode.removeChild(script);
      delete window[cb];
    };

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("요청 시간 초과"));
    }, timeoutMs);

    window[cb] = (data) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      cleanup();
      reject(new Error("피드 로드 실패"));
    };

    const sep = url.includes("?") ? "&" : "?";
    script.src = `${url}${sep}callback=${cb}`;
    document.head.appendChild(script);
  });
}

async function fetchAllBlogPosts(blog) {
  const pageSize = 150;
  const firstUrl = `${blog.feedBase}?alt=json-in-script&max-results=${pageSize}&start-index=1`;
  const firstData = await fetchJsonp(firstUrl);
  const feed = firstData.feed || {};
  const totalResults = Number(feed.openSearch$totalResults?.$t || 0);
  const entries = [...(feed.entry || [])];

  const pagePromises = [];
  for (let start = pageSize + 1; start <= totalResults; start += pageSize) {
    const nextUrl = `${blog.feedBase}?alt=json-in-script&max-results=${pageSize}&start-index=${start}`;
    pagePromises.push(fetchJsonp(nextUrl).then((d) => d.feed?.entry || []));
  }
  if (pagePromises.length > 0) {
    const rest = await Promise.all(pagePromises);
    rest.forEach((arr) => entries.push(...arr));
  }

  return {
    meta: {
      title: feed.title?.$t || blog.name,
      subtitle: feed.subtitle?.$t?.trim() || blog.tagline,
      total: totalResults || entries.length,
    },
    posts: entries.map((entry, idx) => normalizeEntry(entry, blog, idx)),
  };
}

function upgradeImageUrl(url, size = "w800") {
  if (!url) return "";
  return url
    .replace(/\/s72-c\//, `/${size}/`)
    .replace(/\/w72-h72[^/]*\//, `/${size}/`);
}

function stripHtmlToExcerpt(html, maxLen = 150) {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("style, script, noscript").forEach((el) => el.remove());
  const text = (doc.body.textContent || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen).trim()}…`;
}

function extractFirstImageFromHtml(html) {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  const img = doc.querySelector("img");
  return img?.getAttribute("src") || "";
}

function normalizeEntry(entry, blog, idx) {
  const title = entry.title?.$t?.trim() || "(제목 없음)";
  const published = entry.published?.$t || entry.updated?.$t || "";
  const dateObj = published ? new Date(published) : null;
  const altLink = entry.link?.find((l) => l.rel === "alternate")?.href || blog.url;
  const rawHtml = entry.content?.$t || entry.summary?.$t || "";
  const tags = (entry.category || []).map((c) => c.term).filter(Boolean);
  const firstImg = extractFirstImageFromHtml(rawHtml);
  const rawThumb = firstImg || entry.media$thumbnail?.url || "";

  return {
    uid: `${blog.id}-${entry.id?.$t || idx}`,
    blogId: blog.id,
    blogName: blog.name,
    blogShortLabel: blog.shortLabel,
    title,
    published,
    timestamp: dateObj ? dateObj.getTime() : 0,
    dateFormatted: dateObj ? formatDate(dateObj) : "",
    url: altLink,
    tags,
    heroImg: firstImg || upgradeImageUrl(rawThumb, "s1600"),
    thumb: firstImg || upgradeImageUrl(rawThumb, "s800"),
    excerpt: stripHtmlToExcerpt(rawHtml, 150),
    rawHtml,
  };
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}.${m}.${d}`;
}

async function loadAllFeeds() {
  state.loading = true;
  state.errors = [];
  els.refreshBtn.disabled = true;
  els.mainView.innerHTML = `
    <div class="loading-curtain">
      <div class="loading-line" aria-hidden="true"></div>
      <p>고금재의 최신 원고를 펼치고 있습니다…</p>
    </div>
  `;

  const results = await Promise.allSettled(BLOGS.map(fetchAllBlogPosts));
  const mergedPosts = [];

  results.forEach((res, i) => {
    const blog = BLOGS[i];
    if (res.status === "fulfilled") {
      state.blogMeta[blog.id] = res.value.meta;
      mergedPosts.push(...res.value.posts);
    } else {
      state.errors.push(blog.name);
    }
  });

  // Sort globally newest-first by default
  mergedPosts.sort((a, b) => b.timestamp - a.timestamp);
  state.posts = mergedPosts;
  state.loading = false;
  els.refreshBtn.disabled = false;

  els.totalIssueText.textContent = `총 ${state.posts.length}편의 기록이 모여 있습니다`;
  renderSeriesNav();
  renderMain();
}

function renderSeriesNav() {
  const items = [
    `<button class="series-nav-btn ${state.filterBlog === "all" ? "is-active" : ""}" data-filter="all" type="button">오늘의 호</button>`,
    `<button class="series-nav-btn ${state.filterBlog === "latest" ? "is-active" : ""}" data-filter="latest" type="button">최신 전체 <span class="series-count">${state.posts.length}</span></button>`,
    ...BLOGS.map((blog) => {
      const count = state.posts.filter((p) => p.blogId === blog.id).length;
      const active = state.filterBlog === blog.id;
      return `
        <button class="series-nav-btn theme-${blog.id} ${active ? "is-active" : ""}" data-filter="${blog.id}" type="button">
          <span class="series-dot"></span>
          <span>${escapeHtml(blog.name)}</span>
          <span class="series-count">${count}</span>
        </button>
      `;
    }),
  ];

  els.seriesNavList.innerHTML = items.join("");
}

function renderTagBar() {
  const basePosts =
    state.filterBlog === "all" || state.filterBlog === "latest"
      ? state.posts
      : state.posts.filter((p) => p.blogId === state.filterBlog);

  const counts = new Map();
  basePosts.forEach((p) => p.tags.forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)));

  const sorted = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"))
    .slice(0, 16);

  if (sorted.length === 0) {
    els.tagBar.innerHTML = "";
    return;
  }

  els.tagBar.innerHTML = [
    `<button class="tag-chip ${state.activeTag === "" ? "is-active" : ""}" data-tag="" type="button">전체 주제</button>`,
    ...sorted.map(
      ([tag, count]) =>
        `<button class="tag-chip ${state.activeTag === tag ? "is-active" : ""}" data-tag="${escapeHtml(
          tag
        )}" type="button">${escapeHtml(tag)} (${count})</button>`
    ),
  ].join("");
}

function getFilteredPosts() {
  const q = state.searchQuery.trim().toLowerCase();

  const filtered = state.posts.filter((post) => {
    if (state.filterBlog !== "all" && state.filterBlog !== "latest" && post.blogId !== state.filterBlog) {
      return false;
    }
    if (state.activeTag && !post.tags.includes(state.activeTag)) {
      return false;
    }
    if (q) {
      const hay = `${post.title} ${post.excerpt} ${post.tags.join(" ")} ${post.blogName}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  filtered.sort((a, b) => {
    if (state.sortBy === "oldest") return a.timestamp - b.timestamp;
    if (state.sortBy === "title") return a.title.localeCompare(b.title, "ko");
    return b.timestamp - a.timestamp;
  });

  return filtered;
}

function renderMain() {
  if (state.loading) return;
  renderTagBar();

  const hasQuery = Boolean(state.searchQuery.trim() || state.activeTag);
  if (state.filterBlog === "all" && !hasQuery) {
    renderMagazineHome();
  } else {
    renderFilteredGrid();
  }
}

/**
 * 매거진 홈: 권두 특집 + 3개 추천 + 6개 연재 섹션
 */
function renderMagazineHome() {
  if (state.posts.length === 0) {
    els.mainView.innerHTML = `<div class="loading-curtain"><p>불러온 글이 없습니다.</p></div>`;
    return;
  }

  // Pick a lead post that has a good cover image
  const leadPost = state.posts.find((p) => p.heroImg) || state.posts[0];

  // Pick 3 curated highlights from OTHER blogs so the top spread showcases diversity
  const picks = [];
  const usedBlogs = new Set([leadPost.blogId]);
  for (const post of state.posts) {
    if (post.uid === leadPost.uid) continue;
    if (!usedBlogs.has(post.blogId)) {
      picks.push(post);
      usedBlogs.add(post.blogId);
    }
    if (picks.length === 3) break;
  }
  // Fill remaining if fewer than 3
  for (const post of state.posts) {
    if (picks.length >= 3) break;
    if (post.uid !== leadPost.uid && !picks.includes(post)) picks.push(post);
  }

  const heroHtml = `
    <section class="hero-spread" aria-label="권두 특집">
      <article class="hero-lead theme-${leadPost.blogId}" data-open-post="${escapeHtml(leadPost.uid)}">
        ${leadPost.heroImg
      ? `<div class="hero-lead__media"><img src="${escapeHtml(leadPost.heroImg)}" alt="" /></div>`
      : ""
    }
        <div class="hero-lead__meta">
          <span class="series-pill">${escapeHtml(leadPost.blogName)}</span>
          <time class="hero-lead__date">${escapeHtml(leadPost.dateFormatted)}</time>
        </div>
        <h2 class="hero-lead__title">${escapeHtml(leadPost.title)}</h2>
        <p class="hero-lead__excerpt">${escapeHtml(leadPost.excerpt)}</p>
      </article>

      <aside class="hero-picks" aria-label="함께 읽을 글">
        <div class="picks-heading">고금재의 최신 시선</div>
        ${picks
      .map(
        (p) => `
          <article class="pick-item theme-${p.blogId}" data-open-post="${escapeHtml(p.uid)}">
            <div class="pick-item__body">
              <div class="pick-item__meta">
                <span class="series-pill">${escapeHtml(p.blogName)}</span>
                <time class="pick-item__date">${escapeHtml(p.dateFormatted)}</time>
              </div>
              <h3 class="pick-item__title">${escapeHtml(p.title)}</h3>
              <p class="pick-item__excerpt">${escapeHtml(p.excerpt)}</p>
            </div>
            ${p.thumb ? `<img class="pick-item__thumb" src="${escapeHtml(p.thumb)}" alt="" loading="lazy" />` : ""}
          </article>
        `
      )
      .join("")}
      </aside>
    </section>
  `;

  // Render 6 Curated Magazine Columns
  const sectionsHtml = BLOGS.map((blog) => {
    const blogPosts = state.posts.filter((p) => p.blogId === blog.id);
    if (blogPosts.length === 0) return "";
    const meta = state.blogMeta[blog.id];
    const lead = blogPosts[0];
    const rest = blogPosts.slice(1, 5);

    return `
      <section class="series-section theme-${blog.id}" aria-label="${escapeHtml(blog.name)}">
        <div class="series-section__head">
          <div class="series-section__title-wrap">
            <h2 class="series-section__title">${escapeHtml(meta?.title || blog.name)}</h2>
            <span class="series-section__sub">${escapeHtml(blog.tagline)}</span>
          </div>
          <button class="series-more-btn" type="button" data-filter-jump="${blog.id}">
            전체 ${blogPosts.length}편 보기 →
          </button>
        </div>

        <div class="series-layout">
          <article class="series-lead" data-open-post="${escapeHtml(lead.uid)}">
            ${lead.thumb
        ? `<img class="series-lead__img" src="${escapeHtml(lead.thumb)}" alt="" loading="lazy" />`
        : ""
      }
            <div>
              <h3 class="series-lead__title">${escapeHtml(lead.title)}</h3>
              <p class="series-lead__excerpt">${escapeHtml(lead.excerpt)}</p>
              <time class="series-lead__date">${escapeHtml(lead.dateFormatted)}</time>
            </div>
          </article>

          <ul class="series-headlines">
            ${rest.length
        ? rest
          .map(
            (p) => `
                  <li class="series-headline-row" data-open-post="${escapeHtml(p.uid)}">
                    <span class="headline-text">${escapeHtml(p.title)}</span>
                    <time class="headline-date">${escapeHtml(p.dateFormatted)}</time>
                  </li>
                `
          )
          .join("")
        : `<li class="series-headline-row" data-open-post="${escapeHtml(lead.uid)}"><span class="headline-text">이 서재의 첫 번째 기록입니다.</span><time class="headline-date">${escapeHtml(lead.dateFormatted)}</time></li>`
      }
          </ul>
        </div>
      </section>
    `;
  }).join("");

  els.mainView.innerHTML = `${heroHtml}<div class="series-showcase">${sectionsHtml}</div>`;
}

function renderFilteredGrid() {
  const posts = getFilteredPosts();
  const activeBlog = BLOGS.find((b) => b.id === state.filterBlog);
  const heading = activeBlog
    ? activeBlog.name
    : state.searchQuery
      ? `‘${state.searchQuery}’ 검색 결과`
      : state.activeTag
        ? `#${state.activeTag}`
        : "고금재 전체 글";
  const desc = activeBlog
    ? state.blogMeta[activeBlog.id]?.subtitle || activeBlog.tagline
    : "시간의 흐름에 따라 각 서재의 글을 나란히 읽어 봅니다.";

  const cardsHtml = posts.length
    ? `<div class="editorial-grid">
        ${posts
      .map(
        (p) => `
          <article class="ed-card theme-${p.blogId}" data-open-post="${escapeHtml(p.uid)}">
            ${p.thumb
            ? `<div class="ed-card__media"><img src="${escapeHtml(p.thumb)}" alt="" loading="lazy" /></div>`
            : ""
          }
            <div class="ed-card__meta">
              <span class="series-pill">${escapeHtml(p.blogName)}</span>
              <time class="ed-card__date">${escapeHtml(p.dateFormatted)}</time>
            </div>
            <h3 class="ed-card__title">${escapeHtml(p.title)}</h3>
            <p class="ed-card__excerpt">${escapeHtml(p.excerpt)}</p>
          </article>
        `
      )
      .join("")}
      </div>`
    : `<div class="loading-curtain"><p>조건에 맞는 글이 없습니다.</p></div>`;

  els.mainView.innerHTML = `
    <div class="filtered-header">
      <div>
        <h2>${escapeHtml(heading)}</h2>
        <p>${escapeHtml(desc)}</p>
      </div>
      <span class="filtered-count">총 ${posts.length}편</span>
    </div>
    ${cardsHtml}
  `;
}

/**
 * Clean Blogspot HTML for distraction-free magazine reading.
 */
function cleanArticleHtml(rawHtml) {
  const doc = new DOMParser().parseFromString(rawHtml || "", "text/html");
  doc.querySelectorAll("script, iframe, style").forEach((el) => el.remove());

  // Strip messy inline font/color/width styles from Blogger posts so typography stays harmonious
  doc.body.querySelectorAll("*").forEach((el) => {
    el.removeAttribute("style");
    el.removeAttribute("face");
    el.removeAttribute("size");
    el.removeAttribute("color");
    if (el.tagName === "IMG") {
      el.removeAttribute("width");
      el.removeAttribute("height");
      el.loading = "lazy";
    }
  });

  return doc.body.innerHTML;
}

function openReader(uid) {
  const post = state.posts.find((p) => p.uid === uid);
  if (!post) return;
  state.currentPostUid = uid;

  els.readerSeriesTag.className = `series-pill theme-${post.blogId}`;
  els.readerSeriesTag.textContent = post.blogName;
  els.readerDate.textContent = post.dateFormatted;
  els.readerTitle.textContent = post.title;
  els.readerTags.innerHTML = post.tags
    .map((t) => `<span class="reader-tag">${escapeHtml(t)}</span>`)
    .join("");

  els.readerBody.innerHTML = cleanArticleHtml(post.rawHtml) || `<p>${escapeHtml(post.excerpt)}</p>`;
  els.readerOriginalLink.href = post.url;
  els.readerOriginBlogName.textContent = `「${post.blogName}」 원문`;
  els.readerOriginCtaLink.href = post.url;
  trackPostRead(post);

  // Prev / Next within the current list
  const list = getFilteredPosts();
  const idx = list.findIndex((p) => p.uid === uid);
  const prev = idx > 0 ? list[idx - 1] : null;
  const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;

  if (prev) {
    els.prevPostBtn.hidden = false;
    els.prevPostBtn.dataset.jumpUid = prev.uid;
    els.prevPostTitle.textContent = prev.title;
  } else {
    els.prevPostBtn.hidden = true;
  }

  if (next) {
    els.nextPostBtn.hidden = false;
    els.nextPostBtn.dataset.jumpUid = next.uid;
    els.nextPostTitle.textContent = next.title;
  } else {
    els.nextPostBtn.hidden = true;
  }

  // Related posts from the same blog
  const related = state.posts
    .filter((p) => p.blogId === post.blogId && p.uid !== post.uid)
    .slice(0, 4);

  if (related.length > 0) {
    els.readerRelated.innerHTML = `
      <h3>「${escapeHtml(post.blogName)}」의 다른 글</h3>
      <ul class="related-list">
        ${related
        .map(
          (r) => `
          <li>
            <button type="button" data-jump-uid="${escapeHtml(r.uid)}">
              <span>${escapeHtml(r.title)}</span>
              <span class="related-date">${escapeHtml(r.dateFormatted)}</span>
            </button>
          </li>
        `
        )
        .join("")}
      </ul>
    `;
  } else {
    els.readerRelated.innerHTML = "";
  }

  els.readerModal.hidden = false;
  els.readerScroll.scrollTop = 0;
  document.body.style.overflow = "hidden";
}

function closeReader() {
  els.readerModal.hidden = true;
  document.body.style.overflow = "";
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Event Listeners
els.homeLogoBtn.addEventListener("click", () => {
  state.filterBlog = "all";
  state.activeTag = "";
  state.searchQuery = "";
  els.searchInput.value = "";
  els.clearSearchBtn.hidden = true;
  renderSeriesNav();
  renderMain();
});

els.seriesNavList.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-filter]");
  if (!btn) return;
  state.filterBlog = btn.dataset.filter;
  state.activeTag = "";
  renderSeriesNav();
  renderMain();
});

els.toggleSearchBtn.addEventListener("click", () => {
  state.searchOpen = !state.searchOpen;
  els.searchDrawer.hidden = !state.searchOpen;
  els.toggleSearchBtn.setAttribute("aria-expanded", String(state.searchOpen));
  if (state.searchOpen) els.searchInput.focus();
});

els.searchInput.addEventListener("input", (e) => {
  state.searchQuery = e.target.value;
  els.clearSearchBtn.hidden = !state.searchQuery;
  renderMain();
});

els.clearSearchBtn.addEventListener("click", () => {
  state.searchQuery = "";
  els.searchInput.value = "";
  els.clearSearchBtn.hidden = true;
  renderMain();
});

els.sortSelect.addEventListener("change", (e) => {
  state.sortBy = e.target.value;
  renderMain();
});

els.tagBar.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-tag]");
  if (!btn) return;
  state.activeTag = btn.dataset.tag || "";
  renderMain();
});

els.mainView.addEventListener("click", (e) => {
  const jumpFilter = e.target.closest("[data-filter-jump]");
  if (jumpFilter) {
    state.filterBlog = jumpFilter.dataset.filterJump;
    state.activeTag = "";
    renderSeriesNav();
    renderMain();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  const card = e.target.closest("[data-open-post]");
  if (card) {
    openReader(card.dataset.openPost);
  }
});

els.refreshBtn.addEventListener("click", loadAllFeeds);
els.closeReaderBtn.addEventListener("click", closeReader);

els.readerModal.addEventListener("click", (e) => {
  const jump = e.target.closest("[data-jump-uid]");
  if (jump) {
    openReader(jump.dataset.jumpUid);
    return;
  }
  const fontBtn = e.target.closest("[data-font]");
  if (fontBtn) {
    state.readerFont = fontBtn.dataset.font;
    els.readerShell.dataset.font = state.readerFont;
    els.readerModal.querySelectorAll("[data-font]").forEach((b) => {
      b.classList.toggle("is-active", b.dataset.font === state.readerFont);
    });
  }
});

els.readerThemeBtn.addEventListener("click", () => {
  state.readerDark = !state.readerDark;
  els.readerShell.classList.toggle("is-dark", state.readerDark);
  els.readerThemeBtn.textContent = state.readerDark ? "주간 모드" : "야간 모드";
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !els.readerModal.hidden) closeReader();
});

initAnalytics();
initHeaderMeta();
loadAllFeeds();
