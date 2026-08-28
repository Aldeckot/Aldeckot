(() => {
  function updateClock() {
    const clock = document.getElementById('clock');
    if (clock) clock.textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  updateClock();
  window.setInterval(updateClock, 30000);

  window.go = module => {
    if (module === 'inventory') window.location.href = 'inventory.html';
    else window.alert('A interface deste módulo será conectada às tabelas próprias do Supabase na próxima etapa.');
  };
})();
