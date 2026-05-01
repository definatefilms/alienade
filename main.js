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

(function () {
  var filmMount = document.getElementById("film-youtube-player");
  if (!filmMount) return;

  var fallbackEl = document.getElementById("film-youtube-fallback-msg");
  var reducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function showHostHint() {
    if (fallbackEl) fallbackEl.hidden = false;
  }

  if (window.location.protocol === "file:") {
    showHostHint();
  }

  var apiTimer;
  var usedFallback = false;

  function injectIframeFallback() {
    if (usedFallback) return;
    usedFallback = true;
    if (apiTimer) window.clearTimeout(apiTimer);

    var autoplay = reducedMotion ? "0" : "1";
    filmMount.innerHTML =
      '<iframe src="https://www.youtube.com/embed/tqQAJwpsIec?autoplay=' +
      autoplay +
      '&mute=1&loop=1&playlist=tqQAJwpsIec&playsinline=1&rel=0&modestbranding=1" title="Alienade brand film" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowfullscreen loading="eager"></iframe>';
    var iframe = filmMount.querySelector("iframe");
    if (iframe) {
      iframe.style.cssText = "position:absolute;inset:0;width:100%;height:100%;border:0";
    }
  }

  function playerOrigin() {
    if (
      window.location.protocol === "file:" ||
      !window.location.origin ||
      window.location.origin === "null"
    ) {
      return undefined;
    }
    return window.location.origin;
  }

  function initPlayer() {
    if (typeof YT === "undefined" || !YT.Player) {
      injectIframeFallback();
      return;
    }
    try {
      var vars = {
        autoplay: reducedMotion ? 0 : 1,
        mute: 1,
        loop: 1,
        playlist: "tqQAJwpsIec",
        playsinline: 1,
        modestbranding: 1,
        rel: 0,
      };
      var o = playerOrigin();
      if (o) vars.origin = o;

      new YT.Player("film-youtube-player", {
        videoId: "tqQAJwpsIec",
        width: "100%",
        height: "100%",
        playerVars: vars,
        events: {
          onReady: function (ev) {
            if (apiTimer) window.clearTimeout(apiTimer);
            try {
              ev.target.mute();
              if (!reducedMotion) ev.target.playVideo();
            } catch (err) {
              /* ignore */
            }
          },
          onError: function () {
            injectIframeFallback();
          },
        },
      });
    } catch (e) {
      injectIframeFallback();
    }
  }

  window.onYouTubeIframeAPIReady = function () {
    initPlayer();
  };

  var tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  tag.async = true;
  tag.onerror = function () {
    injectIframeFallback();
  };
  document.head.appendChild(tag);

  apiTimer = window.setTimeout(function () {
    if (typeof YT === "undefined") {
      injectIframeFallback();
    }
  }, 12000);
})();
