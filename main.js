(function () {
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.querySelector("#nav-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        menu.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  var videoRoot = document.querySelector(".scroll-video-root");
  var video = document.getElementById("scroll-bg-video");
  if (!videoRoot || !video) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function enableFallback() {
    videoRoot.classList.add("scroll-video-root--fallback");
  }

  var noSource =
    typeof HTMLMediaElement !== "undefined"
      ? HTMLMediaElement.NETWORK_NO_SOURCE
      : 3;

  video.addEventListener("error", function () {
    requestAnimationFrame(function () {
      if (video.networkState === noSource) {
        enableFallback();
      }
    });
  });

  if (reduceMotion) {
    videoRoot.classList.add("scroll-video-root--reduced");
    enableFallback();
    try {
      video.pause();
    } catch (e) {
      /* ignore */
    }
    return;
  }

  function scrollProgress() {
    var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll <= 0) return 0;
    return Math.min(1, Math.max(0, window.scrollY / maxScroll));
  }

  function applyTimeFromScroll() {
    var d = video.duration;
    if (!d || !isFinite(d)) return;
    var t = scrollProgress() * d;
    if (Math.abs(video.currentTime - t) > 0.04) {
      try {
        video.currentTime = t;
      } catch (e) {
        /* ignore seek errors during load */
      }
    }
  }

  var ticking = false;
  function onScrollOrResize() {
    if (!ticking) {
      requestAnimationFrame(function () {
        applyTimeFromScroll();
        ticking = false;
      });
      ticking = true;
    }
  }

  function onReady() {
    video.pause();
    applyTimeFromScroll();
  }

  if (video.readyState >= 1) {
    onReady();
  } else {
    video.addEventListener("loadedmetadata", onReady);
  }

  video.addEventListener("loadeddata", function () {
    video.pause();
    applyTimeFromScroll();
  });

  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize, { passive: true });
})();
