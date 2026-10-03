document.querySelectorAll('[data-theme]').forEach((button) => {
  button.addEventListener('click', () => {
    document.body.dataset.preview = button.dataset.theme;
    document.querySelectorAll('[data-theme]').forEach((item) => {
      item.setAttribute('aria-pressed', String(item === button));
    });
  });
});
