"use strict";

/* ==========================================================
   CONFIGURAÇÕES FIXAS
   ========================================================== */

const GAME_SLUG = "artist-valley-adventure";

const DEFAULT_FALLBACK =
  "Não parece possível fazer isso agora.";

/* ==========================================================
   ESTADO DA APLICAÇÃO
   ========================================================== */

const state = {
  client: null,
  user: null,
  profile: null,

  game: null,
  session: null,
  settings: {},

  route: null,
  scene: null,
  blocks: [],

  inventory: [],
  flags: [],
  routes: [],
  secrets: [],
  map: {
    current_location_id: null,
    locations: [],
    connections: []
  },

  isProcessing: false
};

const elements = {};

/* ==========================================================
   INICIALIZAÇÃO
   ========================================================== */

document.addEventListener(
  "DOMContentLoaded",
  initializeGame
);

async function initializeGame() {
  cacheElements();
  configureInterfaceEvents();

  try {
    validateConfiguration();

    setLoadingMessage(
      "CONECTANDO AO ARQUIVO CENTRAL..."
    );

    state.client = createSupabaseClient();

    state.user = await getOrCreateAnonymousUser();

    setLoadingMessage(
      "RECUPERANDO O PROGRESSO DA HISTÓRIA..."
    );

    const initialization =
      await initializeStoryProgress();

    applyInitializationData(initialization);

    setLoadingMessage(
      "CARREGANDO O ARQUIVO NARRATIVO..."
    );

    const runtime =
      await loadRuntime(state.session.id);

    applyRuntime(runtime);

    revealApplication();
    focusCommandInput();
  } catch (error) {
    console.error(
      "Erro ao iniciar o jogo:",
      error
    );

    showFatalError(error);
  }
}

/* ==========================================================
   ELEMENTOS DA PÁGINA
   ========================================================== */

function cacheElements() {
  elements.loadingScreen =
    document.getElementById("loading-screen");

  elements.loadingMessage =
    document.getElementById("loading-message");

  elements.application =
    document.getElementById("application");

  elements.playerCode =
    document.getElementById("player-code");

  elements.routeName =
    document.getElementById("route-name");

  elements.gameTitle =
    document.getElementById("game-title");

  elements.sceneContainer =
    document.getElementById("scene-container");

  elements.systemMessage =
    document.getElementById("system-message");

  elements.commandForm =
    document.getElementById("command-form");

  elements.commandInput =
    document.getElementById("command-input");

  elements.sendButton =
    document.getElementById("send-button");

  elements.menuButton =
    document.getElementById("menu-button");

  elements.commandModal =
    document.getElementById("command-modal");

  const missing = Object.entries(elements)
    .filter(([, element]) => !element)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(
      `Elementos ausentes no HTML: ${missing.join(", ")}`
    );
  }
}

/* ==========================================================
   EVENTOS DA INTERFACE
   ========================================================== */

function configureInterfaceEvents() {
  elements.commandForm.addEventListener(
    "submit",
    handleCommandSubmit
  );

  elements.menuButton.addEventListener(
    "click",
    openCommandModal
  );

  elements.commandModal.addEventListener(
    "click",
    handleModalClick
  );

  document.addEventListener(
    "keydown",
    event => {
      if (event.key === "Escape") {
        closeCommandModal();
      }
    }
  );
}

function handleModalClick(event) {
  const closeTarget = event.target.closest(
    "[data-close-modal]"
  );

  if (closeTarget) {
    closeCommandModal();
    return;
  }

  const commandButton = event.target.closest(
    "[data-command]"
  );

  if (!commandButton) {
    return;
  }

  const command =
    commandButton.dataset.command || "";

  closeCommandModal();

  elements.commandInput.value = command;
  elements.commandForm.requestSubmit();
}

function openCommandModal() {
  elements.commandModal.classList.remove(
    "is-hidden"
  );
}

function closeCommandModal() {
  elements.commandModal.classList.add(
    "is-hidden"
  );
}

/* ==========================================================
   CONFIGURAÇÃO E AUTENTICAÇÃO
   ========================================================== */

function validateConfiguration() {
  if (!window.supabase) {
    throw new Error(
      "A biblioteca do Supabase não foi carregada."
    );
  }

  if (!window.APP_CONFIG) {
    throw new Error(
      "O arquivo config.js não foi carregado."
    );
  }

  const {
    supabaseUrl,
    supabasePublishableKey
  } = window.APP_CONFIG;

  if (
    !supabaseUrl ||
    supabaseUrl.includes("COLE_AQUI")
  ) {
    throw new Error(
      "A Project URL não foi configurada."
    );
  }

  if (
    !supabasePublishableKey ||
    supabasePublishableKey.includes("COLE_AQUI")
  ) {
    throw new Error(
      "A Publishable Key não foi configurada."
    );
  }
}

function createSupabaseClient() {
  return window.supabase.createClient(
    window.APP_CONFIG.supabaseUrl,
    window.APP_CONFIG.supabasePublishableKey,
    {
      auth: {
        storageKey:
          "artist-valley-player-auth",

        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );
}

async function getOrCreateAnonymousUser() {
  const {
    data: sessionData,
    error: sessionError
  } = await state.client.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (sessionData.session?.user) {
    return sessionData.session.user;
  }

  const {
    data,
    error
  } = await state.client.auth.signInAnonymously();

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error(
      "Não foi possível criar a identidade do jogador."
    );
  }

  return data.user;
}

/* ==========================================================
   RUNTIME DO BANCO
   ========================================================== */

async function initializeStoryProgress() {
  const {
    data,
    error
  } = await state.client.rpc(
    "initialize_game_session",
    {
      p_game_slug: GAME_SLUG,
      p_force_new: false,
      p_is_test: false,
      p_session_name:
        "Progresso principal"
    }
  );

  if (error) {
    throw error;
  }

  if (!data?.success || !data.session?.id) {
    throw new Error(
      "O progresso da história não pôde ser inicializado."
    );
  }

  return data;
}

async function loadRuntime(sessionId) {
  const {
    data,
    error
  } = await state.client.rpc(
    "get_game_runtime",
    {
      p_session_id: sessionId
    }
  );

  if (error) {
    throw error;
  }

  if (!data?.scene_runtime?.scene) {
    throw new Error(
      "O Runtime não devolveu uma Cena válida."
    );
  }

  return data;
}

async function processInput(input) {
  const {
    data,
    error
  } = await state.client.rpc(
    "process_game_input",
    {
      p_session_id: state.session.id,
      p_input: input
    }
  );

  if (error) {
    throw error;
  }

  return data || {};
}

/* ==========================================================
   APLICAR DADOS RECEBIDOS
   ========================================================== */

function applyInitializationData(data) {
  state.profile = data.profile || {};
  state.game = data.game || {};
  state.session = data.session || {};

  updatePermanentInterface();
}

function applyRuntime(runtime) {
  const sceneRuntime =
    runtime?.scene_runtime || {};

  state.settings =
    runtime?.settings || {};

  state.inventory =
    Array.isArray(runtime?.inventory)
      ? runtime.inventory
      : [];

  state.flags =
    Array.isArray(runtime?.flags)
      ? runtime.flags
      : [];

  state.routes =
    Array.isArray(runtime?.routes)
      ? runtime.routes
      : [];

  state.secrets =
    Array.isArray(runtime?.secrets)
      ? runtime.secrets
      : [];

  state.map =
    runtime?.map || {
      current_location_id: null,
      locations: [],
      connections: []
    };

  state.game = {
    ...state.game,
    ...(sceneRuntime.game || {})
  };

  state.session = {
    ...state.session,
    ...(sceneRuntime.session || {})
  };

  state.route =
    sceneRuntime.route || null;

  state.scene =
    sceneRuntime.scene || null;

  state.blocks =
    Array.isArray(sceneRuntime.blocks)
      ? sceneRuntime.blocks
      : [];

  applyCurrentTheme();
  updatePermanentInterface();
  renderCurrentScene();
}

/* ==========================================================
   ENVIO DE COMANDOS
   ========================================================== */

async function handleCommandSubmit(event) {
  event.preventDefault();

  if (state.isProcessing) {
    return;
  }

  const originalInput =
    elements.commandInput.value.trim();

  if (!originalInput) {
    focusCommandInput();
    return;
  }

  elements.commandInput.value = "";

  setProcessing(true);
  clearSystemMessage();

  try {
    const result =
      await processInput(originalInput);

    await handleRuntimeResult(result);
  } catch (error) {
    console.error(
      "Erro ao processar comando:",
      error
    );

    showSystemMessage(
      `ERRO: ${formatErrorMessage(error)}`,
      "error"
    );
  } finally {
    setProcessing(false);
    focusCommandInput();
  }
}

async function handleRuntimeResult(result) {
  /*
    Compatibilidade com um Código Secreto administrativo.
  */
  if (
    result.action_type ===
      "open_admin_login"
  ) {
    if (result.message) {
      showSystemMessage(
        result.message,
        "response"
      );

      await wait(900);
    }

    window.location.href =
      result.redirect_path ||
      "admin-login.html";

    return;
  }

  if (result.runtime) {
    applyRuntime(result.runtime);
  }

  if (result.silent === true) {
    clearSystemMessage();

    elements.systemMessage.classList.add(
      "is-silent"
    );

    return;
  }

  switch (result.type) {
    case "inventory":
    case "inventory_unavailable":
      renderInventoryResult(result);
      return;

    case "history":
    case "history_unavailable":
      renderHistoryResult(result);
      return;

    case "map":
    case "map_unavailable":
      renderMapResult(result);
      return;

    default:
      break;
  }

  const message =
    result.message ||
    DEFAULT_FALLBACK;

  const messageType =
    getResultMessageType(result);

  showSystemMessage(
    message,
    messageType
  );
}

function getResultMessageType(result) {
  if (
    result.success === false ||
    result.type === "unrecognized" ||
    result.type === "blocked" ||
    result.type === "input_too_long"
  ) {
    return "error";
  }

  return "response";
}

/* ==========================================================
   RESULTADOS ESPECIAIS
   ========================================================== */

function renderInventoryResult(result) {
  const inventory =
    Array.isArray(result.inventory)
      ? result.inventory
      : [];

  if (inventory.length === 0) {
    showSystemMessage(
      result.message ||
      "INVENTÁRIO\n\nNenhum objeto foi encontrado.",
      result.success === false
        ? "error"
        : "response"
    );

    return;
  }

  const lines = inventory.map(item => {
    const quantity =
      Number(item.quantity || 0);

    const quantityText =
      quantity > 1
        ? ` ×${quantity}`
        : "";

    const description =
      item.description
        ? `\n  ${item.description}`
        : "";

    return (
      `— ${item.name || item.item_key}` +
      `${quantityText}${description}`
    );
  });

  showSystemMessage(
    `INVENTÁRIO\n\n${lines.join("\n\n")}`,
    "response"
  );
}

function renderHistoryResult(result) {
  const history =
    Array.isArray(result.history)
      ? result.history
      : [];

  if (history.length === 0) {
    showSystemMessage(
      result.message ||
      "HISTÓRICO\n\nNenhum acontecimento foi registrado.",
      result.success === false
        ? "error"
        : "response"
    );

    return;
  }

  const lines = history
    .map(formatHistoryEntry)
    .filter(Boolean);

  showSystemMessage(
    `HISTÓRICO\n\n${lines.join("\n")}`,
    "response"
  );
}

function formatHistoryEntry(entry) {
  switch (entry.entry_type) {
    case "action":
      return entry.player_input
        ? `> ${entry.player_input}`
        : null;

    case "scene":
      return entry.displayed_text
        ? `— Cena: ${entry.displayed_text}`
        : null;

    case "item":
      return entry.displayed_text
        ? `— Item: ${entry.displayed_text}`
        : null;

    case "route":
      return entry.displayed_text
        ? `— Rota: ${entry.displayed_text}`
        : null;

    case "secret":
      return entry.displayed_text
        ? `— Segredo: ${entry.displayed_text}`
        : null;

    case "map":
      return entry.displayed_text
        ? `— Mapa: ${entry.displayed_text}`
        : null;

    case "error":
      return null;

    default:
      return entry.displayed_text
        ? `— ${entry.displayed_text}`
        : null;
  }
}

function renderMapResult(result) {
  const mapData =
    result.map || state.map || {};

  const locations =
    Array.isArray(mapData.locations)
      ? mapData.locations
      : [];

  if (locations.length === 0) {
    showSystemMessage(
      result.message ||
      "MAPA\n\nNenhum local foi descoberto.",
      result.success === false
        ? "error"
        : "response"
    );

    return;
  }

  const currentLocationId =
    mapData.current_location_id;

  const lines = locations.map(location => {
    const currentMarker =
      location.id === currentLocationId
        ? " [ATUAL]"
        : "";

    const lockedMarker =
      location.is_unlocked
        ? ""
        : " [BLOQUEADO]";

    return (
      `— ${location.name || location.location_key}` +
      `${currentMarker}${lockedMarker}`
    );
  });

  showSystemMessage(
    `MAPA\n\n${lines.join("\n")}`,
    "response"
  );
}

/* ==========================================================
   RENDERIZAÇÃO DA CENA
   ========================================================== */

function renderCurrentScene() {
  elements.sceneContainer.replaceChildren();

  if (!state.scene) {
    const errorMessage =
      document.createElement("p");

    errorMessage.className =
      "scene-block scene-block--system";

    errorMessage.textContent =
      "A CENA ATUAL NÃO FOI ENCONTRADA.";

    elements.sceneContainer.appendChild(
      errorMessage
    );

    return;
  }

  if (state.scene.title) {
    const title =
      document.createElement("h1");

    title.className = "scene-title";
    title.textContent =
      state.scene.title;

    elements.sceneContainer.appendChild(
      title
    );
  }

  if (state.blocks.length === 0) {
    const emptyMessage =
      document.createElement("p");

    emptyMessage.className =
      "scene-block scene-block--system";

    emptyMessage.textContent =
      "NENHUM CONTEÚDO FOI REGISTRADO PARA ESTA CENA.";

    elements.sceneContainer.appendChild(
      emptyMessage
    );

    return;
  }

  state.blocks.forEach((block, index) => {
    const renderedBlock =
      createBlockElement(block);

    if (!renderedBlock) {
      return;
    }

    renderedBlock.style.animationDelay =
      `${Math.min(index * 110, 660)}ms`;

    elements.sceneContainer.appendChild(
      renderedBlock
    );
  });
}

function createBlockElement(block) {
  let element = null;

  switch (block.block_type) {
    case "title":
      element =
        document.createElement("h2");

      element.className =
        "scene-block scene-title";

      element.textContent =
        block.content || "";
      break;

    case "text":
      element =
        document.createElement("p");

      element.className =
        "scene-block scene-block--text";

      element.textContent =
        block.content || "";
      break;

    case "system_message":
      element =
        document.createElement("p");

      element.className =
        "scene-block scene-block--system";

      element.textContent =
        block.content || "";
      break;

    case "ascii":
      element =
        document.createElement("pre");

      element.className =
        "scene-block scene-block--ascii";

      element.textContent =
        block.content || "";
      break;

    case "image":
    case "pixel_art": {
      if (!block.media_url) {
        return null;
      }

      element =
        document.createElement("figure");

      element.className =
        "scene-block scene-block--image";

      const image =
        document.createElement("img");

      image.src = block.media_url;
      image.alt = block.alt_text || "";
      image.loading = "lazy";

      if (
        block.block_type ===
        "pixel_art"
      ) {
        image.style.imageRendering =
          "pixelated";
      }

      element.appendChild(image);
      break;
    }

    case "divider":
      element =
        document.createElement("div");

      element.className =
        "scene-block scene-divider";
      break;

    case "audio":
      if (!block.media_url) {
        return null;
      }

      element =
        document.createElement("audio");

      element.className =
        "scene-block";

      element.controls = true;
      element.preload = "metadata";
      element.src = block.media_url;
      break;

    default:
      return null;
  }

  if (block.text_color) {
    element.style.color =
      block.text_color;
  }

  if (
    block.animation_type &&
    block.animation_type !== "none"
  ) {
    element.classList.add(
      `animation-${block.animation_type}`
    );
  }

  return element;
}

/* ==========================================================
   TEMA E INTERFACE PERMANENTE
   ========================================================== */

function applyCurrentTheme() {
  if (state.route) {
    applyRouteTheme(state.route);
    return;
  }

  applyDefaultTheme();
}

function applyDefaultTheme() {
  const root =
    document.documentElement;

  root.style.setProperty(
    "--route-primary",
    "#e8e8e8"
  );

  root.style.setProperty(
    "--route-secondary",
    "#8a8a8a"
  );

  root.style.setProperty(
    "--route-background",
    "#030303"
  );

  root.style.setProperty(
    "--route-panel",
    "#0c0c0c"
  );

  document.body.style.backgroundImage = "";
}

function applyRouteTheme(route) {
  const root =
    document.documentElement;

  root.style.setProperty(
    "--route-primary",
    route.primary_color ||
      "#e8e8e8"
  );

  root.style.setProperty(
    "--route-secondary",
    route.secondary_color ||
      "#8a8a8a"
  );

  root.style.setProperty(
    "--route-background",
    route.background_color ||
      "#030303"
  );

  root.style.setProperty(
    "--route-panel",
    route.panel_color ||
      "#0c0c0c"
  );

  if (route.background_image_url) {
    document.body.style.backgroundImage =
      `url("${route.background_image_url}")`;
  } else {
    document.body.style.backgroundImage =
      "";
  }
}

function updatePermanentInterface() {
  elements.playerCode.textContent =
    state.profile?.player_code ||
    "NÃO IDENTIFICADO";

  elements.gameTitle.textContent =
    String(
      state.game?.title ||
      "ARQUIVO NARRATIVO"
    ).toLocaleUpperCase("pt-BR");

  elements.routeName.textContent =
    state.route?.name
      ? state.route.name
          .toLocaleUpperCase("pt-BR")
      : "NÃO DEFINIDA";
}

function revealApplication() {
  elements.loadingScreen.classList.add(
    "is-hidden"
  );

  elements.application.classList.remove(
    "is-hidden"
  );
}

/* ==========================================================
   MENSAGENS E ESTADOS
   ========================================================== */

function setLoadingMessage(message) {
  elements.loadingMessage.textContent =
    message;
}

function showSystemMessage(
  message,
  type = "response"
) {
  elements.systemMessage.className =
    `system-message is-${type}`;

  elements.systemMessage.textContent =
    message || "";
}

function clearSystemMessage() {
  elements.systemMessage.className =
    "system-message";

  elements.systemMessage.textContent = "";
}

function setProcessing(isProcessing) {
  state.isProcessing = isProcessing;

  elements.commandInput.disabled =
    isProcessing;

  elements.sendButton.disabled =
    isProcessing;
}

function focusCommandInput() {
  window.setTimeout(() => {
    if (!state.isProcessing) {
      elements.commandInput.focus();
    }
  }, 30);
}

function showFatalError(error) {
  setLoadingMessage(
    `FALHA AO ABRIR O ARQUIVO: ${formatErrorMessage(error)}`
  );

  elements.loadingScreen.classList.remove(
    "is-hidden"
  );

  elements.application.classList.add(
    "is-hidden"
  );
}

function formatErrorMessage(error) {
  const message = String(
    error?.message ||
    "Erro desconhecido."
  );

  const lowerMessage =
    message.toLowerCase();

  if (
    lowerMessage.includes(
      "anonymous sign-ins are disabled"
    )
  ) {
    return "O login anônimo não está ativado.";
  }

  if (
    lowerMessage.includes(
      "invalid api key"
    )
  ) {
    return "A chave pública do Supabase está incorreta.";
  }

  if (
    lowerMessage.includes(
      "failed to fetch"
    )
  ) {
    return "Não foi possível alcançar o Supabase.";
  }

  if (
    lowerMessage.includes(
      "function"
    ) &&
    lowerMessage.includes(
      "schema cache"
    )
  ) {
    return (
      "Uma função do Runtime ainda não foi reconhecida pelo Supabase."
    );
  }

  return message;
}

/* ==========================================================
   UTILIDADES
   ========================================================== */

function wait(milliseconds) {
  return new Promise(resolve => {
    window.setTimeout(
      resolve,
      milliseconds
    );
  });
}
