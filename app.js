"use strict";

/* ==========================================================
   CONFIGURAÇÕES FIXAS
   ========================================================== */

const GAME_SLUG = "artist-valley-adventure";

const DEFAULT_FALLBACK =
  "Não parece possível fazer isso agora.";

const DEFAULT_HELP =
  "Tente observar, examinar ou interagir com elementos da Cena.";

const DEFAULT_INVENTORY_EMPTY =
  "Você não possui nenhum item.";

const DEFAULT_MAP_EMPTY =
  "Nenhum local foi descoberto.";

const SECRET_ROUTE_ANIMATION_MS = 1250;


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

  history: [],
  lastResult: null,

  isProcessing: false,
  isOnline: navigator.onLine
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
  try {
    cacheElements();
    configureInterfaceEvents();
    validateConfiguration();

    setConnectionState(
      navigator.onLine
        ? "connecting"
        : "offline"
    );

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

    setConnectionState("online");
    revealApplication();
    focusCommandInput();
  } catch (error) {
    console.error(
      "Erro ao iniciar o jogo:",
      error
    );

    setConnectionState("error");
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

  elements.connectionLight =
    document.getElementById("connection-light");

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

  elements.commandModalPanel =
    elements.commandModal?.querySelector(
      ".modal__panel"
    ) || null;


  elements.inventoryModal =
    document.getElementById("inventory-modal");

  elements.inventoryModalPanel =
    elements.inventoryModal?.querySelector(".modal__panel") || null;

  elements.inventorySummary =
    document.getElementById("inventory-summary");

  elements.inventoryGrid =
    document.getElementById("inventory-grid");

  elements.historyModal =
    document.getElementById("history-modal");

  elements.historyModalPanel =
    elements.historyModal?.querySelector(".modal__panel") || null;

  elements.historyList =
    document.getElementById("history-list");

  elements.mapModal =
    document.getElementById("map-modal");

  elements.mapModalPanel =
    elements.mapModal?.querySelector(".modal__panel") || null;

  elements.mapInterfaceMessage =
    document.getElementById("map-interface-message");

  elements.mapStage =
    document.getElementById("map-stage");

  elements.mapLines =
    document.getElementById("map-lines");

  elements.mapNodes =
    document.getElementById("map-nodes");

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
    handleGlobalKeydown
  );


  [
    elements.inventoryModal,
    elements.historyModal,
    elements.mapModal
  ].forEach(modal => {
    modal.addEventListener(
      "click",
      handleInterfaceModalClick
    );
  });

  elements.mapNodes.addEventListener(
    "click",
    handleMapNodeClick
  );



  window.addEventListener(
    "online",
    handleConnectionRecovered
  );

  window.addEventListener(
    "offline",
    handleConnectionLost
  );

  document.addEventListener(
    "visibilitychange",
    handleVisibilityChange
  );
}

function handleGlobalKeydown(event) {
  if (event.key === "Escape") {
    closeCommandModal();
    closeInterfaceModals();
    return;
  }

  if (
    event.key === "/" &&
    document.activeElement !== elements.commandInput &&
    !isCommandModalOpen()
  ) {
    event.preventDefault();
    focusCommandInput();
  }
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
  if (state.isProcessing) {
    return;
  }

  elements.commandModal.classList.remove(
    "is-hidden"
  );

  elements.commandModal.setAttribute(
    "aria-hidden",
    "false"
  );

  elements.menuButton.setAttribute(
    "aria-expanded",
    "true"
  );

  document.body.classList.add(
    "is-modal-open"
  );

  window.setTimeout(() => {
    elements.commandModalPanel.focus();
  }, 20);
}

function closeCommandModal() {
  if (isCommandModalOpen()) {
    elements.commandModal.classList.add(
      "is-hidden"
    );

    elements.commandModal.setAttribute(
      "aria-hidden",
      "true"
    );

    elements.menuButton.setAttribute(
      "aria-expanded",
      "false"
    );

    document.body.classList.remove(
      "is-modal-open"
    );

    focusCommandInput();
  }
}

function isCommandModalOpen() {
  return !elements.commandModal.classList.contains(
    "is-hidden"
  );
}

function handleConnectionLost() {
  state.isOnline = false;
  setConnectionState("offline");

  showSystemMessage(
    "CONEXÃO INTERROMPIDA.\n\nO arquivo será retomado quando a internet voltar.",
    "error"
  );
}

async function handleConnectionRecovered() {
  state.isOnline = true;
  setConnectionState("connecting");

  try {
    if (state.session?.id) {
      const runtime =
        await loadRuntime(state.session.id);

      applyRuntime(runtime);
    }

    setConnectionState("online");

    showSystemMessage(
      "CONEXÃO RESTABELECIDA.",
      "response"
    );
  } catch (error) {
    console.error(
      "Erro ao recuperar conexão:",
      error
    );

    setConnectionState("error");
  }
}

async function handleVisibilityChange() {
  if (
    document.visibilityState !== "visible" ||
    state.isProcessing ||
    !state.session?.id ||
    !navigator.onLine
  ) {
    return;
  }

  try {
    const runtime =
      await loadRuntime(state.session.id);

    applyRuntime(runtime);
    setConnectionState("online");
  } catch (error) {
    console.warn(
      "Não foi possível atualizar o Runtime ao retornar para a página:",
      error
    );
  }
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
      },

      global: {
        headers: {
          "x-application-name":
            "artist-valley-adventure"
        }
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

async function refreshRuntime() {
  if (!state.session?.id) {
    return null;
  }

  const runtime =
    await loadRuntime(state.session.id);

  applyRuntime(runtime);

  return runtime;
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
    normalizeArray(runtime?.inventory);

  state.flags =
    normalizeArray(runtime?.flags);

  state.routes =
    normalizeArray(runtime?.routes);

  state.secrets =
    normalizeArray(runtime?.secrets);

  state.history =
    normalizeArray(runtime?.history);

  state.map =
    normalizeMap(runtime?.map);

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
    normalizeArray(sceneRuntime.blocks);

  applyCurrentTheme();
  applyRuntimeSettings();
  updatePermanentInterface();
  renderCurrentScene();
}

function normalizeArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}

function normalizeCommandText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9\s_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getRequestedInterface(
  requestedCommand,
  result = {}
) {
  const command =
    normalizeCommandText(requestedCommand);

  const resultType =
    normalizeCommandText(result.type);

  if (
    command === "inventario" ||
    resultType === "inventory" ||
    resultType === "inventory unavailable"
  ) {
    return "inventory";
  }

  if (
    command === "historico" ||
    resultType === "history" ||
    resultType === "history unavailable"
  ) {
    return "history";
  }

  if (
    command === "mapa" ||
    resultType === "map" ||
    resultType === "map unavailable"
  ) {
    return "map";
  }

  return null;
}

function normalizeMap(value) {
  return {
    current_location_id:
      value?.current_location_id || null,

    locations:
      normalizeArray(value?.locations),

    connections:
      normalizeArray(value?.connections)
  };
}

function applyRuntimeSettings() {
  const maximumLength =
    clampNumber(
      state.settings?.max_input_length,
      1,
      2000,
      300
    );

  elements.commandInput.maxLength =
    maximumLength;

  updateCommandMenuAvailability();
}

function updateCommandMenuAvailability() {
  const commandButtons =
    elements.commandModal.querySelectorAll(
      "[data-command]"
    );

  commandButtons.forEach(button => {
    const command =
      String(
        button.dataset.command || ""
      ).toLocaleLowerCase("pt-BR");

    let enabled = true;

    if (command === "inventario") {
      enabled =
        state.settings?.enable_inventory !== false &&
        state.scene?.allow_inventory !== false;
    }

    if (command === "historico") {
      enabled =
        state.settings?.enable_history !== false &&
        state.scene?.allow_history !== false;
    }

    if (command === "mapa") {
      enabled =
        state.settings?.enable_map !== false &&
        state.scene?.allow_map !== false;
    }

    if (command === "repetir") {
      enabled =
        state.scene?.allow_repeat !== false;
    }

    button.disabled = !enabled;
    button.setAttribute(
      "aria-disabled",
      String(!enabled)
    );
  });
}


/* ==========================================================
   ENVIO DE COMANDOS
   ========================================================== */

async function handleCommandSubmit(event) {
  event.preventDefault();

  if (state.isProcessing) {
    return;
  }

  if (!navigator.onLine) {
    showSystemMessage(
      "SEM CONEXÃO.\n\nAguarde a internet voltar para continuar.",
      "error"
    );

    return;
  }

  const originalInput =
    elements.commandInput.value.trim();

  if (!originalInput) {
    focusCommandInput();
    return;
  }

  const maximumLength =
    elements.commandInput.maxLength || 300;

  if (originalInput.length > maximumLength) {
    showSystemMessage(
      `O COMANDO É LONGO DEMAIS.\n\nUse no máximo ${maximumLength} caracteres.`,
      "error"
    );

    return;
  }

  elements.commandInput.value = "";

  setProcessing(true);
  clearSystemMessage();
  setConnectionState("processing");

  try {
    const previousRouteId =
      state.route?.id || null;

    const previousSceneId =
      state.scene?.id || null;

    const result =
      await processInput(originalInput);

    state.lastResult = result;

    await handleRuntimeResult(
      result,
      {
        previousRouteId,
        previousSceneId,
        requestedCommand:
          normalizeCommandText(originalInput)
      }
    );

    setConnectionState("online");
  } catch (error) {
    console.error(
      "Erro ao processar comando:",
      error
    );

    setConnectionState("error");

    showSystemMessage(
      `ERRO: ${formatErrorMessage(error)}`,
      "error"
    );
  } finally {
    setProcessing(false);
    focusCommandInput();
  }
}

async function handleRuntimeResult(
  result,
  previousState = {}
) {
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

  const runtime =
    result.runtime ||
    result.game_runtime ||
    null;

  if (runtime) {
    applyRuntime(runtime);
  } else if (
    result.success !== false &&
    shouldRefreshRuntime(result)
  ) {
    await refreshRuntime();
  }

  await handleRouteTransitionAnimation(
    previousState.previousRouteId,
    state.route?.id || null,
    result
  );

  const requestedInterface =
    getRequestedInterface(
      previousState.requestedCommand,
      result
    );

  if (requestedInterface) {
    if (
      result.success === false ||
      String(result.type || "").endsWith(
        "_unavailable"
      )
    ) {
      showSystemMessage(
        result.message ||
        "Esta interface não está disponível nesta Cena.",
        "error"
      );

      return;
    }

    if (requestedInterface === "inventory") {
      renderInventoryInterface(result);
      return;
    }

    if (requestedInterface === "history") {
      renderHistoryInterface(result);
      return;
    }

    if (requestedInterface === "map") {
      renderMapInterface(result);
      return;
    }
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
      renderInventoryInterface(result);
      return;

    case "history":
    case "history_unavailable":
      renderHistoryInterface(result);
      return;

    case "map":
    case "map_unavailable":
      renderMapInterface(result);
      return;

    case "help":
      renderHelpResult(result);
      return;

    case "secret":
    case "secret_code":
    case "secret_discovered":
      renderSecretResult(result);
      return;

    case "story_reset":
    case "progress_reset":
      renderResetResult(result);
      return;

    default:
      break;
  }

  const composedMessage =
    composeResultMessage(result);

  const messageType =
    getResultMessageType(result);

  showSystemMessage(
    composedMessage,
    messageType
  );
}

function shouldRefreshRuntime(result) {
  return Boolean(
    result.scene_changed ||
    result.route_changed ||
    result.inventory_changed ||
    result.flags_changed ||
    result.map_changed ||
    result.secret_discovered ||
    result.progress_reset ||
    result.effects_applied ||
    result.type === "response" ||
    result.type === "secret_code"
  );
}

function composeResultMessage(result) {
  const messages = [];

  if (result.message) {
    messages.push(String(result.message));
  }

  const eventMessages =
    collectEventMessages(result);

  messages.push(...eventMessages);

  if (messages.length === 0) {
    messages.push(
      state.settings?.default_fallback_text ||
      state.game?.default_fallback_text ||
      DEFAULT_FALLBACK
    );
  }

  return uniqueNonEmptyStrings(
    messages
  ).join("\n\n");
}

function collectEventMessages(result) {
  const messages = [];

  const arrays = [
    result.events,
    result.effects,
    result.notifications,
    result.messages
  ];

  arrays.forEach(collection => {
    normalizeArray(collection).forEach(entry => {
      if (typeof entry === "string") {
        messages.push(entry);
        return;
      }

      if (!entry || typeof entry !== "object") {
        return;
      }

      const text =
        entry.message ||
        entry.text ||
        entry.display_text ||
        entry.description ||
        null;

      if (text) {
        messages.push(String(text));
      }
    });
  });

  const directFields = [
    "item_message",
    "flag_message",
    "secret_message",
    "map_message",
    "route_message",
    "scene_message"
  ];

  directFields.forEach(field => {
    if (result[field]) {
      messages.push(
        String(result[field])
      );
    }
  });

  return messages;
}

function uniqueNonEmptyStrings(values) {
  return [...new Set(
    values
      .map(value => String(value || "").trim())
      .filter(Boolean)
  )];
}

function getResultMessageType(result) {
  if (
    result.success === false ||
    result.type === "unrecognized" ||
    result.type === "blocked" ||
    result.type === "input_too_long" ||
    result.type === "error"
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
    normalizeArray(
      result.inventory?.length
        ? result.inventory
        : state.inventory
    );

  if (inventory.length === 0) {
    showSystemMessage(
      result.message ||
      state.settings?.inventory_empty_text ||
      DEFAULT_INVENTORY_EMPTY,
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

    const typeText =
      item.item_type
        ? ` [${String(item.item_type).toLocaleUpperCase("pt-BR")}]`
        : "";

    const description =
      item.description
        ? `\n  ${item.description}`
        : "";

    return (
      `— ${item.name || item.item_key || "ITEM"}` +
      `${quantityText}${typeText}${description}`
    );
  });

  showSystemMessage(
    `INVENTÁRIO\n\n${lines.join("\n\n")}`,
    "response"
  );
}

function renderHistoryResult(result) {
  const history =
    normalizeArray(
      result.history?.length
        ? result.history
        : state.history
    );

  if (history.length === 0) {
    showSystemMessage(
      result.message ||
      "Nenhum acontecimento foi registrado.",
      result.success === false
        ? "error"
        : "response"
    );

    return;
  }

  const historyLimit =
    clampNumber(
      state.settings?.history_limit,
      1,
      200,
      20
    );

  const lines = history
    .slice(0, historyLimit)
    .map(formatHistoryEntry)
    .filter(Boolean);

  showSystemMessage(
    `HISTÓRICO\n\n${lines.join("\n")}`,
    "response"
  );
}

function formatHistoryEntry(entry) {
  const entryType =
    entry.entry_type ||
    entry.event_type ||
    entry.type ||
    "";

  const displayedText =
    entry.displayed_text ||
    entry.message ||
    entry.text ||
    "";

  switch (entryType) {
    case "action":
      return entry.player_input
        ? `> ${entry.player_input}`
        : null;

    case "scene":
      return displayedText
        ? `— Cena: ${displayedText}`
        : null;

    case "item":
      return displayedText
        ? `— Item: ${displayedText}`
        : null;

    case "flag":
      return displayedText
        ? `— Estado: ${displayedText}`
        : null;

    case "route":
      return displayedText
        ? `— Rota: ${displayedText}`
        : null;

    case "secret":
      return displayedText
        ? `— Segredo: ${displayedText}`
        : null;

    case "map":
      return displayedText
        ? `— Mapa: ${displayedText}`
        : null;

    case "error":
      return null;

    default:
      return displayedText
        ? `— ${displayedText}`
        : null;
  }
}

function renderMapResult(result) {
  const mapData =
    normalizeMap(
      result.map || state.map
    );

  const locations =
    mapData.locations.filter(location => {
      return (
        location.is_discovered !== false &&
        location.is_visible !== false
      );
    });

  if (locations.length === 0) {
    showSystemMessage(
      result.message ||
      state.settings?.map_empty_text ||
      DEFAULT_MAP_EMPTY,
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
      location.is_unlocked === false
        ? " [BLOQUEADO]"
        : "";

    const secretMarker =
      location.is_secret
        ? " [SECRETO]"
        : "";

    const description =
      location.description
        ? `\n  ${location.description}`
        : "";

    return (
      `— ${location.name || location.location_key || "LOCAL"}` +
      `${currentMarker}${lockedMarker}${secretMarker}` +
      `${description}`
    );
  });

  showSystemMessage(
    `MAPA\n\n${lines.join("\n\n")}`,
    "response"
  );
}

function renderHelpResult(result) {
  showSystemMessage(
    result.message ||
    state.scene?.help_text ||
    state.settings?.default_help_text ||
    DEFAULT_HELP,
    result.success === false
      ? "error"
      : "response"
  );
}

function renderSecretResult(result) {
  const title =
    result.secret?.name ||
    result.secret_name ||
    "SEGREDO DESCOBERTO";

  const description =
    result.message ||
    result.secret?.discovery_text ||
    result.secret?.description ||
    "";

  showSystemMessage(
    `${String(title).toLocaleUpperCase("pt-BR")}` +
    `${description ? `\n\n${description}` : ""}`,
    "response"
  );
}

function renderResetResult(result) {
  showSystemMessage(
    result.message ||
    "O PROGRESSO DA HISTÓRIA FOI REINICIADO.",
    "response"
  );
}



/* ==========================================================
   INTERFACES VISUAIS
   ========================================================== */

function handleInterfaceModalClick(event) {
  if (event.target.closest("[data-close-interface-modal]")) {
    closeInterfaceModals();
  }
}

function openInterfaceModal(modal, panel) {
  closeCommandModal();
  closeInterfaceModals(false);

  modal.classList.remove("is-hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-modal-open");

  window.setTimeout(() => {
    panel?.focus();
  }, 20);
}

function closeInterfaceModals(restoreFocus = true) {
  [
    elements.inventoryModal,
    elements.historyModal,
    elements.mapModal
  ].forEach(modal => {
    modal.classList.add("is-hidden");
    modal.setAttribute("aria-hidden", "true");
  });

  if (!isCommandModalOpen()) {
    document.body.classList.remove("is-modal-open");
  }

  if (restoreFocus) {
    focusCommandInput();
  }
}

function isInterfaceModalOpen() {
  return [
    elements.inventoryModal,
    elements.historyModal,
    elements.mapModal
  ].some(modal => !modal.classList.contains("is-hidden"));
}

function renderInventoryInterface(result = {}) {
  const inventory = normalizeArray(
    result.inventory?.length
      ? result.inventory
      : state.inventory
  );

  elements.inventoryGrid.replaceChildren();

  elements.inventorySummary.textContent =
    inventory.length === 1
      ? "1 ITEM CARREGADO"
      : `${inventory.length} ITENS CARREGADOS`;

  if (inventory.length === 0) {
    const empty = document.createElement("p");
    empty.className = "interface-empty";
    empty.textContent =
      result.message ||
      state.settings?.inventory_empty_text ||
      DEFAULT_INVENTORY_EMPTY;

    elements.inventoryGrid.appendChild(empty);
  } else {
    inventory.forEach(item => {
      const card = document.createElement("article");
      card.className = "inventory-card";

      const imageFrame = document.createElement("div");
      imageFrame.className = "inventory-card__image";

      if (item.image_url && isSafeMediaUrl(item.image_url)) {
        const image = document.createElement("img");
        image.src = item.image_url;
        image.alt = item.name || "Item";
        image.loading = "lazy";
        image.decoding = "async";
        imageFrame.appendChild(image);
      } else {
        const symbol = document.createElement("span");
        symbol.textContent = item.is_secret ? "?" : "◆";
        imageFrame.appendChild(symbol);
      }

      const content = document.createElement("div");
      content.className = "inventory-card__content";

      const heading = document.createElement("div");
      heading.className = "inventory-card__heading";

      const name = document.createElement("h3");
      name.textContent =
        item.name || item.item_key || "Item";

      const quantity = document.createElement("span");
      quantity.textContent =
        `×${Math.max(1, Number(item.quantity || 1))}`;

      heading.append(name, quantity);

      const type = document.createElement("p");
      type.className = "inventory-card__type";
      type.textContent =
        String(item.item_type || "item")
          .toLocaleUpperCase("pt-BR");

      const description = document.createElement("p");
      description.className = "inventory-card__description";
      description.textContent =
        item.description || "Sem descrição registrada.";

      content.append(heading, type, description);
      card.append(imageFrame, content);
      elements.inventoryGrid.appendChild(card);
    });
  }

  clearSystemMessage();
  openInterfaceModal(
    elements.inventoryModal,
    elements.inventoryModalPanel
  );
}

function isInterfaceHistoryEntry(entry) {
  const input = normalizeCommandText(
    entry.player_input || ""
  );

  return [
    "inventario",
    "historico",
    "mapa",
    "segredos",
    "finais"
  ].includes(input);
}

function getVisibleHistoryEntries(history) {
  return normalizeArray(history)
    .filter(entry => {
      const type =
        entry.entry_type ||
        entry.event_type ||
        entry.type ||
        "";

      if (type === "error") {
        return false;
      }

      if (type === "action" && isInterfaceHistoryEntry(entry)) {
        return false;
      }

      const text = normalizeCommandText(
        entry.displayed_text ||
        entry.message ||
        entry.text ||
        ""
      );

      if (
        text.includes("inventario aberto") ||
        text.includes("inventário aberto") ||
        text.includes("historico aberto") ||
        text.includes("histórico aberto") ||
        text.includes("mapa aberto")
      ) {
        return false;
      }

      return Boolean(formatHistoryEntry(entry));
    })
    .slice(0, 10);
}

function renderHistoryInterface(result = {}) {
  const history = normalizeArray(
    result.history?.length
      ? result.history
      : state.history
  );

  const visible = getVisibleHistoryEntries(history);

  elements.historyList.replaceChildren();

  if (visible.length === 0) {
    const empty = document.createElement("li");
    empty.className = "interface-empty";
    empty.textContent =
      result.message ||
      "Nenhum acontecimento relevante foi registrado.";

    elements.historyList.appendChild(empty);
  } else {
    visible.forEach((entry, index) => {
      const item = document.createElement("li");
      item.className = "history-entry";

      const number = document.createElement("span");
      number.className = "history-entry__number";
      number.textContent =
        String(visible.length - index).padStart(2, "0");

      const text = document.createElement("p");
      text.textContent =
        formatHistoryEntry(entry)
          ?.replace(/^—\s*/, "")
          .replace(/^>\s*/, "") || "";

      item.append(number, text);
      elements.historyList.appendChild(item);
    });
  }

  clearSystemMessage();
  openInterfaceModal(
    elements.historyModal,
    elements.historyModalPanel
  );
}

function getMapLocationById(id) {
  return state.map.locations.find(
    location => location.id === id
  ) || null;
}

function getVisibleMapLocations() {
  return state.map.locations.filter(location => {
    if (location.is_visible === false) {
      return false;
    }

    if (
      location.is_secret === true &&
      location.is_discovered === false
    ) {
      return false;
    }

    return (
      location.is_discovered !== false ||
      location.show_when_locked === true
    );
  });
}

function renderMapInterface(result = {}) {
  const mapData = normalizeMap(result.map || state.map);
  state.map = mapData;

  const locations = getVisibleMapLocations();

  elements.mapNodes.replaceChildren();
  elements.mapLines.replaceChildren();

  if (locations.length === 0) {
    elements.mapInterfaceMessage.textContent =
      result.message ||
      state.settings?.map_empty_text ||
      DEFAULT_MAP_EMPTY;
  } else {
    elements.mapInterfaceMessage.textContent =
      "SELECIONE UM LOCAL PARA CONSULTAR OU VIAJAR.";
  }

  const visibleIds = new Set(
    locations.map(location => location.id)
  );

  mapData.connections
    .filter(connection => {
      return (
        visibleIds.has(connection.from_location_id) &&
        visibleIds.has(connection.to_location_id) &&
        connection.is_visible !== false
      );
    })
    .forEach(connection => {
      const from = getMapLocationById(
        connection.from_location_id
      );
      const to = getMapLocationById(
        connection.to_location_id
      );

      if (!from || !to) {
        return;
      }

      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );

      line.setAttribute(
        "x1",
        String(Number(from.map_x ?? 50) * 10)
      );
      line.setAttribute(
        "y1",
        String(Number(from.map_y ?? 50) * 6)
      );
      line.setAttribute(
        "x2",
        String(Number(to.map_x ?? 50) * 10)
      );
      line.setAttribute(
        "y2",
        String(Number(to.map_y ?? 50) * 6)
      );

      const unlocked =
        connection.is_unlocked !== false;

      line.classList.add(
        unlocked
          ? "map-line--open"
          : "map-line--locked"
      );

      if (connection.is_secret) {
        line.classList.add("map-line--secret");
      }

      elements.mapLines.appendChild(line);
    });

  locations.forEach(location => {
    const current =
      location.id === mapData.current_location_id;

    const unlocked =
      location.is_unlocked !== false;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "map-node";
    button.dataset.locationId = location.id;
    button.style.left =
      `${Math.max(2, Math.min(98, Number(location.map_x ?? 50)))}%`;
    button.style.top =
      `${Math.max(4, Math.min(96, Number(location.map_y ?? 50)))}%`;

    if (current) {
      button.classList.add("is-current");
    }

    if (!unlocked) {
      button.classList.add("is-locked");
    }

    if (location.is_secret) {
      button.classList.add("is-secret");
    }

    const ascii = document.createElement("pre");
    ascii.className = "map-node__ascii";
    ascii.textContent =
      location.ascii_art ||
      location.ascii_symbol ||
      (current ? "[*]" : unlocked ? "[+]" : "[×]");

    const name = document.createElement("strong");
    name.textContent =
      location.name || location.location_key || "Local";

    const stateText = document.createElement("span");
    stateText.textContent =
      current
        ? "VOCÊ ESTÁ AQUI"
        : !unlocked
          ? "BLOQUEADO"
          : location.visited_count > 0
            ? "VISITADO"
            : "DESCOBERTO";

    button.append(ascii, name, stateText);
    button.title =
      location.description || name.textContent;

    elements.mapNodes.appendChild(button);
  });

  clearSystemMessage();
  openInterfaceModal(
    elements.mapModal,
    elements.mapModalPanel
  );
}

async function handleMapNodeClick(event) {
  const node = event.target.closest(
    "[data-location-id]"
  );

  if (!node || state.isProcessing) {
    return;
  }

  const location = getMapLocationById(
    node.dataset.locationId
  );

  if (!location) {
    return;
  }

  if (location.id === state.map.current_location_id) {
    elements.mapInterfaceMessage.textContent =
      location.description ||
      "Você já está neste Local.";
    return;
  }

  if (location.is_unlocked === false) {
    elements.mapInterfaceMessage.textContent =
      location.locked_text ||
      "Este Local continua bloqueado.";
    return;
  }

  const confirmed = window.confirm(
    `Viajar para "${location.name || location.location_key}"?`
  );

  if (!confirmed) {
    return;
  }

  await travelToMapLocation(location.id);
}

async function travelToMapLocation(locationId) {
  setProcessing(true);
  elements.mapInterfaceMessage.textContent =
    "VERIFICANDO CAMINHO...";

  try {
    const {
      data,
      error
    } = await state.client.rpc(
      "travel_to_map_location",
      {
        p_session_id: state.session.id,
        p_location_id: locationId
      }
    );

    if (error) {
      throw error;
    }

    if (data?.success === false) {
      elements.mapInterfaceMessage.textContent =
        data.message ||
        "Não é possível viajar para esse Local agora.";
      return;
    }

    if (data?.runtime) {
      applyRuntime(data.runtime);
    } else {
      await refreshRuntime();
    }

    closeInterfaceModals(false);

    showSystemMessage(
      data?.message ||
      "Você atravessa o caminho indicado no Mapa.",
      "response"
    );
  } catch (error) {
    console.error(
      "Erro ao viajar pelo Mapa:",
      error
    );

    elements.mapInterfaceMessage.textContent =
      `ERRO: ${formatErrorMessage(error)}`;
  } finally {
    setProcessing(false);
  }
}


/* ==========================================================
   TRANSIÇÕES ESPECIAIS
   ========================================================== */

async function handleRouteTransitionAnimation(
  previousRouteId,
  currentRouteId,
  result
) {
  const routeChanged =
    previousRouteId &&
    currentRouteId &&
    previousRouteId !== currentRouteId;

  const secretActivation =
    result.secret_route_activated === true ||
    result.route_secret_activated === true ||
    (
      routeChanged &&
      state.route?.is_secret === true
    );

  if (!secretActivation) {
    return;
  }

  document.body.classList.add(
    "secret-route-activated"
  );

  await wait(
    SECRET_ROUTE_ANIMATION_MS
  );

  document.body.classList.remove(
    "secret-route-activated"
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

  window.scrollTo({
    top: 0,
    behavior: prefersReducedMotion()
      ? "auto"
      : "smooth"
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
      if (!isSafeMediaUrl(block.media_url)) {
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
      image.decoding = "async";
      image.referrerPolicy = "no-referrer";

      if (
        block.block_type ===
        "pixel_art"
      ) {
        image.style.imageRendering =
          "pixelated";
      }

      image.addEventListener(
        "error",
        () => {
          element.remove();
        },
        { once: true }
      );

      element.appendChild(image);
      break;
    }

    case "divider":
      element =
        document.createElement("div");

      element.className =
        "scene-block scene-divider";

      element.setAttribute(
        "aria-hidden",
        "true"
      );
      break;

    case "audio":
      if (!isSafeMediaUrl(block.media_url)) {
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

  if (
    block.text_color &&
    isValidCssColor(block.text_color)
  ) {
    element.style.color =
      block.text_color;
  }

  if (
    block.animation_type &&
    block.animation_type !== "none"
  ) {
    element.classList.add(
      `animation-${sanitizeCssToken(
        block.animation_type
      )}`
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
    validThemeColor(
      route.primary_color,
      "#e8e8e8"
    )
  );

  root.style.setProperty(
    "--route-secondary",
    validThemeColor(
      route.secondary_color,
      "#8a8a8a"
    )
  );

  root.style.setProperty(
    "--route-background",
    validThemeColor(
      route.background_color,
      "#030303"
    )
  );

  root.style.setProperty(
    "--route-panel",
    validThemeColor(
      route.panel_color,
      "#0c0c0c"
    )
  );

  if (
    route.background_image_url &&
    isSafeMediaUrl(
      route.background_image_url
    )
  ) {
    const escapedUrl =
      String(route.background_image_url)
        .replace(/["\\\n\r]/g, "");

    document.body.style.backgroundImage =
      `url("${escapedUrl}")`;
  } else {
    document.body.style.backgroundImage =
      "";
  }

  const themeColorMeta =
    document.querySelector(
      'meta[name="theme-color"]'
    );

  if (themeColorMeta) {
    themeColorMeta.content =
      validThemeColor(
        route.background_color,
        "#030303"
      );
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

  elements.loadingScreen.setAttribute(
    "aria-busy",
    "false"
  );

  elements.application.classList.remove(
    "is-hidden"
  );
}


/* ==========================================================
   CONEXÃO, MENSAGENS E ESTADOS
   ========================================================== */

function setConnectionState(status) {
  elements.connectionLight.dataset.state =
    status;

  elements.connectionLight.title = {
    online: "Conectado",
    connecting: "Conectando",
    processing: "Processando",
    offline: "Sem conexão",
    error: "Erro de conexão"
  }[status] || status;
}

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

  elements.menuButton.disabled =
    isProcessing;

  elements.commandForm.setAttribute(
    "aria-busy",
    String(isProcessing)
  );

  elements.sendButton.textContent =
    isProcessing
      ? "PROCESSANDO..."
      : "ENVIAR";
}

function focusCommandInput() {
  window.setTimeout(() => {
    if (
      !state.isProcessing &&
      !isCommandModalOpen() &&
      !isInterfaceModalOpen()
    ) {
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

  if (
    lowerMessage.includes(
      "row-level security"
    )
  ) {
    return (
      "O Supabase bloqueou uma operação pelas regras de segurança."
    );
  }

  return message;
}


/* ==========================================================
   SEGURANÇA E UTILIDADES
   ========================================================== */

function isSafeMediaUrl(value) {
  if (!value) {
    return false;
  }

  try {
    const parsed =
      new URL(
        value,
        window.location.href
      );

    return [
      "https:",
      "http:"
    ].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function isValidCssColor(value) {
  if (!value) {
    return false;
  }

  return CSS.supports(
    "color",
    String(value)
  );
}

function validThemeColor(
  value,
  fallback
) {
  return isValidCssColor(value)
    ? value
    : fallback;
}

function sanitizeCssToken(value) {
  return String(value || "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9_-]/g, "");
}


function normalizeCommandText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clampNumber(
  value,
  minimum,
  maximum,
  fallback
) {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(
    Math.max(number, minimum),
    maximum
  );
}

function prefersReducedMotion() {
  return window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
}

function wait(milliseconds) {
  return new Promise(resolve => {
    window.setTimeout(
      resolve,
      milliseconds
    );
  });
}
