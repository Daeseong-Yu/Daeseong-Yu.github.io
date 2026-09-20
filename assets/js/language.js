document.addEventListener("DOMContentLoaded", function () {
  const defaultLanguage = document.documentElement.dataset.defaultLang || "en";
  const browserLanguage = navigator.language || defaultLanguage;

  const language = browserLanguage.toLowerCase().startsWith("ko")
    ? "ko"
    : defaultLanguage;

  document.querySelectorAll(".language-post").forEach(function (post) {
    post.hidden = post.dataset.lang !== language;
  });

  document.querySelectorAll(".language-group").forEach(function (group) {
    const hasVisiblePost = Array.from(
      group.querySelectorAll(".language-post")
    ).some(function (post) {
      return !post.hidden;
    });

    group.hidden = !hasVisiblePost;
  });
});
