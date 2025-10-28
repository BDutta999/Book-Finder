let currentPage = 0;
let currentQuery = "";
let totalResults = 0;
let resultsPerPage = 10;

// Tab switching functionality
document.addEventListener("DOMContentLoaded", function () {
  const tabBtns = document.querySelectorAll(".tab-btn");
  const searchForms = document.querySelectorAll(".search-form");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabName = btn.dataset.tab;

      // Update active tab
      tabBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Show corresponding form
      searchForms.forEach((form) => {
        form.classList.remove("active");
        if (form.id === `${tabName}-search`) {
          form.classList.add("active");
        }
      });
    });
  });

  // Enter key support for all inputs
  document.querySelectorAll(".search-input").forEach((input) => {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const activeTab = document.querySelector(".tab-btn.active").dataset.tab;
        searchBooks(activeTab);
      }
    });
  });
});

let isSearching = false;

async function searchBooks(searchType, page = 0) {
  if (isSearching) return;
  isSearching = true;

  const loading = document.getElementById("loading");
  const results = document.getElementById("results");
  const resultsInfo = document.getElementById("results-info");
  const pagination = document.getElementById("pagination");

  // Show loading
  loading.style.display = "block";
  results.innerHTML = "";
  resultsInfo.style.display = "none";
  pagination.style.display = "none";

  try {
    const query = buildQuery(searchType);
    if (!query) {
      alert("Please enter search terms");
      loading.style.display = "none";
      isSearching = false;
      return;
    }

    currentQuery = query;
    currentPage = page;
    resultsPerPage = parseInt(document.getElementById("results-limit").value);

    const response = await fetch(
      `https://openlibrary.org/search.json?${query}&limit=${resultsPerPage}&offset=${
        page * resultsPerPage
      }`
    );
    const data = await response.json();

    totalResults = data.numFound;

    // Hide loading
    loading.style.display = "none";

    if (data.docs && data.docs.length > 0) {
      displayResults(data.docs);
      showResultsInfo(data.numFound, page);
      showPagination();
    } else {
      results.innerHTML =
        '<div style="text-align: center; padding: 40px; background: white; border-radius: 10px;"><h3>No books found</h3><p>Try different search terms or check your spelling.</p></div>';
    }
  } catch (error) {
    loading.style.display = "none";
    results.innerHTML =
      '<div style="text-align: center; padding: 40px; background: white; border-radius: 10px; color: red;"><h3>Error</h3><p>Failed to search books. Please try again.</p></div>';
    console.error("Search error:", error);
  } finally {
    isSearching = false;
  }
}

function buildQuery(searchType) {
  let query = "";

  switch (searchType) {
    case "title":
      const title = document.getElementById("title-input").value.trim();
      if (title) query = `title=${encodeURIComponent(title)}`;
      break;

    case "author":
      const author = document.getElementById("author-input").value.trim();
      if (author) query = `author=${encodeURIComponent(author)}`;
      break;

    case "subject":
      const subject = document.getElementById("subject-input").value.trim();
      if (subject) query = `subject=${encodeURIComponent(subject)}`;
      break;

    case "advanced":
      const params = [];
      const advTitle = document.getElementById("adv-title").value.trim();
      const advAuthor = document.getElementById("adv-author").value.trim();
      const advSubject = document.getElementById("adv-subject").value.trim();
      const advPublisher = document
        .getElementById("adv-publisher")
        .value.trim();
      const advYear = document.getElementById("adv-year").value.trim();
      const advLanguage = document.getElementById("adv-language").value;

      if (advTitle) params.push(`title=${encodeURIComponent(advTitle)}`);
      if (advAuthor) params.push(`author=${encodeURIComponent(advAuthor)}`);
      if (advSubject) params.push(`subject=${encodeURIComponent(advSubject)}`);
      if (advPublisher)
        params.push(`publisher=${encodeURIComponent(advPublisher)}`);
      if (advYear) params.push(`first_publish_year=${advYear}`);
      if (advLanguage) params.push(`language=${advLanguage}`);

      query = params.join("&");
      break;
  }

  // Add filters
  const hasEbook = document.getElementById("has-ebook").checked;
  const hasCover = document.getElementById("has-cover").checked;

  if (hasEbook) {
    query += query ? "&" : "";
    query += "has_fulltext=true";
  }

  if (hasCover) {
    query += query ? "&" : "";
    query += "has_cover=true";
  }

  // Add sorting
  const sortBy = document.getElementById("sort-by").value;
  if (sortBy) {
    const sortValue =
      sortBy === "new"
        ? "new"
        : sortBy === "old"
        ? "old"
        : sortBy === "editions"
        ? "editions"
        : "";
    if (sortValue) {
      query += query ? "&" : "";
      query += `sort=${encodeURIComponent(sortValue)}`;
    }
  }

  return query;
}

function displayResults(books) {
  const results = document.getElementById("results");

  results.innerHTML = books
    .map((book) => {
      const title = book.title || "Unknown Title";
      const authors = book.author_name
        ? book.author_name.slice(0, 3).join(", ")
        : "Unknown Author";
      const year = book.first_publish_year || "Unknown";
      const subjects = book.subject ? book.subject.slice(0, 5) : [];
      const coverId = book.cover_i;
      const editionCount = book.edition_count || 0;
      const languages = book.language
        ? book.language.slice(0, 3).join(", ")
        : "";

      const coverUrl = coverId
        ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
        : null;

      return `
            <div class="book-card" onclick="openBookDetails('${book.key}')">
                <div class="book-header">
                    ${
                      coverUrl
                        ? `<img src="${coverUrl}" alt="${title}" class="book-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                           <div class="book-cover" style="display: none;">No Cover</div>`
                        : `<div class="book-cover">No Cover</div>`
                    }
                    <div class="book-info">
                        <div class="book-title">${title}</div>
                        <div class="book-author">by ${authors}</div>
                        <div class="book-year">Published: ${year}</div>
                    </div>
                </div>
                <div class="book-details">
                    ${
                      subjects.length > 0
                        ? `
                        <div class="book-subjects">
                            ${subjects
                              .map(
                                (subject) =>
                                  `<span class="subject-tag">${subject}</span>`
                              )
                              .join("")}
                        </div>
                    `
                        : ""
                    }
                    <div class="book-stats">
                        <div class="stat">
                            <span>📚</span>
                            <span>${editionCount} editions</span>
                        </div>
                        ${
                          book.has_fulltext
                            ? '<div class="stat"><span>📖</span><span>E-book available</span></div>'
                            : ""
                        }
                        ${
                          languages
                            ? `<div class="stat"><span>🌐</span><span>${languages}</span></div>`
                            : ""
                        }
                    </div>
                </div>
            </div>
        `;
    })
    .join("");
}

function showResultsInfo(total, page) {
  const resultsInfo = document.getElementById("results-info");
  const resultsCount = document.getElementById("results-count");

  const start = page * resultsPerPage + 1;
  const end = Math.min((page + 1) * resultsPerPage, total);

  resultsCount.textContent = `Showing ${start}-${end} of ${total.toLocaleString()} results`;
  resultsInfo.style.display = "block";
}

function showPagination() {
  const pagination = document.getElementById("pagination");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const pageInfo = document.getElementById("page-info");

  const totalPages = Math.ceil(totalResults / resultsPerPage);

  prevBtn.disabled = currentPage === 0;
  nextBtn.disabled = currentPage >= totalPages - 1;

  pageInfo.textContent = `Page ${currentPage + 1} of ${totalPages}`;

  pagination.style.display = totalPages > 1 ? "flex" : "none";
}

function changePage(direction) {
  const newPage = currentPage + direction;
  const totalPages = Math.ceil(totalResults / resultsPerPage);

  if (newPage >= 0 && newPage < totalPages) {
    // Re-run search with new page
    const activeTab = document.querySelector(".tab-btn.active").dataset.tab;
    searchBooks(activeTab, newPage);
  }
}

function openBookDetails(bookKey) {
  // Open book details in new tab
  const url = `https://openlibrary.org${bookKey}`;
  window.open(url, "_blank");
}

// Quick search suggestions for popular topics
const quickSearches = [
  { text: "Fantasy", type: "subject", value: "fantasy" },
  { text: "Science Fiction", type: "subject", value: "science fiction" },
  { text: "Mystery", type: "subject", value: "mystery" },
  { text: "Romance", type: "subject", value: "romance" },
  { text: "Biography", type: "subject", value: "biography" },
  { text: "History", type: "subject", value: "history" },
  { text: "Self Help", type: "subject", value: "self help" },
  { text: "Programming", type: "subject", value: "programming" },
];

// Add quick search buttons
document.addEventListener("DOMContentLoaded", function () {
  const searchSection = document.querySelector(".search-section");
  const quickSearchDiv = document.createElement("div");
  quickSearchDiv.innerHTML = `
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            <h4 style="margin-bottom: 10px; color: #666;">Quick Searches:</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${quickSearches
                  .map(
                    (search) =>
                      `<button onclick="quickSearch('${search.type}', '${search.value}')" 
                             style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 15px; cursor: pointer; font-size: 12px; transition: all 0.2s ease;"
                             onmouseover="this.style.background='#f0f4ff'; this.style.borderColor='#667eea';"
                             onmouseout="this.style.background='white'; this.style.borderColor='#ddd';">
                        ${search.text}
                    </button>`
                  )
                  .join("")}
            </div>
        </div>
    `;
  searchSection.appendChild(quickSearchDiv);
});

function quickSearch(type, value) {
  // Switch to appropriate tab
  const tabBtn = document.querySelector(`[data-tab="${type}"]`);
  if (tabBtn) {
    tabBtn.click();

    // Fill in the search value
    setTimeout(() => {
      const input = document.getElementById(`${type}-input`);
      if (input) {
        input.value = value;
        searchBooks(type);
      }
    }, 100);
  }
}
