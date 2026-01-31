(function() {
  'use strict';

  var searchInput = document.getElementById('search-input');
  var searchResult = document.getElementById('search-result');
  var searchNoResult = document.getElementById('search-no-result');

  if (!searchInput || !searchResult) return;

  var searchData = null;
  var isLoading = false;

  // ========================================
  // Load Search Data
  // ========================================
  function loadSearchData(callback) {
    if (searchData) {
      callback(searchData);
      return;
    }

    if (isLoading) return;
    isLoading = true;

    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/search.xml', true);
    xhr.onload = function() {
      if (xhr.status === 200) {
        searchData = parseSearchData(xhr.responseXML);
        callback(searchData);
      }
      isLoading = false;
    };
    xhr.onerror = function() {
      console.error('Failed to load search data');
      isLoading = false;
    };
    xhr.send();
  }

  // ========================================
  // Parse Search Data from XML
  // ========================================
  function parseSearchData(xml) {
    if (!xml) return [];

    var entries = xml.querySelectorAll('entry');
    var data = [];

    entries.forEach(function(entry) {
      var titleEl = entry.querySelector('title');
      var urlEl = entry.querySelector('url');
      var contentEl = entry.querySelector('content');

      if (titleEl && urlEl) {
        data.push({
          title: titleEl.textContent || '',
          url: urlEl.textContent || '',
          content: contentEl ? contentEl.textContent || '' : ''
        });
      }
    });

    return data;
  }

  // ========================================
  // Perform Search
  // ========================================
  function performSearch(keyword) {
    keyword = keyword.trim().toLowerCase();

    if (!keyword) {
      clearResults();
      return;
    }

    loadSearchData(function(data) {
      var results = data.filter(function(item) {
        var titleMatch = item.title.toLowerCase().indexOf(keyword) !== -1;
        var contentMatch = item.content.toLowerCase().indexOf(keyword) !== -1;
        return titleMatch || contentMatch;
      });

      displayResults(results, keyword);
    });
  }

  // ========================================
  // Display Results
  // ========================================
  function displayResults(results, keyword) {
    if (results.length === 0) {
      searchResult.innerHTML = '';
      if (searchNoResult) {
        searchNoResult.style.display = 'block';
      }
      return;
    }

    if (searchNoResult) {
      searchNoResult.style.display = 'none';
    }

    var html = '<ul class="search-result-list">';

    results.slice(0, 10).forEach(function(item) {
      var title = highlightKeyword(escapeHtml(item.title), keyword);
      html += '<li class="search-result-item">';
      html += '<a href="' + escapeHtml(item.url) + '">' + title + '</a>';
      html += '</li>';
    });

    if (results.length > 10) {
      html += '<li class="search-result-more">And ' + (results.length - 10) + ' more results...</li>';
    }

    html += '</ul>';
    searchResult.innerHTML = html;
  }

  // ========================================
  // Clear Results
  // ========================================
  function clearResults() {
    searchResult.innerHTML = '';
    if (searchNoResult) {
      searchNoResult.style.display = 'none';
    }
  }

  // ========================================
  // Highlight Keyword
  // ========================================
  function highlightKeyword(text, keyword) {
    if (!keyword) return text;

    var regex = new RegExp('(' + escapeRegex(keyword) + ')', 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  // ========================================
  // Escape HTML
  // ========================================
  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ========================================
  // Escape Regex
  // ========================================
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // ========================================
  // Debounce
  // ========================================
  function debounce(func, wait) {
    var timeout;
    return function() {
      var context = this;
      var args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        func.apply(context, args);
      }, wait);
    };
  }

  // ========================================
  // Event Listeners
  // ========================================
  searchInput.addEventListener('input', debounce(function() {
    performSearch(this.value);
  }, 300));

  searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      this.value = '';
      clearResults();
      this.blur();
    }
  });

  // Preload search data on focus
  searchInput.addEventListener('focus', function() {
    loadSearchData(function() {});
  });

})();
