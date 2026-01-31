(function() {
  'use strict';

  // ========================================
  // Mobile Navigation Toggle
  // ========================================
  var navToggle = document.getElementById('nav-toggle');
  var navMenu = document.getElementById('nav-menu');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function() {
      navMenu.classList.toggle('is-open');
      navToggle.classList.toggle('is-active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
        navMenu.classList.remove('is-open');
        navToggle.classList.remove('is-active');
      }
    });

    // Close menu when pressing Escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        navMenu.classList.remove('is-open');
        navToggle.classList.remove('is-active');
      }
    });
  }

  // ========================================
  // Smooth Scroll for Anchor Links
  // ========================================
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;

      var target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // ========================================
  // Code Copy Button
  // ========================================
  // Only add to figure.highlight, not to inner pre elements
  document.querySelectorAll('figure.highlight').forEach(function(block) {
    // Skip if already has button
    if (block.querySelector('.copy-button')) return;

    var button = document.createElement('button');
    button.className = 'copy-button';
    button.textContent = 'Copy';
    button.type = 'button';

    button.addEventListener('click', function() {
      var code = block.querySelector('.code code, code');
      var text = code ? code.textContent : block.textContent;

      navigator.clipboard.writeText(text).then(function() {
        button.textContent = 'Copied!';
        button.classList.add('copied');

        setTimeout(function() {
          button.textContent = 'Copy';
          button.classList.remove('copied');
        }, 2000);
      }).catch(function() {
        button.textContent = 'Failed';
        setTimeout(function() {
          button.textContent = 'Copy';
        }, 2000);
      });
    });

    block.style.position = 'relative';
    block.appendChild(button);
  });

  // Add copy button to standalone pre (not inside figure.highlight)
  document.querySelectorAll('pre').forEach(function(block) {
    // Skip if inside figure.highlight or already has button
    if (block.closest('figure.highlight') || block.querySelector('.copy-button')) return;

    var button = document.createElement('button');
    button.className = 'copy-button';
    button.textContent = 'Copy';
    button.type = 'button';

    button.addEventListener('click', function() {
      var code = block.querySelector('code');
      var text = code ? code.textContent : block.textContent;

      navigator.clipboard.writeText(text).then(function() {
        button.textContent = 'Copied!';
        button.classList.add('copied');

        setTimeout(function() {
          button.textContent = 'Copy';
          button.classList.remove('copied');
        }, 2000);
      }).catch(function() {
        button.textContent = 'Failed';
        setTimeout(function() {
          button.textContent = 'Copy';
        }, 2000);
      });
    });

    block.style.position = 'relative';
    block.appendChild(button);
  });

  // ========================================
  // External Links - Open in New Tab
  // ========================================
  document.querySelectorAll('.post-content a, .page-content a').forEach(function(link) {
    if (link.hostname !== window.location.hostname && !link.hasAttribute('target')) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });

  // ========================================
  // Image Lazy Loading
  // ========================================
  if ('IntersectionObserver' in window) {
    var lazyImages = document.querySelectorAll('img[data-src]');

    var imageObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });

    lazyImages.forEach(function(img) {
      imageObserver.observe(img);
    });
  }

  // ========================================
  // Active TOC Highlight
  // ========================================
  var tocLinks = document.querySelectorAll('.toc-list a');
  var headings = [];

  if (tocLinks.length > 0) {
    tocLinks.forEach(function(link) {
      var id = link.getAttribute('href').slice(1);
      var heading = document.getElementById(id);
      if (heading) {
        headings.push({ id: id, element: heading, link: link });
      }
    });

    if (headings.length > 0) {
      var updateActiveLink = function() {
        var scrollTop = window.scrollY;
        var activeIndex = 0;

        headings.forEach(function(item, index) {
          if (item.element.offsetTop - 100 <= scrollTop) {
            activeIndex = index;
          }
        });

        tocLinks.forEach(function(link) {
          link.classList.remove('active');
        });

        if (headings[activeIndex]) {
          headings[activeIndex].link.classList.add('active');
        }
      };

      window.addEventListener('scroll', updateActiveLink);
      updateActiveLink();
    }
  }

})();
