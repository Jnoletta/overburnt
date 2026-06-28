document.addEventListener('DOMContentLoaded', () => {
  const cursor = document.createElement('div');
  cursor.classList.add('custom-cursor');
  document.body.appendChild(cursor);

  document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';
  });

  const CLICKABLE_SELECTOR = 'a, button, input[type="submit"], input[type="button"], select, [data-hover]';

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(CLICKABLE_SELECTOR)) {
      cursor.classList.add('is-hovering');
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(CLICKABLE_SELECTOR)) {
      cursor.classList.remove('is-hovering');
    }
  });
});