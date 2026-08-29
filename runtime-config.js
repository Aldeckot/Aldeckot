(() => {
  const hasConfiguration = config => Boolean(config?.url && config?.publishableKey);

  const loadStaticFallback = () => new Promise(resolve => {
    if (hasConfiguration(window.ALDECKOT_SUPABASE_CONFIG)) return resolve(window.ALDECKOT_SUPABASE_CONFIG);
    const script = document.createElement('script');
    script.src = 'supabase-config.js';
    script.onload = () => resolve(window.ALDECKOT_SUPABASE_CONFIG || {});
    script.onerror = () => resolve({});
    document.head.appendChild(script);
  });

  const loadVercelConfiguration = async () => {
    const response = await fetch('/api/supabase-config', { cache: 'no-store' });
    if (!response.ok) throw new Error('Configuração remota indisponível.');
    const configuration = await response.json();
    if (!hasConfiguration(configuration)) throw new Error('Configuração remota inválida.');
    window.ALDECKOT_SUPABASE_CONFIG = configuration;
    return configuration;
  };

  // O Supabase client aguarda esta promessa antes de criar a conexão.
  window.ALDECKOT_SUPABASE_CONFIG_READY = loadVercelConfiguration()
    .catch(error => {
      // Mantém o motivo disponível para diagnóstico sem expor nenhuma credencial.
      window.ALDECKOT_SUPABASE_CONFIG_ERROR = error.message;
      return loadStaticFallback();
    })
    .then(configuration => {
      window.ALDECKOT_SUPABASE_CONFIG = configuration || window.ALDECKOT_SUPABASE_CONFIG || {};
      return window.ALDECKOT_SUPABASE_CONFIG;
    });
})();
