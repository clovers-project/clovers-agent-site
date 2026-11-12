(() => {
  "use strict";
  const toast = document.querySelector("#toast");
  let toastTimer;
  function notify(message) {
    toast.textContent = message;
    toast.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("visible"), 2200);
  }
  const menu = document.querySelector(".menu-toggle");
  const mobileNav = document.querySelector("#mobile-nav");
  menu.addEventListener("click", () => {
    const expanded = menu.getAttribute("aria-expanded") === "true";
    menu.setAttribute("aria-expanded", String(!expanded));
    menu.setAttribute("aria-label", expanded ? "展开导航" : "收起导航");
    mobileNav.hidden = expanded;
  });
  mobileNav.addEventListener("click", event => {
    if (event.target.closest("a")) {
      mobileNav.hidden = true;
      menu.setAttribute("aria-expanded", "false");
      menu.setAttribute("aria-label", "展开导航");
    }
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !mobileNav.hidden) {
      mobileNav.hidden = true;
      menu.setAttribute("aria-expanded", "false");
      menu.setAttribute("aria-label", "展开导航");
      menu.focus();
    }
  });
  const mobileMedia = matchMedia("(max-width: 760px)");
  mobileMedia.addEventListener("change", event => {
    if (!event.matches) {
      mobileNav.hidden = true;
      menu.setAttribute("aria-expanded", "false");
      menu.setAttribute("aria-label", "展开导航");
    }
  });
  document.querySelectorAll(".copy-button").forEach(button => {
    button.addEventListener("click", async () => {
      const code = button.closest(".code-block").querySelector("code");
      try {
        await navigator.clipboard.writeText(code.textContent);
        button.textContent = "已复制";
        notify("代码已复制");
        setTimeout(() => { button.textContent = "复制"; }, 1800);
      } catch {
        const selection = getSelection();
        const range = document.createRange();
        range.selectNodeContents(code);
        selection.removeAllRanges();
        selection.addRange(range);
        notify("请按 Ctrl+C / ⌘C 复制已选中的代码");
      }
    });
  });
  const tabs = [...document.querySelectorAll("[data-tab]")];
  function selectTab(button) {
    tabs.forEach(tab => {
      const active = tab === button;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    document.querySelectorAll("[data-panel]").forEach(panel => {
      panel.hidden = panel.dataset.panel !== button.dataset.tab;
    });
  }
  tabs.forEach((button, index) => {
    button.addEventListener("click", () => selectTab(button));
    button.addEventListener("keydown", event => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        selectTab(tabs[next]);
        tabs[next].focus();
      }
    });
  });
  const tocLinks = [...document.querySelectorAll(".docs-sidebar nav a")];
  const sections = [...document.querySelectorAll(".doc-section")];
  if (sections.length && "IntersectionObserver" in window) {
    const activeSections = new Set();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) activeSections.add(entry.target);
        else activeSections.delete(entry.target);
      });
      const first = sections.find(section => activeSections.has(section));
      if (!first) return;
      tocLinks.forEach(link => {
        const active = link.hash === `#${first.id}`;
        link.classList.toggle("active", active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }, {rootMargin: "-110px 0px -45% 0px", threshold: 0});
    sections.forEach(section => observer.observe(section));
  }
  const dialog = document.querySelector("#search-dialog");
  const input = document.querySelector("#search-input");
  const results = document.querySelector("#search-results");
  const count = document.querySelector("#search-count");
  let indexPromise;
  let entries = [];
  let searchState = "idle";
  async function openSearch() {
    if (dialog.open) return;
    dialog.showModal();
    input.focus();
    count.textContent = "正在加载文档索引…";
    try {
      indexPromise ||= fetch(new URL("assets/search-index.json", document.baseURI))
        .then(response => {
          if (!response.ok) throw new Error("Search index unavailable");
          return response.json();
        });
      entries = await indexPromise;
      searchState = "ready";
      renderSearch();
    } catch {
      indexPromise = undefined;
      searchState = "error";
      results.replaceChildren();
      const fallback = document.createElement("a");
      fallback.href = "docs.html";
      fallback.textContent = "打开使用文档 →";
      results.append(fallback);
      count.textContent = "搜索索引加载失败，请使用文档目录。";
    }
  }
  function renderSearch() {
    if (searchState !== "ready") return;
    const query = input.value.trim().toLocaleLowerCase();
    const tokens = query.split(/\s+/).filter(Boolean);
    const matches = entries.filter(entry =>
      tokens.every(token => `${entry.title} ${entry.keywords}`.toLocaleLowerCase().includes(token))
    );
    results.replaceChildren();
    matches.forEach(entry => {
      const link = document.createElement("a");
      link.href = entry.url;
      const title = document.createElement("strong");
      title.textContent = entry.title;
      const detail = document.createElement("span");
      detail.textContent = entry.keywords;
      link.append(title, detail);
      link.addEventListener("click", () => dialog.close());
      results.append(link);
    });
    count.textContent = matches.length ? `${query ? "找到" : "浏览"} ${matches.length} 个章节` : "没有找到匹配章节，试试“模型”“准入”或“语音”。";
  }
  document.querySelector(".search-open").addEventListener("click", openSearch);
  input.addEventListener("input", renderSearch);
  input.addEventListener("keydown", event => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      results.querySelector("a")?.focus();
    }
    if (event.key === "Enter") {
      event.preventDefault();
      results.querySelector("a")?.click();
    }
  });
  results.addEventListener("keydown", event => {
    const links = [...results.querySelectorAll("a")];
    const position = links.indexOf(document.activeElement);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      links[(position + 1) % links.length]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (position <= 0) input.focus();
      else links[position - 1]?.focus();
    }
  });
  dialog.addEventListener("click", event => {
    if (event.target === dialog) {
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    }
  });
  document.addEventListener("keydown", event => {
    const editing = event.target.closest("input, textarea, select, [contenteditable=true]");
    if ((!editing && event.key === "/") || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k")) {
      event.preventDefault();
      openSearch();
    }
  });
})();
