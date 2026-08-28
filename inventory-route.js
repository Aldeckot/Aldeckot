(function () {
  function openPage(event) {
    if (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    window.location.href = 'inventory.html';
  }
  window.openInventoryPage = openPage;
  window.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || !target.closest) return;
    var button = target.closest('#nav button');
    if (button && button.textContent.indexOf('Inventário') !== -1) openPage(event);
  }, true);
  var buttons = document.querySelectorAll('#nav button');
  for (var index = 0; index < buttons.length; index++) {
    if (buttons[index].textContent.indexOf('Inventário') !== -1) buttons[index].onclick = openPage;
  }
}());
