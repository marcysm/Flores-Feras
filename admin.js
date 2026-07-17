"use strict";

/* ==========================================================
   CONFIGURAÇÕES
   ========================================================== */

const GAME_SLUG = "artist-valley-adventure";

const MEDIA_BUCKET = "adventure-media";

const MEDIA_LIMITS = {
  image: 6 * 1024 * 1024,
  audio: 10 * 1024 * 1024
};

const ALLOWED_MEDIA_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4"
]);


/* ==========================================================
   ESTADO
   ========================================================== */

const state = {
  client: null,

  user: null,
  adminStatus: null,
  game: null,

  routes: [],
  scenes: [],
  filteredScenes: [],

  editingSceneId: null,
  actionsSceneId: null,

  blocksSceneId: null,
  blocks: [],
  editingBlockId: null,

 mediaLibrary: [],
filteredMedia: [],

responses: [],
filteredResponses: [],

editingResponseId: null,
actionsResponseId: null,

filteredRoutes: [],
editingRouteId: null,
actionsRouteId: null,

items: [],
filteredItems: [],
editingItemId: null,
actionsItemId: null,

flags: [],
secrets: [],
secretCodes: [],
mapLocations: [],
mapConnections: [],
progressRecords: [],
playerProfiles: [],
unrecognizedInputs: [],
historyEntries: [],
gameSettings: null,
validationResults: [],

editingFlagId: null,
editingSecretId: null,
editingSecretCodeId: null,
editingMapLocationId: null,
editingMapConnectionId: null,
selectedProgressId: null,
selectedUnrecognizedId: null,

testSession: null,
testRuntime: null,
ruleBuilderMode: "condition",
ruleBuilderConditions: [],
ruleBuilderEffects: [],
loadedDefinitiveSections: new Set(),

currentSection: "scenes",

isSaving: false,
isSavingBlock: false,
isSavingResponse: false,
isSavingRoute: false,
isSavingItem: false,
isUploadingMedia: false
};

const elements = {};


/* ==========================================================
   INICIALIZAÇÃO
   ========================================================== */

document.addEventListener(
  "DOMContentLoaded",
  initializeAdminPanel
);

async function initializeAdminPanel() {
  try {
    cacheElements();
    configureEvents();

    validateConfiguration();

    updateLoadingMessage(
      "VERIFICANDO SESSÃO ADMINISTRATIVA..."
    );

    state.client = createAdminClient();

    const session =
      await requireAdminSession();

    state.user = session.user;

    updateLoadingMessage(
      "CONFIRMANDO PERMISSÕES..."
    );

    state.adminStatus =
      await loadAdminStatus();

    updateLoadingMessage(
      "CARREGANDO JOGO..."
    );

    state.game = await loadGame();

    updateLoadingMessage(
      "CARREGANDO ROTAS E CENAS..."
    );

    await loadPanelData();

    displayAdminIdentity();
  populateRouteSelectors();
populateResponseSelectors();
populateRouteSceneSelector();
populateResponseItemSelectors();

applySceneFilters();
applyResponseFilters();
applyRouteFilters();
applyItemFilters();

initializeDefinitiveAdminModules();

showAdminSection("scenes");

revealPanel();
  } catch (error) {
    console.error(
      "Não foi possível abrir o painel:",
      error
    );

    await redirectToLogin();
  }
}


/* ==========================================================
   ELEMENTOS
   ========================================================== */

function cacheElements() {
  elements.loading =
    document.getElementById(
      "admin-loading"
    );

  elements.loadingMessage =
    document.getElementById(
      "admin-loading-message"
    );

  elements.application =
    document.getElementById(
      "admin-application"
    );

  elements.adminName =
    document.getElementById(
      "admin-name"
    );

  elements.adminEmail =
    document.getElementById(
      "admin-email"
    );

  elements.logoutButton =
    document.getElementById(
      "logout-button"
    );

  elements.newSceneButton =
    document.getElementById(
      "new-scene-button"
    );

  elements.sceneSearch =
    document.getElementById(
      "scene-search"
    );

  elements.routeFilter =
    document.getElementById(
      "route-filter"
    );

  elements.statusFilter =
    document.getElementById(
      "status-filter"
    );

  elements.sceneList =
    document.getElementById(
      "scene-list"
    );

  elements.sceneListMessage =
    document.getElementById(
      "scene-list-message"
    );

  elements.totalScenes =
    document.getElementById(
      "total-scenes"
    );

  elements.activeScenes =
    document.getElementById(
      "active-scenes"
    );

  elements.inactiveScenes =
    document.getElementById(
      "inactive-scenes"
    );

  elements.endingScenes =
    document.getElementById(
      "ending-scenes"
    );

  elements.sceneCardTemplate =
    document.getElementById(
      "scene-card-template"
    );

  elements.sceneModal =
    document.getElementById(
      "scene-modal"
    );

  elements.sceneModalTitle =
    document.getElementById(
      "scene-modal-title"
    );

  elements.sceneForm =
    document.getElementById(
      "scene-form"
    );

  elements.sceneId =
    document.getElementById(
      "scene-id"
    );

  elements.sceneTitle =
    document.getElementById(
      "scene-title"
    );

  elements.sceneKey =
    document.getElementById(
      "scene-key"
    );

  elements.sceneDescription =
    document.getElementById(
      "scene-description"
    );

  elements.sceneRoute =
    document.getElementById(
      "scene-route"
    );

  elements.sceneFallback =
    document.getElementById(
      "scene-fallback"
    );

  elements.sceneHelpMode =
    document.getElementById(
      "scene-help-mode"
    );

  elements.sceneHelpText =
    document.getElementById(
      "scene-help-text"
    );

  elements.helpTextField =
    document.getElementById(
      "help-text-field"
    );

  elements.allowRepeat =
    document.getElementById(
      "allow-repeat"
    );

  elements.allowInventory =
    document.getElementById(
      "allow-inventory"
    );

  elements.allowHistory =
    document.getElementById(
      "allow-history"
    );

  elements.allowMap =
    document.getElementById(
      "allow-map"
    );

  elements.sceneEnabled =
    document.getElementById(
      "scene-enabled"
    );

  elements.sceneEnding =
    document.getElementById(
      "scene-ending"
    );

  elements.endingTypeField =
    document.getElementById(
      "ending-type-field"
    );

  elements.sceneEndingType =
    document.getElementById(
      "scene-ending-type"
    );

  elements.sceneFormMessage =
    document.getElementById(
      "scene-form-message"
    );

  elements.saveSceneButton =
    document.getElementById(
      "save-scene-button"
    );

  elements.sceneActionsModal =
    document.getElementById(
      "scene-actions-modal"
    );

  elements.sceneActionsTitle =
    document.getElementById(
      "scene-actions-title"
    );

  elements.duplicateSceneButton =
    document.getElementById(
      "duplicate-scene-button"
    );

  elements.toggleSceneButton =
    document.getElementById(
      "toggle-scene-button"
    );

  elements.blocksModal =
    document.getElementById(
      "blocks-modal"
    );

  elements.blocksModalTitle =
    document.getElementById(
      "blocks-modal-title"
    );

  elements.blocksSceneIdentifier =
    document.getElementById(
      "blocks-scene-identifier"
    );

  elements.blocksTotal =
    document.getElementById(
      "blocks-total"
    );

  elements.blocksMessage =
    document.getElementById(
      "blocks-message"
    );

  elements.blocksList =
    document.getElementById(
      "blocks-list"
    );

  elements.newBlockButton =
    document.getElementById(
      "new-block-button"
    );

  elements.blockCardTemplate =
    document.getElementById(
      "block-card-template"
    );

  elements.blockFormModal =
    document.getElementById(
      "block-form-modal"
    );

  elements.blockFormTitle =
    document.getElementById(
      "block-form-title"
    );

  elements.blockForm =
    document.getElementById(
      "block-form"
    );

  elements.blockId =
    document.getElementById(
      "block-id"
    );

  elements.blockType =
    document.getElementById(
      "block-type"
    );

  elements.blockAnimation =
    document.getElementById(
      "block-animation"
    );

  elements.blockTextField =
    document.getElementById(
      "block-text-field"
    );

  elements.blockContent =
    document.getElementById(
      "block-content"
    );

  elements.blockContentHelp =
    document.getElementById(
      "block-content-help"
    );

  elements.blockMediaField =
    document.getElementById(
      "block-media-field"
    );

  elements.blockMediaUrl =
    document.getElementById(
      "block-media-url"
    );

  elements.blockAltField =
    document.getElementById(
      "block-alt-field"
    );

  elements.blockAltText =
    document.getElementById(
      "block-alt-text"
    );

  elements.blockAppearanceGroup =
    document.getElementById(
      "block-appearance-group"
    );

  elements.blockColorPicker =
    document.getElementById(
      "block-color-picker"
    );

  elements.blockTextColor =
    document.getElementById(
      "block-text-color"
    );

  elements.blockEnabled =
    document.getElementById(
      "block-enabled"
    );

  elements.blockPreview =
    document.getElementById(
      "block-preview"
    );

  elements.blockFormMessage =
    document.getElementById(
      "block-form-message"
    );

  elements.saveBlockButton =
    document.getElementById(
      "save-block-button"
    );

  elements.uploadMediaButton =
    document.getElementById(
      "upload-media-button"
    );

  elements.openMediaLibraryButton =
    document.getElementById(
      "open-media-library-button"
    );

  elements.mediaFileInput =
    document.getElementById(
      "media-file-input"
    );

  elements.mediaUploadStatus =
    document.getElementById(
      "media-upload-status"
    );

  elements.mediaUploadName =
    document.getElementById(
      "media-upload-name"
    );

  elements.mediaUploadPercentage =
    document.getElementById(
      "media-upload-percentage"
    );

  elements.mediaUploadProgress =
    document.getElementById(
      "media-upload-progress"
    );

  elements.mediaUploadMessage =
    document.getElementById(
      "media-upload-message"
    );

  elements.mediaLibraryModal =
    document.getElementById(
      "media-library-modal"
    );

  elements.mediaLibrarySearch =
    document.getElementById(
      "media-library-search"
    );

  elements.mediaLibraryType =
    document.getElementById(
      "media-library-type"
    );

  elements.mediaLibraryUploadButton =
    document.getElementById(
      "media-library-upload-button"
    );

  elements.mediaLibraryCount =
    document.getElementById(
      "media-library-count"
    );

  elements.mediaLibraryMessage =
    document.getElementById(
      "media-library-message"
    );

  elements.mediaLibraryList =
    document.getElementById(
      "media-library-list"
    );

  elements.mediaCardTemplate =
    document.getElementById(
      "media-card-template"
    );

  elements.navigationItems =
    document.querySelectorAll(
      ".admin-navigation__item[data-section]"
    );

  elements.scenesSection =
    document.getElementById(
      "scenes-section"
    );

  elements.responsesSection =
    document.getElementById(
      "responses-section"
    );

  elements.newResponseButton =
    document.getElementById(
      "new-response-button"
    );

  elements.totalResponses =
    document.getElementById(
      "total-responses"
    );

  elements.activeResponses =
    document.getElementById(
      "active-responses"
    );

  elements.inactiveResponses =
    document.getElementById(
      "inactive-responses"
    );

  elements.destinationResponses =
    document.getElementById(
      "destination-responses"
    );

  elements.responseSearch =
    document.getElementById(
      "response-search"
    );

  elements.responseSceneFilter =
    document.getElementById(
      "response-scene-filter"
    );

  elements.responseModeFilter =
    document.getElementById(
      "response-mode-filter"
    );

  elements.responseStatusFilter =
    document.getElementById(
      "response-status-filter"
    );

  elements.responseListMessage =
    document.getElementById(
      "response-list-message"
    );

  elements.responseList =
    document.getElementById(
      "response-list"
    );

  elements.responseCardTemplate =
    document.getElementById(
      "response-card-template"
    );

  elements.responseModal =
    document.getElementById(
      "response-modal"
    );

  elements.responseModalTitle =
    document.getElementById(
      "response-modal-title"
    );

  elements.responseForm =
    document.getElementById(
      "response-form"
    );

  elements.responseId =
    document.getElementById(
      "response-id"
    );

  elements.responseKey =
    document.getElementById(
      "response-key"
    );

  elements.responseSourceScene =
    document.getElementById(
      "response-source-scene"
    );

  elements.responseDescription =
    document.getElementById(
      "response-description"
    );

  elements.responseMatchMode =
    document.getElementById(
      "response-match-mode"
    );

  elements.exactPhraseField =
    document.getElementById(
      "exact-phrase-field"
    );

  elements.responseExactPhrase =
    document.getElementById(
      "response-exact-phrase"
    );

  elements.keywordFields =
    document.getElementById(
      "keyword-fields"
    );

  elements.responseRequiredWords =
    document.getElementById(
      "response-required-words"
    );

  elements.responseOptionalWords =
    document.getElementById(
      "response-optional-words"
    );

  elements.responseForbiddenWords =
    document.getElementById(
      "response-forbidden-words"
    );

  elements.responseSynonyms =
    document.getElementById(
      "response-synonyms"
    );

  elements.responseText =
    document.getElementById(
      "response-text"
    );

  elements.responseTargetScene =
    document.getElementById(
      "response-target-scene"
    );

  elements.responseTargetRoute =
    document.getElementById(
      "response-target-route"
    );

  elements.responseDestinationPreview =
    document.getElementById(
      "response-destination-preview"
    );

     /* ======================================================
     ITENS DENTRO DOS CAMINHOS
     ====================================================== */

  elements.responseRequiredItem =
    document.getElementById(
      "response-required-item"
    );

  elements.responseMissingItemField =
    document.getElementById(
      "response-missing-item-field"
    );

  elements.responseMissingItemText =
    document.getElementById(
      "response-missing-item-text"
    );

  elements.responseConsumeRequiredItemOption =
    document.getElementById(
      "response-consume-required-item-option"
    );

  elements.responseConsumeRequiredItem =
    document.getElementById(
      "response-consume-required-item"
    );

  elements.responseGiveItem =
    document.getElementById(
      "response-give-item"
    );

  elements.responseGiveItemQuantityField =
    document.getElementById(
      "response-give-item-quantity-field"
    );

  elements.responseGiveItemQuantity =
    document.getElementById(
      "response-give-item-quantity"
    );

  elements.responseRemoveItem =
    document.getElementById(
      "response-remove-item"
    );

  elements.responseRemoveItemQuantityField =
    document.getElementById(
      "response-remove-item-quantity-field"
    );

  elements.responseRemoveItemQuantity =
    document.getElementById(
      "response-remove-item-quantity"
    );
   
  elements.responsePriority =
    document.getElementById(
      "response-priority"
    );

  elements.responseEnabled =
    document.getElementById(
      "response-enabled"
    );

  elements.responseTestInput =
    document.getElementById(
      "response-test-input"
    );

  elements.responseTestResult =
    document.getElementById(
      "response-test-result"
    );

  elements.responseFormMessage =
    document.getElementById(
      "response-form-message"
    );

  elements.saveResponseButton =
    document.getElementById(
      "save-response-button"
    );

  elements.responseActionsModal =
    document.getElementById(
      "response-actions-modal"
    );

  elements.responseActionsTitle =
    document.getElementById(
      "response-actions-title"
    );

  elements.duplicateResponseButton =
    document.getElementById(
      "duplicate-response-button"
    );

  elements.toggleResponseButton =
    document.getElementById(
      "toggle-response-button"
    );

  elements.deleteResponseButton =
    document.getElementById(
      "delete-response-button"
    );

     /* ======================================================
     ELEMENTOS DO EDITOR DE ROTAS
     ====================================================== */

  elements.routesSection =
    document.getElementById(
      "routes-section"
    );

  elements.newRouteButton =
    document.getElementById(
      "new-route-button"
    );

  elements.totalRoutes =
    document.getElementById(
      "total-routes"
    );

  elements.activeRoutes =
    document.getElementById(
      "active-routes"
    );

  elements.secretRoutes =
    document.getElementById(
      "secret-routes"
    );

  elements.initialRoutes =
    document.getElementById(
      "initial-routes"
    );

  elements.routeSearch =
    document.getElementById(
      "route-search"
    );

  elements.routeStatusFilter =
    document.getElementById(
      "route-status-filter"
    );

  elements.routeListMessage =
    document.getElementById(
      "route-list-message"
    );

  elements.routeList =
    document.getElementById(
      "route-list"
    );

  elements.routeCardTemplate =
    document.getElementById(
      "route-card-template"
    );

  elements.routeModal =
    document.getElementById(
      "route-modal"
    );

  elements.routeModalTitle =
    document.getElementById(
      "route-modal-title"
    );

  elements.routeForm =
    document.getElementById(
      "route-form"
    );

  elements.routeId =
    document.getElementById(
      "route-id"
    );

  elements.routeName =
    document.getElementById(
      "route-name"
    );

  elements.routeCode =
    document.getElementById(
      "route-code"
    );

  elements.routeDescription =
    document.getElementById(
      "route-description"
    );

  elements.routeAdminDescription =
    document.getElementById(
      "route-admin-description"
    );

  elements.routeStartScene =
    document.getElementById(
      "route-start-scene"
    );

  elements.routeDisplayOrder =
    document.getElementById(
      "route-display-order"
    );

  elements.routePrimaryPicker =
    document.getElementById(
      "route-primary-picker"
    );

  elements.routePrimaryColor =
    document.getElementById(
      "route-primary-color"
    );

  elements.routeSecondaryPicker =
    document.getElementById(
      "route-secondary-picker"
    );

  elements.routeSecondaryColor =
    document.getElementById(
      "route-secondary-color"
    );

  elements.routeBackgroundPicker =
    document.getElementById(
      "route-background-picker"
    );

  elements.routeBackgroundColor =
    document.getElementById(
      "route-background-color"
    );

  elements.routePanelPicker =
    document.getElementById(
      "route-panel-picker"
    );

  elements.routePanelColor =
    document.getElementById(
      "route-panel-color"
    );

  elements.routeBackgroundImage =
    document.getElementById(
      "route-background-image"
    );

  elements.routePreview =
    document.getElementById(
      "route-preview"
    );

  elements.routePreviewName =
    document.getElementById(
      "route-preview-name"
    );

  elements.routeEnabled =
    document.getElementById(
      "route-enabled"
    );

  elements.routeSecret =
    document.getElementById(
      "route-secret"
    );

  elements.routeInitiallyAvailable =
    document.getElementById(
      "route-initially-available"
    );

  elements.routeFormMessage =
    document.getElementById(
      "route-form-message"
    );

  elements.saveRouteButton =
    document.getElementById(
      "save-route-button"
    );

  elements.routeActionsModal =
    document.getElementById(
      "route-actions-modal"
    );

  elements.routeActionsTitle =
    document.getElementById(
      "route-actions-title"
    );

  elements.duplicateRouteButton =
    document.getElementById(
      "duplicate-route-button"
    );

  elements.toggleRouteButton =
    document.getElementById(
      "toggle-route-button"
    );

  elements.deleteRouteButton =
    document.getElementById(
      "delete-route-button"
    );

  /* ======================================================
     ELEMENTOS DO EDITOR DE ITENS
     ====================================================== */

  elements.itemsSection =
    document.getElementById(
      "items-section"
    );

  elements.newItemButton =
    document.getElementById(
      "new-item-button"
    );

  elements.totalItems =
    document.getElementById(
      "total-items"
    );

  elements.activeItems =
    document.getElementById(
      "active-items"
    );

  elements.secretItems =
    document.getElementById(
      "secret-items"
    );

  elements.consumableItems =
    document.getElementById(
      "consumable-items"
    );

  elements.itemSearch =
    document.getElementById(
      "item-search"
    );

  elements.itemTypeFilter =
    document.getElementById(
      "item-type-filter"
    );

  elements.itemStatusFilter =
    document.getElementById(
      "item-status-filter"
    );

  elements.itemListMessage =
    document.getElementById(
      "item-list-message"
    );

  elements.itemList =
    document.getElementById(
      "item-list"
    );

  elements.itemCardTemplate =
    document.getElementById(
      "item-card-template"
    );

  elements.itemModal =
    document.getElementById(
      "item-modal"
    );

  elements.itemModalTitle =
    document.getElementById(
      "item-modal-title"
    );

  elements.itemForm =
    document.getElementById(
      "item-form"
    );

  elements.itemId =
    document.getElementById(
      "item-id"
    );

  elements.itemName =
    document.getElementById(
      "item-name"
    );

  elements.itemKey =
    document.getElementById(
      "item-key"
    );

  elements.itemType =
    document.getElementById(
      "item-type"
    );

  elements.itemDisplayOrder =
    document.getElementById(
      "item-display-order"
    );

  elements.itemDescription =
    document.getElementById(
      "item-description"
    );

  elements.itemAdminDescription =
    document.getElementById(
      "item-admin-description"
    );

  elements.itemImageUrl =
    document.getElementById(
      "item-image-url"
    );

  elements.itemImagePreview =
    document.getElementById(
      "item-image-preview"
    );

  elements.itemReceiveText =
    document.getElementById(
      "item-receive-text"
    );

  elements.itemUseText =
    document.getElementById(
      "item-use-text"
    );

  elements.itemMaximumQuantity =
    document.getElementById(
      "item-maximum-quantity"
    );

  elements.itemStackable =
    document.getElementById(
      "item-stackable"
    );

  elements.itemConsumable =
    document.getElementById(
      "item-consumable"
    );

  elements.itemEnabled =
    document.getElementById(
      "item-enabled"
    );

  elements.itemSecret =
    document.getElementById(
      "item-secret"
    );

  elements.itemFormMessage =
    document.getElementById(
      "item-form-message"
    );

  elements.saveItemButton =
    document.getElementById(
      "save-item-button"
    );

  elements.itemActionsModal =
    document.getElementById(
      "item-actions-modal"
    );

  elements.itemActionsTitle =
    document.getElementById(
      "item-actions-title"
    );

  elements.duplicateItemButton =
    document.getElementById(
      "duplicate-item-button"
    );

  elements.toggleItemButton =
    document.getElementById(
      "toggle-item-button"
    );

  elements.deleteItemButton =
    document.getElementById(
      "delete-item-button"
    );
   
  const missing =
    Object.entries(elements)
      .filter(([, element]) => !element)
      .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(
      `Elementos ausentes no HTML: ${missing.join(", ")}`
    );
  }
}


/* ==========================================================
   EVENTOS
   ========================================================== */

function configureEvents() {
  elements.logoutButton.addEventListener(
    "click",
    handleLogout
  );

  elements.newSceneButton.addEventListener(
    "click",
    openNewSceneModal
  );

  elements.sceneSearch.addEventListener(
    "input",
    applySceneFilters
  );

  elements.routeFilter.addEventListener(
    "change",
    applySceneFilters
  );

  elements.statusFilter.addEventListener(
    "change",
    applySceneFilters
  );

  elements.sceneList.addEventListener(
    "click",
    handleSceneListClick
  );

  elements.sceneForm.addEventListener(
    "submit",
    handleSceneFormSubmit
  );

  elements.sceneHelpMode.addEventListener(
    "change",
    updateHelpModeInterface
  );

  elements.sceneEnding.addEventListener(
    "change",
    updateEndingInterface
  );

  elements.sceneKey.addEventListener(
    "input",
    handleSceneKeyInput
  );

  elements.sceneModal.addEventListener(
    "click",
    handleSceneModalClick
  );

  elements.sceneActionsModal.addEventListener(
    "click",
    handleActionsModalClick
  );

  elements.duplicateSceneButton.addEventListener(
    "click",
    duplicateSelectedScene
  );

  elements.toggleSceneButton.addEventListener(
    "click",
    toggleSelectedScene
  );

  elements.newBlockButton.addEventListener(
    "click",
    openNewBlockModal
  );

  elements.blocksList.addEventListener(
    "click",
    handleBlocksListClick
  );

  elements.blocksModal.addEventListener(
    "click",
    handleBlocksModalClick
  );

  elements.blockFormModal.addEventListener(
    "click",
    handleBlockFormModalClick
  );

  elements.blockForm.addEventListener(
    "submit",
    handleBlockFormSubmit
  );

  elements.blockType.addEventListener(
    "change",
    updateBlockFormInterface
  );

  elements.blockAnimation.addEventListener(
    "change",
    renderBlockFormPreview
  );

  elements.blockContent.addEventListener(
    "input",
    renderBlockFormPreview
  );

  elements.blockMediaUrl.addEventListener(
    "input",
    renderBlockFormPreview
  );

  elements.blockAltText.addEventListener(
    "input",
    renderBlockFormPreview
  );

  elements.blockTextColor.addEventListener(
    "input",
    handleBlockTextColorInput
  );

  elements.blockColorPicker.addEventListener(
    "input",
    handleBlockColorPickerInput
  );

  elements.uploadMediaButton.addEventListener(
    "click",
    openMediaFileSelector
  );

  elements.openMediaLibraryButton.addEventListener(
    "click",
    openMediaLibrary
  );

  elements.mediaLibraryUploadButton.addEventListener(
    "click",
    openMediaFileSelector
  );

  elements.mediaFileInput.addEventListener(
    "change",
    handleMediaFileSelected
  );

  elements.mediaLibraryModal.addEventListener(
    "click",
    handleMediaLibraryModalClick
  );

  elements.mediaLibrarySearch.addEventListener(
    "input",
    applyMediaLibraryFilters
  );

  elements.mediaLibraryType.addEventListener(
    "change",
    applyMediaLibraryFilters
  );

  elements.mediaLibraryList.addEventListener(
    "click",
    handleMediaLibraryListClick
  );

document.addEventListener("keydown", event => {
  if (event.key !== "Escape") {
    return;
  }

  closeMediaLibrary();

  closeBlockFormModal();
  closeBlocksModal();

  closeResponseActionsModal();
  closeResponseModal();

    closeRouteActionsModal();
closeRouteModal();

closeItemActionsModal();
closeItemModal();

closeSceneModal();
  closeActionsModal();
});

   /*
  Conecta os botões da navegação superior
  às seções correspondentes do painel.
*/
elements.navigationItems.forEach(
  navigationItem => {
    navigationItem.addEventListener(
      "click",
      handleNavigationClick
    );
  }
);
   
  elements.newResponseButton.addEventListener(
    "click",
    openNewResponseModal
  );

  elements.responseSearch.addEventListener(
    "input",
    applyResponseFilters
  );

  elements.responseSceneFilter.addEventListener(
    "change",
    applyResponseFilters
  );

  elements.responseModeFilter.addEventListener(
    "change",
    applyResponseFilters
  );

  elements.responseStatusFilter.addEventListener(
    "change",
    applyResponseFilters
  );

  elements.responseList.addEventListener(
    "click",
    handleResponseListClick
  );

  elements.responseForm.addEventListener(
    "submit",
    handleResponseFormSubmit
  );

  elements.responseMatchMode.addEventListener(
    "change",
    updateResponseModeInterface
  );

  elements.responseTargetScene.addEventListener(
    "change",
    updateResponseDestinationPreview
  );

  elements.responseTargetRoute.addEventListener(
    "change",
    updateResponseDestinationPreview
  );

  /*
    Atualiza os campos relacionados ao Item exigido.
  */
  elements.responseRequiredItem.addEventListener(
    "change",
    updateResponseItemInterface
  );

  /*
    Atualiza quantidade e comportamento do Item entregue.
  */
  elements.responseGiveItem.addEventListener(
    "change",
    updateResponseItemInterface
  );

  /*
    Atualiza quantidade do Item removido.
  */
  elements.responseRemoveItem.addEventListener(
    "change",
    updateResponseItemInterface
  );
   
  elements.responseKey.addEventListener(
    "input",
    handleResponseKeyInput
  );

  elements.responseModal.addEventListener(
    "click",
    handleResponseModalClick
  );

  elements.responseActionsModal.addEventListener(
    "click",
    handleResponseActionsModalClick
  );

  elements.duplicateResponseButton.addEventListener(
    "click",
    duplicateSelectedResponse
  );

  elements.toggleResponseButton.addEventListener(
    "click",
    toggleSelectedResponse
  );

  elements.deleteResponseButton.addEventListener(
    "click",
    deleteSelectedResponse
  );

     /* ======================================================
     EVENTOS DO EDITOR DE ROTAS
     ====================================================== */

  elements.newRouteButton.addEventListener(
    "click",
    openNewRouteModal
  );

  elements.routeSearch.addEventListener(
    "input",
    applyRouteFilters
  );

  elements.routeStatusFilter.addEventListener(
    "change",
    applyRouteFilters
  );

  elements.routeList.addEventListener(
    "click",
    handleRouteListClick
  );

  elements.routeForm.addEventListener(
    "submit",
    handleRouteFormSubmit
  );

  elements.routeName.addEventListener(
    "input",
    handleRouteNameInput
  );

  elements.routeCode.addEventListener(
    "input",
    handleRouteCodeInput
  );

  elements.routeModal.addEventListener(
    "click",
    handleRouteModalClick
  );

  elements.routeActionsModal.addEventListener(
    "click",
    handleRouteActionsModalClick
  );

  elements.duplicateRouteButton.addEventListener(
    "click",
    duplicateSelectedRoute
  );

  elements.toggleRouteButton.addEventListener(
    "click",
    toggleSelectedRoute
  );

  elements.deleteRouteButton.addEventListener(
    "click",
    deleteSelectedRoute
  );

  configureRouteColorEvents();

  /* ======================================================
     EVENTOS DO EDITOR DE ITENS
     ====================================================== */

  elements.newItemButton.addEventListener(
    "click",
    openNewItemModal
  );

  elements.itemSearch.addEventListener(
    "input",
    applyItemFilters
  );

  elements.itemTypeFilter.addEventListener(
    "change",
    applyItemFilters
  );

  elements.itemStatusFilter.addEventListener(
    "change",
    applyItemFilters
  );

  elements.itemList.addEventListener(
    "click",
    handleItemListClick
  );

  elements.itemForm.addEventListener(
    "submit",
    handleItemFormSubmit
  );

  elements.itemName.addEventListener(
  "input",
  event => {
    handleItemNameInput(event);
    renderItemImagePreview();
  }
);

  elements.itemKey.addEventListener(
    "input",
    handleItemKeyInput
  );

  elements.itemImageUrl.addEventListener(
    "input",
    renderItemImagePreview
  );

  elements.itemStackable.addEventListener(
    "change",
    updateItemQuantityInterface
  );

  elements.itemModal.addEventListener(
    "click",
    handleItemModalClick
  );

  elements.itemActionsModal.addEventListener(
    "click",
    handleItemActionsModalClick
  );

  elements.duplicateItemButton.addEventListener(
    "click",
    duplicateSelectedItem
  );

  elements.toggleItemButton.addEventListener(
    "click",
    toggleSelectedItem
  );

  elements.deleteItemButton.addEventListener(
    "click",
    deleteSelectedItem
  );
   
  const responseTestEvents = [
    elements.responseTestInput,
    elements.responseExactPhrase,
    elements.responseRequiredWords,
    elements.responseOptionalWords,
    elements.responseForbiddenWords,
    elements.responseSynonyms
  ];

  responseTestEvents.forEach(element => {
    element.addEventListener(
      "input",
      testCurrentResponseRule
    );
  });
   
}

function handleEscapeKey(event) {
  if (event.key !== "Escape") {
    return;
  }

  if (
    !elements.mediaLibraryModal.classList.contains(
      "is-hidden"
    )
  ) {
    closeMediaLibrary();
    return;
  }

  if (
    !elements.blockFormModal.classList.contains(
      "is-hidden"
    )
  ) {
    closeBlockFormModal();
    return;
  }

  if (
    !elements.blocksModal.classList.contains(
      "is-hidden"
    )
  ) {
    closeBlocksModal();
    return;
  }

  if (
    !elements.sceneModal.classList.contains(
      "is-hidden"
    )
  ) {
    closeSceneModal();
    return;
  }

  if (
    !elements.sceneActionsModal.classList.contains(
      "is-hidden"
    )
  ) {
    closeActionsModal();
  }
}


/* ==========================================================
   CONFIGURAÇÃO E AUTENTICAÇÃO
   ========================================================== */

function validateConfiguration() {
  if (
    !window.supabase ||
    !window.APP_CONFIG
  ) {
    throw new Error(
      "Configuração do Supabase ausente."
    );
  }

  if (
    !window.APP_CONFIG.supabaseUrl ||
    !window.APP_CONFIG.supabasePublishableKey
  ) {
    throw new Error(
      "Endereço ou chave pública do Supabase ausente."
    );
  }
}

function createAdminClient() {
  return window.supabase.createClient(
    window.APP_CONFIG.supabaseUrl,
    window.APP_CONFIG.supabasePublishableKey,
    {
      auth: {
        storageKey:
          "artist-valley-admin-auth",

        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );
}

async function requireAdminSession() {
  const {
    data,
    error
  } = await state.client.auth.getSession();

  if (error) {
    throw error;
  }

  if (!data.session?.user) {
    throw new Error(
      "Nenhuma sessão administrativa encontrada."
    );
  }

  return data.session;
}

async function loadAdminStatus() {
  const {
    data,
    error
  } = await state.client.rpc(
    "get_admin_status"
  );

  if (error) {
    throw error;
  }

  if (!data?.is_admin) {
    throw new Error(
      "Esta conta não possui permissão administrativa."
    );
  }

  return data;
}

async function handleLogout() {
  elements.logoutButton.disabled = true;
  elements.logoutButton.textContent =
    "ENCERRANDO...";

  try {
    await state.client.auth.signOut();
  } finally {
    window.location.replace(
      "admin-login.html"
    );
  }
}

async function redirectToLogin() {
  try {
    if (state.client) {
      await state.client.auth.signOut();
    }
  } catch (error) {
    console.warn(
      "Não foi possível limpar a sessão:",
      error
    );
  }

  window.location.replace(
    "admin-login.html"
  );
}


/* ==========================================================
   CARREGAMENTO DOS DADOS
   ========================================================== */

async function loadGame() {
  const {
    data,
    error
  } = await state.client
    .from("games")
    .select(`
      id,
      slug,
      title,
      is_published
    `)
    .eq("slug", GAME_SLUG)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function loadPanelData() {
  const [
    routesResult,
    scenesResult,
    responsesResult,
    itemsResult
  ] = await Promise.all([
    /*
      1. Carrega todas as Rotas do jogo.
    */
    state.client
      .from("routes")
      .select(`
        id,
        game_id,
        code,
        name,
        description,
        admin_description,
        primary_color,
        secondary_color,
        background_color,
        panel_color,
        background_image_url,
        start_scene_id,
        is_secret,
        is_initially_available,
        is_enabled,
        display_order,
        created_at,
        updated_at
      `)
      .eq(
        "game_id",
        state.game.id
      )
      .order(
        "display_order",
        {
          ascending: true
        }
      ),

    /*
      2. Carrega todas as Cenas do jogo.
    */
    state.client
      .from("scenes")
      .select(`
        id,
        game_id,
        route_id,
        scene_key,
        title,
        admin_description,
        fallback_text,
        help_mode,
        help_text,
        allow_repeat,
        allow_inventory,
        allow_history,
        allow_map,
        is_ending,
        ending_type,
        is_enabled,
        created_at,
        updated_at
      `)
      .eq(
        "game_id",
        state.game.id
      )
      .order(
        "updated_at",
        {
          ascending: false
        }
      ),

    /*
      3. Carrega todos os Caminhos.
      Depois filtramos somente os que pertencem
      às cenas deste jogo.
    */
    state.client
      .from("scene_responses")
      .select(`
        id,
        scene_id,
        response_key,
        admin_description,
        match_mode,
        exact_phrase,
        required_words,
        optional_words,
        forbidden_words,
        synonyms,
        response_text,
        target_scene_id,
        target_route_id,
        condition_rules,
        effect_rules,
        priority,
        display_order,
        is_enabled,
        created_at,
        updated_at
      `)
      .order(
        "priority",
        {
          ascending: false
        }
      )
      .order(
        "display_order",
        {
          ascending: true
        }
      ),

    /*
      4. Carrega todos os Itens do jogo.
    */
    state.client
      .from("items")
      .select(`
        id,
        game_id,
        item_key,
        name,
        description,
        admin_description,
        item_type,
        image_url,
        receive_text,
        use_text,
        maximum_quantity,
        is_stackable,
        is_consumable,
        is_secret,
        is_enabled,
        display_order,
        created_at,
        updated_at
      `)
      .eq(
        "game_id",
        state.game.id
      )
      .order(
        "display_order",
        {
          ascending: true
        }
      )
      .order(
        "name",
        {
          ascending: true
        }
      )
  ]);

  /*
    Confere individualmente se alguma
    das quatro consultas falhou.
  */
  if (routesResult.error) {
    throw routesResult.error;
  }

  if (scenesResult.error) {
    throw scenesResult.error;
  }

  if (responsesResult.error) {
    throw responsesResult.error;
  }

  if (itemsResult.error) {
    throw itemsResult.error;
  }

  /*
    Salva Rotas e Cenas no estado do painel.
  */
  state.routes =
    routesResult.data || [];

  state.scenes =
    scenesResult.data || [];

  /*
    Cria uma lista com os IDs das cenas
    pertencentes ao jogo atual.
  */
  const gameSceneIds =
    new Set(
      state.scenes.map(
        scene => scene.id
      )
    );

  /*
    Mantém somente Caminhos ligados às
    cenas pertencentes ao jogo atual.
  */
  state.responses =
    (responsesResult.data || []).filter(
      response =>
        gameSceneIds.has(
          response.scene_id
        )
    );

  /*
    Salva os Itens no estado do painel.
  */
  state.items =
    itemsResult.data || [];
}


/* ==========================================================
   IDENTIDADE E EXIBIÇÃO INICIAL
   ========================================================== */

function displayAdminIdentity() {
  elements.adminName.textContent =
    state.adminStatus.display_name ||
    "Administrador";

  elements.adminEmail.textContent =
    state.user.email ||
    "E-mail não informado";
}

function revealPanel() {
  elements.loading.classList.add(
    "is-hidden"
  );

  elements.application.classList.remove(
    "is-hidden"
  );
}

function updateLoadingMessage(message) {
  elements.loadingMessage.textContent =
    message;
}


/* ==========================================================
   ROTAS
   ========================================================== */

function populateRouteSelectors() {
  elements.routeFilter
    .querySelectorAll(
      'option[data-dynamic-route="true"]'
    )
    .forEach(option => option.remove());

  elements.sceneRoute
    .querySelectorAll(
      'option[data-dynamic-route="true"]'
    )
    .forEach(option => option.remove());

  state.routes.forEach(route => {
    const optionText =
      route.is_secret
        ? `${route.name} — secreta`
        : route.name;

    const filterOption =
      document.createElement("option");

    filterOption.value = route.id;
    filterOption.textContent = optionText;
    filterOption.dataset.dynamicRoute =
      "true";

    elements.routeFilter.appendChild(
      filterOption
    );

    const formOption =
      document.createElement("option");

    formOption.value = route.id;
    formOption.textContent = optionText;
    formOption.dataset.dynamicRoute =
      "true";

    elements.sceneRoute.appendChild(
      formOption
    );
  });
}

function getRouteById(routeId) {
  return state.routes.find(
    route => route.id === routeId
  ) || null;
}


/* ==========================================================
   FILTROS DE CENAS
   ========================================================== */

function applySceneFilters() {
  const searchTerm = normalizeText(
    elements.sceneSearch.value
  );

  const routeValue =
    elements.routeFilter.value;

  const statusValue =
    elements.statusFilter.value;

  state.filteredScenes =
    state.scenes.filter(scene => {
      const searchableContent =
        normalizeText(
          [
            scene.title,
            scene.scene_key,
            scene.admin_description
          ]
            .filter(Boolean)
            .join(" ")
        );

      const matchesSearch =
        !searchTerm ||
        searchableContent.includes(
          searchTerm
        );

      let matchesRoute = true;

      if (routeValue === "none") {
        matchesRoute =
          !scene.route_id;
      } else if (routeValue) {
        matchesRoute =
          scene.route_id === routeValue;
      }

      let matchesStatus = true;

      switch (statusValue) {
        case "active":
          matchesStatus =
            scene.is_enabled === true;
          break;

        case "inactive":
          matchesStatus =
            scene.is_enabled === false;
          break;

        case "ending":
          matchesStatus =
            scene.is_ending === true;
          break;

        default:
          matchesStatus = true;
      }

      return (
        matchesSearch &&
        matchesRoute &&
        matchesStatus
      );
    });

  updateSceneStatistics();
  renderSceneList();
}

function updateSceneStatistics() {
  elements.totalScenes.textContent =
    String(state.scenes.length);

  elements.activeScenes.textContent =
    String(
      state.scenes.filter(
        scene => scene.is_enabled
      ).length
    );

  elements.inactiveScenes.textContent =
    String(
      state.scenes.filter(
        scene => !scene.is_enabled
      ).length
    );

  elements.endingScenes.textContent =
    String(
      state.scenes.filter(
        scene => scene.is_ending
      ).length
    );
}


/* ==========================================================
   LISTA DE CENAS
   ========================================================== */

function renderSceneList() {
  elements.sceneList.replaceChildren();

  if (
    state.filteredScenes.length === 0
  ) {
    const empty =
      document.createElement("div");

    empty.className =
      "scene-list__empty";

    empty.textContent =
      "Nenhuma cena corresponde aos filtros selecionados.";

    elements.sceneList.appendChild(
      empty
    );

    showSceneListMessage(
      "NENHUMA CENA ENCONTRADA."
    );

    return;
  }

  const fragment =
    document.createDocumentFragment();

  state.filteredScenes.forEach(scene => {
    fragment.appendChild(
      createSceneCard(scene)
    );
  });

  elements.sceneList.appendChild(
    fragment
  );

  showSceneListMessage(
    `${state.filteredScenes.length} CENA(S) EXIBIDA(S).`
  );
}

function createSceneCard(scene) {
  const fragment =
    elements.sceneCardTemplate.content
      .cloneNode(true);

  const card =
    fragment.querySelector(
      ".scene-card"
    );

  const title =
    fragment.querySelector(
      ".scene-card__title"
    );

  const identifier =
    fragment.querySelector(
      ".scene-card__identifier"
    );

  const routeLabel =
    fragment.querySelector(
      ".scene-card__route"
    );

  const description =
    fragment.querySelector(
      ".scene-card__description"
    );

  const helpMetadata =
    fragment.querySelector(
      '[data-scene-meta="help"]'
    );

  const commandsMetadata =
    fragment.querySelector(
      '[data-scene-meta="commands"]'
    );

  const endingMetadata =
    fragment.querySelector(
      '[data-scene-meta="ending"]'
    );

  const contentButton =
    fragment.querySelector(
      '[data-action="content"]'
    );

  const editButton =
    fragment.querySelector(
      '[data-action="edit"]'
    );

  const moreButton =
    fragment.querySelector(
      '[data-action="more"]'
    );

  card.dataset.sceneId = scene.id;

  card.classList.toggle(
    "is-inactive",
    !scene.is_enabled
  );

  card.classList.toggle(
    "is-ending",
    scene.is_ending
  );

  title.textContent =
    scene.title ||
    "Cena sem título";

  identifier.textContent =
    scene.scene_key;

  const route =
    getRouteById(scene.route_id);

  routeLabel.textContent =
    route
      ? route.name.toLocaleUpperCase(
          "pt-BR"
        )
      : "TODAS AS ROTAS";

  routeLabel.style.borderColor = "";
  routeLabel.style.color = "";

  if (route?.primary_color) {
    routeLabel.style.borderColor =
      route.primary_color;

    routeLabel.style.color =
      route.primary_color;
  }

  description.textContent =
    scene.admin_description ||
    "Nenhuma descrição administrativa.";

  helpMetadata.textContent =
    `AJUDA: ${formatHelpMode(
      scene.help_mode
    )}`;

  commandsMetadata.textContent =
    formatAllowedCommands(scene);

  endingMetadata.textContent =
    scene.is_ending
      ? `FINAL: ${formatEndingType(
          scene.ending_type
        )}`
      : "";

  contentButton.dataset.sceneId =
    scene.id;

  editButton.dataset.sceneId =
    scene.id;

  moreButton.dataset.sceneId =
    scene.id;

  return fragment;
}

function formatHelpMode(helpMode) {
  const names = {
    normal: "NORMAL",
    custom: "PERSONALIZADA",
    silent: "SEM RESPOSTA",
    disabled: "DESATIVADA"
  };

  return names[helpMode] ||
    helpMode;
}

function formatAllowedCommands(scene) {
  const commands = [];

  if (scene.allow_repeat) {
    commands.push("REPETIR");
  }

  if (scene.allow_inventory) {
    commands.push("INVENTÁRIO");
  }

  if (scene.allow_history) {
    commands.push("HISTÓRICO");
  }

  if (scene.allow_map) {
    commands.push("MAPA");
  }

  return commands.length > 0
    ? commands.join(" · ")
    : "SEM COMANDOS ADICIONAIS";
}

function formatEndingType(endingType) {
  const names = {
    victory: "VITÓRIA",
    defeat: "DERROTA",
    neutral: "NEUTRO",
    secret: "SECRETO"
  };

  return names[endingType] ||
    "NEUTRO";
}

function showSceneListMessage(
  message,
  type = ""
) {
  elements.sceneListMessage.className =
    "scene-list-message";

  if (type) {
    elements.sceneListMessage.classList.add(
      `is-${type}`
    );
  }

  elements.sceneListMessage.textContent =
    message || "";
}


/* ==========================================================
   CLIQUES DA LISTA DE CENAS
   ========================================================== */

function handleSceneListClick(event) {
  const button = event.target.closest(
    "[data-action]"
  );

  if (!button) {
    return;
  }

  const sceneId =
    button.dataset.sceneId;

  if (!sceneId) {
    return;
  }

  switch (button.dataset.action) {
    case "content":
      openBlocksModal(sceneId);
      break;

    case "edit":
      openEditSceneModal(sceneId);
      break;

    case "more":
      openActionsModal(sceneId);
      break;
  }
}


/* ==========================================================
   MODAL DA CENA
   ========================================================== */

function openNewSceneModal() {
  state.editingSceneId = null;

  resetSceneForm();

  elements.sceneModalTitle.textContent =
    "Nova cena";

  elements.sceneKey.disabled = false;

  openSceneModal();
}

function openEditSceneModal(sceneId) {
  const scene = state.scenes.find(
    item => item.id === sceneId
  );

  if (!scene) {
    showSceneListMessage(
      "A cena selecionada não foi encontrada.",
      "error"
    );

    return;
  }

  state.editingSceneId = scene.id;

  fillSceneForm(scene);

  elements.sceneModalTitle.textContent =
    scene.title ||
    "Editar cena";

  elements.sceneKey.disabled = true;

  openSceneModal();
}

function openSceneModal() {
  clearSceneFormMessage();

  elements.sceneModal.classList.remove(
    "is-hidden"
  );

  document.body.style.overflow =
    "hidden";

  window.setTimeout(() => {
    elements.sceneTitle.focus();
  }, 50);
}

function closeSceneModal() {
  if (state.isSaving) {
    return;
  }

  elements.sceneModal.classList.add(
    "is-hidden"
  );

  state.editingSceneId = null;

  updateBodyOverflow();
}

function handleSceneModalClick(event) {
  if (
    event.target.closest(
      "[data-close-scene-modal]"
    )
  ) {
    closeSceneModal();
  }
}

function resetSceneForm() {
  elements.sceneForm.reset();

  elements.sceneId.value = "";
  elements.sceneRoute.value = "";
  elements.sceneHelpMode.value =
    "normal";

  elements.allowRepeat.checked =
    true;

  elements.allowInventory.checked =
    true;

  elements.allowHistory.checked =
    true;

  elements.allowMap.checked =
    false;

  elements.sceneEnabled.checked =
    true;

  elements.sceneEnding.checked =
    false;

  elements.sceneEndingType.value =
    "neutral";

  elements.sceneKey.disabled =
    false;

  updateHelpModeInterface();
  updateEndingInterface();
  clearSceneFormMessage();
}

function fillSceneForm(scene) {
  elements.sceneId.value =
    scene.id;

  elements.sceneTitle.value =
    scene.title || "";

  elements.sceneKey.value =
    scene.scene_key || "";

  elements.sceneDescription.value =
    scene.admin_description || "";

  elements.sceneRoute.value =
    scene.route_id || "";

  elements.sceneFallback.value =
    scene.fallback_text || "";

  elements.sceneHelpMode.value =
    scene.help_mode || "normal";

  elements.sceneHelpText.value =
    scene.help_text || "";

  elements.allowRepeat.checked =
    scene.allow_repeat === true;

  elements.allowInventory.checked =
    scene.allow_inventory === true;

  elements.allowHistory.checked =
    scene.allow_history === true;

  elements.allowMap.checked =
    scene.allow_map === true;

  elements.sceneEnabled.checked =
    scene.is_enabled === true;

  elements.sceneEnding.checked =
    scene.is_ending === true;

  elements.sceneEndingType.value =
    scene.ending_type || "neutral";

  updateHelpModeInterface();
  updateEndingInterface();
  clearSceneFormMessage();
}


/* ==========================================================
   INTERFACE DO FORMULÁRIO DA CENA
   ========================================================== */

function updateHelpModeInterface() {
  const currentMode =
    elements.sceneHelpMode.value;

  const showTextField =
    currentMode === "normal" ||
    currentMode === "custom";

  elements.helpTextField.classList.toggle(
    "is-hidden",
    !showTextField
  );

  document
    .querySelectorAll(
      "[data-help-explanation]"
    )
    .forEach(paragraph => {
      paragraph.classList.toggle(
        "is-hidden",
        paragraph.dataset
          .helpExplanation !==
          currentMode
      );
    });
}

function updateEndingInterface() {
  elements.endingTypeField.classList.toggle(
    "is-hidden",
    !elements.sceneEnding.checked
  );
}

function handleSceneKeyInput() {
  if (elements.sceneKey.disabled) {
    return;
  }

  const normalizedKey =
    normalizeSceneKey(
      elements.sceneKey.value
    );

  if (
    normalizedKey !==
    elements.sceneKey.value
  ) {
    elements.sceneKey.value =
      normalizedKey;
  }
}

function normalizeSceneKey(value) {
  return String(value)
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}


/* ==========================================================
   SALVAR CENA
   ========================================================== */

async function handleSceneFormSubmit(event) {
  event.preventDefault();

  if (state.isSaving) {
    return;
  }

  const sceneData =
    collectSceneFormData();

  const validationError =
    validateSceneData(sceneData);

  if (validationError) {
    showSceneFormMessage(
      validationError,
      "error"
    );

    return;
  }

  setSceneSaving(true);

  showSceneFormMessage(
    "SALVANDO CENA..."
  );

  try {
    if (state.editingSceneId) {
      await updateScene(
        state.editingSceneId,
        sceneData
      );
    } else {
      await createScene(sceneData);
    }

    await refreshScenes();

    showSceneFormMessage(
      "CENA SALVA COM SUCESSO.",
      "success"
    );

    window.setTimeout(() => {
      closeSceneModal();
    }, 450);
  } catch (error) {
    console.error(
      "Erro ao salvar cena:",
      error
    );

    showSceneFormMessage(
      formatDatabaseError(error),
      "error"
    );
  } finally {
    setSceneSaving(false);
  }
}

function collectSceneFormData() {
  const isEnding =
    elements.sceneEnding.checked;

  const helpMode =
    elements.sceneHelpMode.value;

  return {
    game_id: state.game.id,

    route_id:
      elements.sceneRoute.value ||
      null,

    scene_key:
      normalizeSceneKey(
        elements.sceneKey.value
      ),

    title:
      emptyToNull(
        elements.sceneTitle.value
      ),

    admin_description:
      emptyToNull(
        elements.sceneDescription.value
      ),

    fallback_text:
      emptyToNull(
        elements.sceneFallback.value
      ),

    help_mode:
      helpMode,

    help_text:
      (
        helpMode === "normal" ||
        helpMode === "custom"
      )
        ? emptyToNull(
            elements.sceneHelpText.value
          )
        : null,

    allow_repeat:
      elements.allowRepeat.checked,

    allow_inventory:
      elements.allowInventory.checked,

    allow_history:
      elements.allowHistory.checked,

    allow_map:
      elements.allowMap.checked,

    is_ending:
      isEnding,

    ending_type:
      isEnding
        ? elements.sceneEndingType.value
        : null,

    is_enabled:
      elements.sceneEnabled.checked
  };
}

function validateSceneData(sceneData) {
  if (!sceneData.scene_key) {
    return (
      "Informe o identificador interno da cena."
    );
  }

  if (
    !/^[a-z0-9_]+$/.test(
      sceneData.scene_key
    )
  ) {
    return (
      "O identificador pode conter apenas letras minúsculas, " +
      "números e sublinhados."
    );
  }

  if (
    sceneData.help_mode === "custom" &&
    !sceneData.help_text
  ) {
    return (
      "Cadastre o texto da ajuda personalizada."
    );
  }

  return null;
}

async function createScene(sceneData) {
  const {
    data,
    error
  } = await state.client
    .from("scenes")
    .insert(sceneData)
    .select(`
      id,
      scene_key,
      title
    `)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function updateScene(
  sceneId,
  sceneData
) {
  const {
    game_id,
    scene_key,
    ...editableData
  } = sceneData;

  const {
    data,
    error
  } = await state.client
    .from("scenes")
    .update(editableData)
    .eq("id", sceneId)
    .eq(
      "game_id",
      state.game.id
    )
    .select(`
      id,
      scene_key,
      title
    `)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

function setSceneSaving(isSaving) {
  state.isSaving = isSaving;

  elements.sceneForm
    .querySelectorAll(
      "input, textarea, select, button"
    )
    .forEach(control => {
      control.disabled =
        isSaving;
    });

  if (!isSaving) {
    elements.sceneKey.disabled =
      Boolean(
        state.editingSceneId
      );
  }

  elements.saveSceneButton.textContent =
    isSaving
      ? "SALVANDO..."
      : "SALVAR CENA";
}

function showSceneFormMessage(
  message,
  type = ""
) {
  elements.sceneFormMessage.className =
    "form-message";

  if (type) {
    elements.sceneFormMessage.classList.add(
      `is-${type}`
    );
  }

  elements.sceneFormMessage.textContent =
    message || "";
}

function clearSceneFormMessage() {
  showSceneFormMessage("");
}

/* ==========================================================
   ATUALIZAR CENAS
   ========================================================== */

async function refreshScenes() {
  showSceneListMessage(
    "ATUALIZANDO CENAS..."
  );

  const {
    data,
    error
  } = await state.client
    .from("scenes")
    .select(`
      id,
      game_id,
      route_id,
      scene_key,
      title,
      admin_description,
      fallback_text,
      help_mode,
      help_text,
      allow_repeat,
      allow_inventory,
      allow_history,
      allow_map,
      is_ending,
      ending_type,
      is_enabled,
      created_at,
      updated_at
    `)
    .eq("game_id", state.game.id)
    .order("updated_at", {
      ascending: false
    });

  if (error) {
    throw error;
  }

  /*
    Atualiza a lista principal de cenas
    mantida pelo painel.
  */
  state.scenes =
    data || [];

  /*
    Atualiza todos os seletores que dependem
    das cenas cadastradas.
  */
  populateResponseSelectors();
  populateRouteSceneSelector();

  /*
    Atualiza a listagem visível da aba Cenas.
  */
  applySceneFilters();

  /*
    Atualiza também os cartões e filtros de Caminhos,
    pois eles exibem nomes de cenas de origem e destino.
  */
  applyResponseFilters();

  /*
    Atualiza as Rotas, pois elas podem usar
    uma cena como cena inicial.
  */
  applyRouteFilters();
}

/* ==========================================================
   MENU DE AÇÕES DA CENA
   ========================================================== */

function openActionsModal(sceneId) {
  const scene = state.scenes.find(
    item => item.id === sceneId
  );

  if (!scene) {
    return;
  }

  state.actionsSceneId =
    scene.id;

  elements.sceneActionsTitle.textContent =
    scene.title ||
    scene.scene_key;

  updateToggleSceneButton(scene);

  elements.sceneActionsModal.classList.remove(
    "is-hidden"
  );

  document.body.style.overflow =
    "hidden";
}

function closeActionsModal() {
  elements.sceneActionsModal.classList.add(
    "is-hidden"
  );

  state.actionsSceneId = null;

  updateBodyOverflow();
}

function handleActionsModalClick(event) {
  if (
    event.target.closest(
      "[data-close-actions-modal]"
    )
  ) {
    closeActionsModal();
  }
}

function updateToggleSceneButton(scene) {
  const strong =
    elements.toggleSceneButton.querySelector(
      "strong"
    );

  const description =
    elements.toggleSceneButton.querySelector(
      "span"
    );

  if (scene.is_enabled) {
    strong.textContent =
      "DESATIVAR CENA";

    description.textContent =
      "Impede temporariamente o uso da cena no jogo.";
  } else {
    strong.textContent =
      "ATIVAR CENA";

    description.textContent =
      "Torna a cena novamente disponível no jogo.";
  }
}


/* ==========================================================
   DUPLICAR CENA
   ========================================================== */

async function duplicateSelectedScene() {
  const sourceScene =
    state.scenes.find(
      scene =>
        scene.id ===
        state.actionsSceneId
    );

  if (!sourceScene) {
    return;
  }

  elements.duplicateSceneButton.disabled =
    true;

  try {
    const duplicatedKey =
      createAvailableDuplicateKey(
        sourceScene.scene_key
      );

    const duplicateData = {
      game_id:
        sourceScene.game_id,

      route_id:
        sourceScene.route_id,

      scene_key:
        duplicatedKey,

      title:
        sourceScene.title
          ? `${sourceScene.title} — Cópia`
          : "Cena duplicada",

      admin_description:
        sourceScene.admin_description,

      fallback_text:
        sourceScene.fallback_text,

      help_mode:
        sourceScene.help_mode,

      help_text:
        sourceScene.help_text,

      allow_repeat:
        sourceScene.allow_repeat,

      allow_inventory:
        sourceScene.allow_inventory,

      allow_history:
        sourceScene.allow_history,

      allow_map:
        sourceScene.allow_map,

      is_ending:
        sourceScene.is_ending,

      ending_type:
        sourceScene.ending_type,

      is_enabled:
        false
    };

    const duplicatedScene =
      await createScene(
        duplicateData
      );

    await refreshScenes();

    closeActionsModal();

    openEditSceneModal(
      duplicatedScene.id
    );
  } catch (error) {
    console.error(
      "Erro ao duplicar cena:",
      error
    );

    window.alert(
      formatDatabaseError(error)
    );
  } finally {
    elements.duplicateSceneButton.disabled =
      false;
  }
}

function createAvailableDuplicateKey(
  originalKey
) {
  let index = 1;

  let candidate =
    `${originalKey}_copia`;

  const existingKeys =
    new Set(
      state.scenes.map(
        scene =>
          scene.scene_key
      )
    );

  while (
    existingKeys.has(candidate)
  ) {
    index += 1;

    candidate =
      `${originalKey}_copia_${index}`;
  }

  return candidate;
}


/* ==========================================================
   ATIVAR OU DESATIVAR CENA
   ========================================================== */

async function toggleSelectedScene() {
  const scene =
    state.scenes.find(
      item =>
        item.id ===
        state.actionsSceneId
    );

  if (!scene) {
    return;
  }

  elements.toggleSceneButton.disabled =
    true;

  try {
    const {
      error
    } = await state.client
      .from("scenes")
      .update({
        is_enabled:
          !scene.is_enabled
      })
      .eq("id", scene.id)
      .eq(
        "game_id",
        state.game.id
      );

    if (error) {
      throw error;
    }

    await refreshScenes();

    closeActionsModal();
  } catch (error) {
    console.error(
      "Erro ao alterar estado da cena:",
      error
    );

    window.alert(
      formatDatabaseError(error)
    );
  } finally {
    elements.toggleSceneButton.disabled =
      false;
  }
}


/* ==========================================================
   EDITOR DE BLOCOS
   ========================================================== */

async function openBlocksModal(sceneId) {
  const scene =
    state.scenes.find(
      item =>
        item.id === sceneId
    );

  if (!scene) {
    showSceneListMessage(
      "A cena selecionada não foi encontrada.",
      "error"
    );

    return;
  }

  state.blocksSceneId =
    scene.id;

  state.blocks = [];
  state.editingBlockId = null;

  elements.blocksModalTitle.textContent =
    scene.title ||
    "Cena sem título";

  elements.blocksSceneIdentifier.textContent =
    scene.scene_key;

  elements.blocksTotal.textContent =
    "0 blocos";

  elements.blocksList.replaceChildren();

  elements.blocksModal.classList.remove(
    "is-hidden"
  );

  document.body.style.overflow =
    "hidden";

  try {
    await loadSceneBlocks();
  } catch (error) {
    console.error(
      "Erro ao carregar blocos:",
      error
    );

    showBlocksMessage(
      formatDatabaseError(error),
      "error"
    );
  }
}

function closeBlocksModal() {
  if (state.isSavingBlock) {
    return;
  }

  elements.mediaLibraryModal.classList.add(
    "is-hidden"
  );

  elements.blockFormModal.classList.add(
    "is-hidden"
  );

  elements.blocksModal.classList.add(
    "is-hidden"
  );

  state.blocksSceneId = null;
  state.blocks = [];
  state.editingBlockId = null;

  updateBodyOverflow();
}

function handleBlocksModalClick(event) {
  if (
    event.target.closest(
      "[data-close-blocks-modal]"
    )
  ) {
    closeBlocksModal();
  }
}

async function loadSceneBlocks() {
  const requestedSceneId =
    state.blocksSceneId;

  if (!requestedSceneId) {
    return;
  }

  showBlocksMessage(
    "CARREGANDO CONTEÚDO..."
  );

  const {
    data,
    error
  } = await state.client
    .from("scene_blocks")
    .select(`
      id,
      scene_id,
      block_type,
      content,
      media_url,
      alt_text,
      text_color,
      animation_type,
      display_order,
      is_enabled,
      created_at,
      updated_at
    `)
    .eq(
      "scene_id",
      requestedSceneId
    )
    .order(
      "display_order",
      {
        ascending: true
      }
    )
    .order(
      "created_at",
      {
        ascending: true
      }
    );

  if (
    requestedSceneId !==
    state.blocksSceneId
  ) {
    return;
  }

  if (error) {
    throw error;
  }

  state.blocks =
    data || [];

  renderBlocksList();
}

function renderBlocksList() {
  elements.blocksList.replaceChildren();

  const total =
    state.blocks.length;

  elements.blocksTotal.textContent =
    total === 1
      ? "1 bloco"
      : `${total} blocos`;

  if (total === 0) {
    const empty =
      document.createElement("div");

    empty.className =
      "blocks-list__empty";

    empty.textContent =
      "Esta cena ainda não possui conteúdo. " +
      "Clique em + NOVO BLOCO para começar.";

    elements.blocksList.appendChild(
      empty
    );

    showBlocksMessage(
      "NENHUM BLOCO CADASTRADO."
    );

    return;
  }

  const fragment =
    document.createDocumentFragment();

  state.blocks.forEach(
    (block, index) => {
      fragment.appendChild(
        createBlockCard(
          block,
          index
        )
      );
    }
  );

  elements.blocksList.appendChild(
    fragment
  );

  showBlocksMessage(
    "CONTEÚDO CARREGADO."
  );
}

function createBlockCard(
  block,
  index
) {
  const fragment =
    elements.blockCardTemplate.content
      .cloneNode(true);

  const card =
    fragment.querySelector(
      ".block-card"
    );

  const position =
    fragment.querySelector(
      ".block-card__position"
    );

  const type =
    fragment.querySelector(
      ".block-card__type"
    );

  const animation =
    fragment.querySelector(
      ".block-card__animation"
    );

  const status =
    fragment.querySelector(
      ".block-card__state"
    );

  const preview =
    fragment.querySelector(
      ".block-card__preview"
    );

  const buttons =
    fragment.querySelectorAll(
      "[data-block-action]"
    );

  card.dataset.blockId =
    block.id;

  card.classList.toggle(
    "is-inactive",
    !block.is_enabled
  );

  position.textContent =
    String(index + 1)
      .padStart(2, "0");

  type.textContent =
    formatBlockType(
      block.block_type
    );

  animation.textContent =
    formatBlockAnimation(
      block.animation_type
    );

  status.textContent =
    block.is_enabled
      ? "ATIVO"
      : "DESATIVADO";

  buttons.forEach(button => {
    button.dataset.blockId =
      block.id;

    if (
      button.dataset.blockAction ===
      "up"
    ) {
      button.disabled =
        index === 0;
    }

    if (
      button.dataset.blockAction ===
      "down"
    ) {
      button.disabled =
        index ===
        state.blocks.length - 1;
    }
  });

  renderBlockCardPreview(
    preview,
    block
  );

  return fragment;
}

function formatBlockType(blockType) {
  const names = {
    title: "TÍTULO",
    text: "TEXTO",
    system_message:
      "MENSAGEM DO SISTEMA",
    image: "IMAGEM",
    pixel_art: "PIXEL ART",
    ascii: "ASCII",
    divider: "DIVISOR",
    audio: "ÁUDIO"
  };

  return names[blockType] ||
    blockType;
}

function formatBlockAnimation(
  animation
) {
  const names = {
    none: "SEM ANIMAÇÃO",
    fade: "APARECER",
    typing: "DIGITAÇÃO",
    glitch: "GLITCH",
    blink: "PISCAR",
    line_reveal:
      "REVELAR LINHAS"
  };

  return (
    names[animation] ||
    animation ||
    "SEM ANIMAÇÃO"
  );
}

function renderBlockCardPreview(
  container,
  block
) {
  container.replaceChildren();

  switch (block.block_type) {
    case "title":
    case "text":
    case "system_message": {
      const paragraph =
        document.createElement("p");

      paragraph.textContent =
        block.content ||
        "Bloco sem conteúdo.";

      if (block.text_color) {
        paragraph.style.color =
          block.text_color;
      }

      container.appendChild(
        paragraph
      );

      break;
    }

    case "ascii": {
      const ascii =
        document.createElement("pre");

      ascii.textContent =
        block.content ||
        "Arte ASCII vazia.";

      if (block.text_color) {
        ascii.style.color =
          block.text_color;
      }

      container.appendChild(
        ascii
      );

      break;
    }

    case "image":
    case "pixel_art": {
      if (!block.media_url) {
        container.textContent =
          "Nenhum endereço de imagem cadastrado.";

        break;
      }

      const image =
        document.createElement("img");

      image.src =
        block.media_url;

      image.alt =
        block.alt_text || "";

      image.loading =
        "lazy";

      if (
        block.block_type ===
        "pixel_art"
      ) {
        image.style.imageRendering =
          "pixelated";
      }

      container.appendChild(
        image
      );

      break;
    }

    case "audio": {
      if (!block.media_url) {
        container.textContent =
          "Nenhum áudio cadastrado.";

        break;
      }

      const audio =
        document.createElement("audio");

      audio.controls = true;
      audio.preload =
        "metadata";

      audio.src =
        block.media_url;

      container.appendChild(
        audio
      );

      break;
    }

    case "divider": {
      const divider =
        document.createElement("div");

      divider.className =
        "block-card__divider-preview";

      container.appendChild(
        divider
      );

      break;
    }

    default:
      container.textContent =
        "Tipo de bloco desconhecido.";
  }
}

function showBlocksMessage(
  message,
  type = ""
) {
  elements.blocksMessage.className =
    "scene-list-message";

  if (type) {
    elements.blocksMessage.classList.add(
      `is-${type}`
    );
  }

  elements.blocksMessage.textContent =
    message || "";
}


/* ==========================================================
   CLIQUES NOS BLOCOS
   ========================================================== */

async function handleBlocksListClick(event) {
  const button =
    event.target.closest(
      "[data-block-action]"
    );

  if (!button) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  const action =
    button.dataset.blockAction;

  const blockId =
    button.dataset.blockId ||
    button.closest(
      ".block-card"
    )?.dataset.blockId;

  if (!action || !blockId) {
    return;
  }

  button.disabled = true;

  try {
    switch (action) {
      case "up":
        await moveBlock(
          blockId,
          "up"
        );
        break;

      case "down":
        await moveBlock(
          blockId,
          "down"
        );
        break;

      case "edit":
        openEditBlockModal(
          blockId
        );
        break;

      case "duplicate":
        await duplicateBlock(
          blockId
        );
        break;

      case "toggle":
        await toggleBlock(
          blockId
        );
        break;

      case "delete":
        await deleteBlock(
          blockId
        );
        break;
    }
  } catch (error) {
    console.error(
      "Erro na ação do bloco:",
      error
    );

    showBlocksMessage(
      formatDatabaseError(error),
      "error"
    );
  } finally {
    if (button.isConnected) {
      button.disabled = false;
    }
  }
}


/* ==========================================================
   FORMULÁRIO DO BLOCO
   ========================================================== */

function openNewBlockModal() {
  if (!state.blocksSceneId) {
    return;
  }

  state.editingBlockId = null;

  resetBlockForm();

  elements.blockFormTitle.textContent =
    "Novo bloco";

  elements.blockFormModal.classList.remove(
    "is-hidden"
  );

  document.body.style.overflow =
    "hidden";

  renderBlockFormPreview();

  window.setTimeout(() => {
    elements.blockType.focus();
  }, 50);
}

function openEditBlockModal(blockId) {
  const block =
    state.blocks.find(
      item =>
        item.id === blockId
    );

  if (!block) {
    showBlocksMessage(
      "O bloco selecionado não foi encontrado.",
      "error"
    );

    return;
  }

  state.editingBlockId =
    block.id;

  fillBlockForm(block);

  elements.blockFormTitle.textContent =
    `Editar ${formatBlockType(
      block.block_type
    ).toLocaleLowerCase(
      "pt-BR"
    )}`;

  elements.blockFormModal.classList.remove(
    "is-hidden"
  );

  document.body.style.overflow =
    "hidden";

  renderBlockFormPreview();
}

function closeBlockFormModal() {
  if (
    state.isSavingBlock ||
    state.isUploadingMedia
  ) {
    return;
  }

  elements.mediaLibraryModal.classList.add(
    "is-hidden"
  );

  elements.blockFormModal.classList.add(
    "is-hidden"
  );

  state.editingBlockId = null;

  updateBodyOverflow();
}

function handleBlockFormModalClick(event) {
  if (
    event.target.closest(
      "[data-close-block-form]"
    )
  ) {
    closeBlockFormModal();
  }
}

function resetBlockForm() {
  elements.blockForm.reset();

  elements.blockId.value = "";

  elements.blockType.value =
    "text";

  elements.blockAnimation.value =
    "none";

  elements.blockContent.value =
    "";

  elements.blockMediaUrl.value =
    "";

  elements.blockAltText.value =
    "";

  elements.blockTextColor.value =
    "";

  elements.blockColorPicker.value =
    "#e8e8e8";

  elements.blockEnabled.checked =
    true;

  resetMediaUploadStatus();

  updateBlockFormInterface();
  clearBlockFormMessage();
}

function fillBlockForm(block) {
  elements.blockId.value =
    block.id;

  elements.blockType.value =
    block.block_type;

  elements.blockAnimation.value =
    block.animation_type ||
    "none";

  elements.blockContent.value =
    block.content || "";

  elements.blockMediaUrl.value =
    block.media_url || "";

  elements.blockAltText.value =
    block.alt_text || "";

  elements.blockTextColor.value =
    block.text_color || "";

  elements.blockColorPicker.value =
    isValidHexColor(
      block.text_color
    )
      ? block.text_color
      : "#e8e8e8";

  elements.blockEnabled.checked =
    block.is_enabled === true;

  resetMediaUploadStatus();

  updateBlockFormInterface();
  clearBlockFormMessage();
}

function updateBlockFormInterface() {
  const blockType =
    elements.blockType.value;

  const usesText = [
    "title",
    "text",
    "system_message",
    "ascii"
  ].includes(blockType);

  const usesMedia = [
    "image",
    "pixel_art",
    "audio"
  ].includes(blockType);

  const usesAlt = [
    "image",
    "pixel_art"
  ].includes(blockType);

  const usesColor = [
    "title",
    "text",
    "system_message",
    "ascii"
  ].includes(blockType);

  elements.blockTextField.classList.toggle(
    "is-hidden",
    !usesText
  );

  elements.blockMediaField.classList.toggle(
    "is-hidden",
    !usesMedia
  );

  elements.blockAltField.classList.toggle(
    "is-hidden",
    !usesAlt
  );

  elements.blockAppearanceGroup.classList.toggle(
    "is-hidden",
    !usesColor
  );

  if (blockType === "ascii") {
    elements.blockContentHelp.textContent =
      "Espaços e quebras de linha serão preservados.";
  } else if (
    blockType ===
    "system_message"
  ) {
    elements.blockContentHelp.textContent =
      "Será exibido como uma mensagem técnica do terminal.";
  } else if (
    blockType === "title"
  ) {
    elements.blockContentHelp.textContent =
      "Será exibido como um título dentro da cena.";
  } else {
    elements.blockContentHelp.textContent =
      "O texto será mostrado exatamente como foi escrito.";
  }

  renderBlockFormPreview();
}

function handleBlockTextColorInput() {
  const color =
    elements.blockTextColor.value
      .trim();

  if (isValidHexColor(color)) {
    elements.blockColorPicker.value =
      color;
  }

  renderBlockFormPreview();
}

function handleBlockColorPickerInput() {
  elements.blockTextColor.value =
    elements.blockColorPicker.value;

  renderBlockFormPreview();
}

function isValidHexColor(value) {
  return /^#[0-9a-f]{6}$/i.test(
    String(value || "")
  );
}


/* ==========================================================
   PRÉ-VISUALIZAÇÃO DO BLOCO
   ========================================================== */

function renderBlockFormPreview() {
  elements.blockPreview.replaceChildren();

  const blockType =
    elements.blockType.value;

  const content =
    elements.blockContent.value;

  const mediaUrl =
    elements.blockMediaUrl.value
      .trim();

  const altText =
    elements.blockAltText.value
      .trim();

  const textColor =
    elements.blockTextColor.value
      .trim();

  let preview = null;

  switch (blockType) {
    case "title":
      preview =
        document.createElement("h3");

      preview.className =
        "block-preview__title";

      preview.textContent =
        content ||
        "Título da cena";
      break;

    case "text":
      preview =
        document.createElement("p");

      preview.className =
        "block-preview__text";

      preview.textContent =
        content ||
        "O texto narrativo aparecerá desta maneira.";
      break;

    case "system_message":
      preview =
        document.createElement("p");

      preview.className =
        "block-preview__system";

      preview.textContent =
        content ||
        "MENSAGEM DO SISTEMA";
      break;

    case "ascii":
      preview =
        document.createElement("pre");

      preview.className =
        "block-preview__ascii";

      preview.textContent =
        content ||
        "   .---.\n  /     \\\n |  O O  |\n  \\  ^  /";
      break;

    case "image":
    case "pixel_art":
      if (!mediaUrl) {
        preview =
          createPreviewPlaceholder(
            "Informe o endereço da imagem."
          );

        break;
      }

      preview =
        document.createElement("img");

      preview.className =
        "block-preview__image";

      preview.src =
        mediaUrl;

      preview.alt =
        altText;

      if (
        blockType ===
        "pixel_art"
      ) {
        preview.classList.add(
          "block-preview__pixel"
        );
      }

      preview.addEventListener(
        "error",
        () => {
          preview.replaceWith(
            createPreviewPlaceholder(
              "Não foi possível carregar esta imagem."
            )
          );
        },
        {
          once: true
        }
      );

      break;

    case "audio":
      if (!mediaUrl) {
        preview =
          createPreviewPlaceholder(
            "Informe o endereço do áudio."
          );

        break;
      }

      preview =
        document.createElement("audio");

      preview.controls = true;
      preview.preload =
        "metadata";

      preview.src =
        mediaUrl;
      break;

    case "divider":
      preview =
        document.createElement("div");

      preview.className =
        "block-preview__divider";
      break;

    default:
      preview =
        createPreviewPlaceholder(
          "Tipo de bloco desconhecido."
        );
  }

  if (
    preview &&
    textColor &&
    [
      "title",
      "text",
      "system_message",
      "ascii"
    ].includes(blockType)
  ) {
    preview.style.color =
      textColor;
  }

  elements.blockPreview.appendChild(
    preview
  );
}

function createPreviewPlaceholder(text) {
  const paragraph =
    document.createElement("p");

  paragraph.className =
    "block-preview__placeholder";

  paragraph.textContent =
    text;

  return paragraph;
}


/* ==========================================================
   SALVAR BLOCO
   ========================================================== */

async function handleBlockFormSubmit(event) {
  event.preventDefault();

  if (
    state.isSavingBlock ||
    state.isUploadingMedia ||
    !state.blocksSceneId
  ) {
    return;
  }

  const blockData =
    collectBlockFormData();

  const validationError =
    validateBlockData(
      blockData
    );

  if (validationError) {
    showBlockFormMessage(
      validationError,
      "error"
    );

    return;
  }

  setBlockSaving(true);

  showBlockFormMessage(
    "SALVANDO BLOCO..."
  );

  try {
    if (state.editingBlockId) {
      await updateBlock(
        state.editingBlockId,
        blockData
      );
    } else {
      await createBlock(
        blockData
      );
    }

    await normalizeSceneBlockOrder(
      state.blocksSceneId
    );

    await loadSceneBlocks();

    showBlockFormMessage(
      "BLOCO SALVO COM SUCESSO.",
      "success"
    );

    window.setTimeout(() => {
      closeBlockFormModal();
    }, 400);
  } catch (error) {
    console.error(
      "Erro ao salvar bloco:",
      error
    );

    showBlockFormMessage(
      formatDatabaseError(error),
      "error"
    );
  } finally {
    setBlockSaving(false);
  }
}

function collectBlockFormData() {
  const blockType =
    elements.blockType.value;

  const usesText = [
    "title",
    "text",
    "system_message",
    "ascii"
  ].includes(blockType);

  const usesMedia = [
    "image",
    "pixel_art",
    "audio"
  ].includes(blockType);

  const usesAlt = [
    "image",
    "pixel_art"
  ].includes(blockType);

  const usesColor = [
    "title",
    "text",
    "system_message",
    "ascii"
  ].includes(blockType);

  return {
    scene_id:
      state.blocksSceneId,

    block_type:
      blockType,

    content:
      usesText
        ? emptyToNull(
            elements.blockContent.value
          )
        : null,

    media_url:
      usesMedia
        ? emptyToNull(
            elements.blockMediaUrl.value
          )
        : null,

    alt_text:
      usesAlt
        ? emptyToNull(
            elements.blockAltText.value
          )
        : null,

    text_color:
      usesColor
        ? emptyToNull(
            elements.blockTextColor.value
          )
        : null,

    animation_type:
      elements.blockAnimation.value,

    is_enabled:
      elements.blockEnabled.checked
  };
}

function validateBlockData(blockData) {
  if (
    [
      "title",
      "text",
      "system_message",
      "ascii"
    ].includes(
      blockData.block_type
    ) &&
    !blockData.content
  ) {
    return (
      "Escreva o conteúdo do bloco."
    );
  }

  if (
    [
      "image",
      "pixel_art",
      "audio"
    ].includes(
      blockData.block_type
    ) &&
    !blockData.media_url
  ) {
    return (
      "Informe ou envie a mídia."
    );
  }

  if (
    blockData.media_url &&
    !isValidHttpUrl(
      blockData.media_url
    )
  ) {
    return (
      "Informe um endereço válido começando com http:// ou https://."
    );
  }

  if (
    blockData.text_color &&
    !isValidHexColor(
      blockData.text_color
    )
  ) {
    return (
      "Use uma cor hexadecimal completa, como #ff0000."
    );
  }

  return null;
}

async function createBlock(blockData) {
  const existingOrders =
    state.blocks
      .map(block =>
        Number(
          block.display_order
        )
      )
      .filter(
        Number.isFinite
      );

  const nextOrder =
    existingOrders.length === 0
      ? 10
      : Math.max(
          ...existingOrders
        ) + 10;

  const {
    data,
    error
  } = await state.client
    .from("scene_blocks")
    .insert({
      ...blockData,
      display_order:
        nextOrder
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function updateBlock(
  blockId,
  blockData
) {
  const {
    scene_id,
    ...editableData
  } = blockData;

  const {
    data,
    error
  } = await state.client
    .from("scene_blocks")
    .update(editableData)
    .eq("id", blockId)
    .eq(
      "scene_id",
      state.blocksSceneId
    )
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

function setBlockSaving(isSaving) {
  state.isSavingBlock =
    isSaving;

  elements.blockForm
    .querySelectorAll(
      "input, textarea, select, button"
    )
    .forEach(control => {
      control.disabled =
        isSaving;
    });

  elements.saveBlockButton.textContent =
    isSaving
      ? "SALVANDO..."
      : "SALVAR BLOCO";
}

function showBlockFormMessage(
  message,
  type = ""
) {
  elements.blockFormMessage.className =
    "form-message";

  if (type) {
    elements.blockFormMessage.classList.add(
      `is-${type}`
    );
  }

  elements.blockFormMessage.textContent =
    message || "";
}

function clearBlockFormMessage() {
  showBlockFormMessage("");
}


/* ==========================================================
   ORDEM DOS BLOCOS
   ========================================================== */

async function normalizeSceneBlockOrder(
  sceneId
) {
  if (!sceneId) {
    return;
  }

  const {
    error
  } = await state.client.rpc(
    "normalize_scene_block_order",
    {
      p_scene_id:
        sceneId
    }
  );

  if (error) {
    throw error;
  }
}

async function moveBlock(
  blockId,
  direction
) {
  if (
    direction !== "up" &&
    direction !== "down"
  ) {
    return;
  }

  showBlocksMessage(
    "REORGANIZANDO CONTEÚDO..."
  );

  const {
    error
  } = await state.client.rpc(
    "move_scene_block",
    {
      p_block_id:
        blockId,

      p_direction:
        direction
    }
  );

  if (error) {
    throw error;
  }

  await normalizeSceneBlockOrder(
    state.blocksSceneId
  );

  await loadSceneBlocks();
}


/* ==========================================================
   DUPLICAR, ATIVAR E EXCLUIR BLOCO
   ========================================================== */

async function duplicateBlock(blockId) {
  const block =
    state.blocks.find(
      item =>
        item.id === blockId
    );

  if (!block) {
    return;
  }

  showBlocksMessage(
    "DUPLICANDO BLOCO..."
  );

  const {
    error
  } = await state.client
    .from("scene_blocks")
    .insert({
      scene_id:
        block.scene_id,

      block_type:
        block.block_type,

      content:
        block.content,

      media_url:
        block.media_url,

      alt_text:
        block.alt_text,

      text_color:
        block.text_color,

      animation_type:
        block.animation_type,

      display_order:
        Number(
          block.display_order
        ) + 5,

      is_enabled:
        false
    });

  if (error) {
    throw error;
  }

  await normalizeSceneBlockOrder(
    state.blocksSceneId
  );

  await loadSceneBlocks();
}

async function toggleBlock(blockId) {
  const block =
    state.blocks.find(
      item =>
        item.id === blockId
    );

  if (!block) {
    return;
  }

  showBlocksMessage(
    block.is_enabled
      ? "DESATIVANDO BLOCO..."
      : "ATIVANDO BLOCO..."
  );

  const {
    error
  } = await state.client
    .from("scene_blocks")
    .update({
      is_enabled:
        !block.is_enabled
    })
    .eq("id", block.id)
    .eq(
      "scene_id",
      state.blocksSceneId
    );

  if (error) {
    throw error;
  }

  await loadSceneBlocks();
}

async function deleteBlock(blockId) {
  const block =
    state.blocks.find(
      item =>
        item.id === blockId
    );

  if (!block) {
    return;
  }

  const confirmed =
    window.confirm(
      "Excluir este bloco permanentemente?\n\n" +
      "Essa ação não poderá ser desfeita."
    );

  if (!confirmed) {
    return;
  }

  showBlocksMessage(
    "EXCLUINDO BLOCO..."
  );

  const {
    error
  } = await state.client
    .from("scene_blocks")
    .delete()
    .eq("id", block.id)
    .eq(
      "scene_id",
      state.blocksSceneId
    );

  if (error) {
    throw error;
  }

  await normalizeSceneBlockOrder(
    state.blocksSceneId
  );

  await loadSceneBlocks();
}


/* ==========================================================
   SELEÇÃO E VALIDAÇÃO DE MÍDIA
   ========================================================== */

function openMediaFileSelector() {
  if (state.isUploadingMedia) {
    return;
  }

  elements.mediaFileInput.value =
    "";

  elements.mediaFileInput.click();
}

async function handleMediaFileSelected(event) {
  const file =
    event.target.files?.[0];

  if (!file) {
    return;
  }

  const validationError =
    validateMediaFile(file);

  if (validationError) {
    showMediaUploadStatus(
      file.name,
      0,
      validationError,
      true
    );

    return;
  }

  await uploadMediaFile(file);
}

function validateMediaFile(file) {
  if (
    !ALLOWED_MEDIA_TYPES.has(
      file.type
    )
  ) {
    return (
      "Formato não aceito. Use PNG, JPG, WEBP, GIF, " +
      "MP3, OGG, WAV ou M4A."
    );
  }

  const isAudio =
    file.type.startsWith(
      "audio/"
    );

  const maximumSize =
    isAudio
      ? MEDIA_LIMITS.audio
      : MEDIA_LIMITS.image;

  if (file.size > maximumSize) {
    return isAudio
      ? "O áudio deve possuir no máximo 10 MB."
      : "A imagem deve possuir no máximo 6 MB.";
  }

  return null;
}


/* ==========================================================
   UPLOAD DE MÍDIA
   ========================================================== */

async function uploadMediaFile(file) {
  if (
    !state.client ||
    !state.game ||
    !state.user
  ) {
    showMediaUploadStatus(
      file.name,
      0,
      "O painel ainda não terminou de carregar.",
      true
    );

    return;
  }

  state.isUploadingMedia =
    true;

  setMediaButtonsDisabled(
    true
  );

  showMediaUploadStatus(
    file.name,
    10,
    "Preparando arquivo..."
  );

  let uploadedPath = null;

  try {
    const mediaType =
      inferMediaType(file);

    const storagePath =
      createMediaStoragePath(
        file,
        mediaType
      );

    showMediaUploadStatus(
      file.name,
      35,
      "Enviando para o Supabase Storage..."
    );

    const {
      data: uploadData,
      error: uploadError
    } = await state.client.storage
      .from(MEDIA_BUCKET)
      .upload(
        storagePath,
        file,
        {
          cacheControl:
            "3600",

          contentType:
            file.type,

          upsert:
            false
        }
      );

    if (uploadError) {
      throw uploadError;
    }

    uploadedPath =
      uploadData.path;

    showMediaUploadStatus(
      file.name,
      70,
      "Gerando endereço público..."
    );

    const {
      data: publicUrlData
    } = state.client.storage
      .from(MEDIA_BUCKET)
      .getPublicUrl(
        uploadData.path
      );

    const publicUrl =
      publicUrlData?.publicUrl;

    if (!publicUrl) {
      throw new Error(
        "Não foi possível gerar o endereço público."
      );
    }

    showMediaUploadStatus(
      file.name,
      85,
      "Registrando na biblioteca..."
    );

    const {
      data: mediaRecord,
      error: recordError
    } = await state.client
      .from("media_library")
      .insert({
        game_id:
          state.game.id,

        uploaded_by:
          state.user.id,

        storage_bucket:
          MEDIA_BUCKET,

        storage_path:
          uploadData.path,

        original_name:
          file.name,

        display_name:
          removeFileExtension(
            file.name
          ),

        media_type:
          mediaType,

        mime_type:
          file.type,

        size_bytes:
          file.size,

        public_url:
          publicUrl
      })
      .select(`
        id,
        game_id,
        storage_bucket,
        storage_path,
        original_name,
        display_name,
        media_type,
        mime_type,
        size_bytes,
        public_url,
        alt_text,
        created_at
      `)
      .single();

    if (recordError) {
      throw recordError;
    }

    elements.blockMediaUrl.value =
      mediaRecord.public_url;

    if (
      [
        "image",
        "pixel_art"
      ].includes(
        elements.blockType.value
      ) &&
      !elements.blockAltText.value.trim()
    ) {
      elements.blockAltText.value =
        mediaRecord.display_name ||
        removeFileExtension(
          mediaRecord.original_name
        );
    }

    state.mediaLibrary =
      state.mediaLibrary.filter(
        media =>
          media.id !==
          mediaRecord.id
      );

    state.mediaLibrary.unshift(
      mediaRecord
    );

    showMediaUploadStatus(
      file.name,
      100,
      "Arquivo enviado com sucesso."
    );

    renderBlockFormPreview();

    if (
      !elements.mediaLibraryModal.classList.contains(
        "is-hidden"
      )
    ) {
      applyMediaLibraryFilters();
    }
  } catch (error) {
    console.error(
      "Erro no envio da mídia:",
      error
    );

    if (uploadedPath) {
      try {
        await state.client.storage
          .from(MEDIA_BUCKET)
          .remove([
            uploadedPath
          ]);
      } catch (cleanupError) {
        console.warn(
          "Não foi possível limpar o arquivo órfão:",
          cleanupError
        );
      }
    }

    showMediaUploadStatus(
      file.name,
      100,
      formatMediaError(error),
      true
    );
  } finally {
    state.isUploadingMedia =
      false;

    setMediaButtonsDisabled(
      false
    );
  }
}

function inferMediaType(file) {
  if (
    file.type ===
    "image/gif"
  ) {
    return "gif";
  }

  if (
    file.type.startsWith(
      "audio/"
    )
  ) {
    return "audio";
  }

  if (
    elements.blockType.value ===
    "pixel_art"
  ) {
    return "pixel_art";
  }

  return "image";
}

function createMediaStoragePath(
  file,
  mediaType
) {
  const now =
    new Date();

  const year =
    String(
      now.getFullYear()
    );

  const month =
    String(
      now.getMonth() + 1
    ).padStart(2, "0");

  const randomId =
    typeof crypto.randomUUID ===
    "function"
      ? crypto.randomUUID()
      : generateFallbackUuid();

  const extension =
    getFileExtension(
      file.name
    ) ||
    extensionFromMimeType(
      file.type
    );

  const safeName =
    sanitizeFileName(
      removeFileExtension(
        file.name
      )
    ).slice(0, 60) ||
    "arquivo";

  return [
    state.game.slug,
    mediaType,
    year,
    month,
    `${safeName}-${randomId}.${extension}`
  ].join("/");
}

function generateFallbackUuid() {
  return [
    Date.now().toString(36),
    Math.random()
      .toString(36)
      .slice(2, 12)
  ].join("-");
}

function sanitizeFileName(value) {
  return String(value || "")
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getFileExtension(fileName) {
  const parts =
    String(
      fileName || ""
    ).split(".");

  return parts.length > 1
    ? parts.pop()
      .toLowerCase()
    : "";
}

function removeFileExtension(fileName) {
  return String(
    fileName || ""
  ).replace(
    /\.[^.]+$/,
    ""
  );
}

function extensionFromMimeType(
  mimeType
) {
  const extensions = {
    "image/png":
      "png",

    "image/jpeg":
      "jpg",

    "image/webp":
      "webp",

    "image/gif":
      "gif",

    "audio/mpeg":
      "mp3",

    "audio/ogg":
      "ogg",

    "audio/wav":
      "wav",

    "audio/x-wav":
      "wav",

    "audio/mp4":
      "m4a"
  };

  return extensions[mimeType] ||
    "bin";
}


/* ==========================================================
   ESTADO VISUAL DO UPLOAD
   ========================================================== */

function showMediaUploadStatus(
  fileName,
  percentage,
  message,
  isError = false
) {
  elements.mediaUploadStatus.classList.remove(
    "is-hidden",
    "is-error"
  );

  if (isError) {
    elements.mediaUploadStatus.classList.add(
      "is-error"
    );
  }

  const safePercentage =
    Math.max(
      0,
      Math.min(
        100,
        percentage
      )
    );

  elements.mediaUploadName.textContent =
    fileName ||
    "Arquivo";

  elements.mediaUploadPercentage.textContent =
    `${safePercentage}%`;

  elements.mediaUploadProgress.style.width =
    `${safePercentage}%`;

  elements.mediaUploadMessage.textContent =
    message || "";
}

function resetMediaUploadStatus() {
  elements.mediaUploadStatus.classList.add(
    "is-hidden"
  );

  elements.mediaUploadStatus.classList.remove(
    "is-error"
  );

  elements.mediaUploadName.textContent =
    "";

  elements.mediaUploadPercentage.textContent =
    "0%";

  elements.mediaUploadProgress.style.width =
    "0%";

  elements.mediaUploadMessage.textContent =
    "";
}

function setMediaButtonsDisabled(
  disabled
) {
  elements.uploadMediaButton.disabled =
    disabled;

  elements.mediaLibraryUploadButton.disabled =
    disabled;

  elements.openMediaLibraryButton.disabled =
    disabled;
}


/* ==========================================================
   BIBLIOTECA DE MÍDIAS
   ========================================================== */

async function openMediaLibrary() {
  elements.mediaLibraryModal.classList.remove(
    "is-hidden"
  );

  document.body.style.overflow =
    "hidden";

  try {
    await loadMediaLibrary();
  } catch (error) {
    console.error(
      "Erro ao carregar a biblioteca:",
      error
    );

    setMediaLibraryMessage(
      formatDatabaseError(error)
    );
  }
}

function closeMediaLibrary() {
  if (state.isUploadingMedia) {
    return;
  }

  elements.mediaLibraryModal.classList.add(
    "is-hidden"
  );

  updateBodyOverflow();
}

function handleMediaLibraryModalClick(event) {
  if (
    event.target.closest(
      "[data-close-media-library]"
    )
  ) {
    closeMediaLibrary();
  }
}

async function loadMediaLibrary() {
  setMediaLibraryMessage(
    "CARREGANDO ARQUIVOS..."
  );

  const {
    data,
    error
  } = await state.client
    .from("media_library")
    .select(`
      id,
      game_id,
      storage_bucket,
      storage_path,
      original_name,
      display_name,
      media_type,
      mime_type,
      size_bytes,
      public_url,
      alt_text,
      created_at
    `)
    .eq(
      "game_id",
      state.game.id
    )
    .order(
      "created_at",
      {
        ascending:
          false
      }
    );

  if (error) {
    throw error;
  }

  state.mediaLibrary =
    data || [];

  applyMediaLibraryFilters();
}

function applyMediaLibraryFilters() {
  const searchTerm =
    normalizeText(
      elements.mediaLibrarySearch.value
    );

  const typeFilter =
    elements.mediaLibraryType.value;

  state.filteredMedia =
    state.mediaLibrary.filter(
      media => {
        const searchable =
          normalizeText(
            [
              media.display_name,
              media.original_name,
              media.storage_path
            ]
              .filter(Boolean)
              .join(" ")
          );

        const matchesSearch =
          !searchTerm ||
          searchable.includes(
            searchTerm
          );

        const matchesType =
          !typeFilter ||
          media.media_type ===
            typeFilter;

        return (
          matchesSearch &&
          matchesType
        );
      }
    );

  renderMediaLibrary();
}

function renderMediaLibrary() {
  elements.mediaLibraryList.replaceChildren();

  const count =
    state.filteredMedia.length;

  elements.mediaLibraryCount.textContent =
    count === 1
      ? "1 arquivo"
      : `${count} arquivos`;

  if (count === 0) {
    const empty =
      document.createElement("div");

    empty.className =
      "media-library-list__empty";

    empty.textContent =
      state.mediaLibrary.length === 0
        ? "Nenhuma mídia foi enviada ainda."
        : "Nenhuma mídia corresponde aos filtros.";

    elements.mediaLibraryList.appendChild(
      empty
    );

    setMediaLibraryMessage("");

    return;
  }

  const fragment =
    document.createDocumentFragment();

  state.filteredMedia.forEach(
    media => {
      fragment.appendChild(
        createMediaCard(
          media
        )
      );
    }
  );

  elements.mediaLibraryList.appendChild(
    fragment
  );

  setMediaLibraryMessage(
    "BIBLIOTECA ATUALIZADA."
  );
}

function createMediaCard(media) {
  const fragment =
    elements.mediaCardTemplate.content
      .cloneNode(true);

  const preview =
    fragment.querySelector(
      ".media-card__preview"
    );

  const type =
    fragment.querySelector(
      ".media-card__type"
    );

  const name =
    fragment.querySelector(
      ".media-card__name"
    );

  const details =
    fragment.querySelector(
      ".media-card__details"
    );

  renderMediaCardPreview(
    preview,
    media
  );

  type.textContent =
    formatMediaType(
      media.media_type
    );

  name.textContent =
    media.display_name ||
    media.original_name;

  details.textContent =
    [
      formatFileSize(
        media.size_bytes
      ),
      formatMediaDate(
        media.created_at
      )
    ]
      .filter(Boolean)
      .join(" · ");

  fragment
    .querySelectorAll(
      "[data-media-action]"
    )
    .forEach(button => {
      button.dataset.mediaId =
        media.id;
    });

  return fragment;
}

function renderMediaCardPreview(
  container,
  media
) {
  container.replaceChildren();

  if (
    media.media_type ===
    "audio"
  ) {
    const audio =
      document.createElement("audio");

    audio.controls = true;
    audio.preload =
      "metadata";

    audio.src =
      media.public_url;

    container.appendChild(
      audio
    );

    return;
  }

  const image =
    document.createElement("img");

  image.src =
    media.public_url;

  image.alt =
    media.alt_text ||
    media.display_name ||
    "";

  image.loading =
    "lazy";

  if (
    media.media_type ===
    "pixel_art"
  ) {
    image.classList.add(
      "is-pixel-art"
    );
  }

  container.appendChild(
    image
  );
}

function formatMediaType(mediaType) {
  const names = {
    image:
      "IMAGEM",

    pixel_art:
      "PIXEL ART",

    gif:
      "GIF",

    audio:
      "ÁUDIO"
  };

  return names[mediaType] ||
    mediaType;
}

function formatFileSize(sizeBytes) {
  const size =
    Number(sizeBytes);

  if (!Number.isFinite(size)) {
    return "";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (
    size <
    1024 * 1024
  ) {
    return `${
      (
        size / 1024
      ).toFixed(1)
    } KB`;
  }

  return `${
    (
      size /
      (1024 * 1024)
    ).toFixed(1)
  } MB`;
}

function formatMediaDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle:
        "short"
    }
  ).format(
    new Date(
      dateValue
    )
  );
}

function setMediaLibraryMessage(
  message
) {
  elements.mediaLibraryMessage.textContent =
    message || "";
}


/* ==========================================================
   AÇÕES DA BIBLIOTECA
   ========================================================== */

async function handleMediaLibraryListClick(
  event
) {
  const button =
    event.target.closest(
      "[data-media-action]"
    );

  if (!button) {
    return;
  }

  event.preventDefault();

  const media =
    state.mediaLibrary.find(
      item =>
        item.id ===
        button.dataset.mediaId
    );

  if (!media) {
    return;
  }

  switch (
    button.dataset.mediaAction
  ) {
    case "select":
      selectMediaForBlock(
        media
      );
      break;

    case "copy":
      await copyMediaUrl(
        media
      );
      break;

    case "delete":
      await deleteMedia(
        media
      );
      break;
  }
}

function selectMediaForBlock(media) {
  elements.blockMediaUrl.value =
    media.public_url;

  if (
    media.media_type ===
    "audio"
  ) {
    elements.blockType.value =
      "audio";
  } else if (
    media.media_type ===
    "pixel_art"
  ) {
    elements.blockType.value =
      "pixel_art";
  } else {
    elements.blockType.value =
      "image";
  }

  if (
    !elements.blockAltText.value.trim()
  ) {
    elements.blockAltText.value =
      media.alt_text ||
      media.display_name ||
      removeFileExtension(
        media.original_name
      );
  }

  updateBlockFormInterface();
  closeMediaLibrary();
}

async function copyMediaUrl(media) {
  try {
    await navigator.clipboard.writeText(
      media.public_url
    );

    setMediaLibraryMessage(
      "ENDEREÇO COPIADO."
    );
  } catch (error) {
    console.error(
      "Erro ao copiar endereço:",
      error
    );

    setMediaLibraryMessage(
      "Não foi possível copiar automaticamente."
    );
  }
}

async function deleteMedia(media) {
  try {
    const isUsed =
      await checkMediaUsage(
        media.public_url
      );

    if (isUsed) {
      window.alert(
        "Este arquivo está sendo usado em pelo menos um bloco.\n\n" +
        "Remova-o dos blocos antes de excluí-lo."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Excluir permanentemente "${
          media.display_name ||
          media.original_name
        }"?\n\nEssa ação não poderá ser desfeita.`
      );

    if (!confirmed) {
      return;
    }

    setMediaLibraryMessage(
      "EXCLUINDO ARQUIVO..."
    );

    const {
      error: storageError
    } = await state.client.storage
      .from(
        media.storage_bucket ||
        MEDIA_BUCKET
      )
      .remove([
        media.storage_path
      ]);

    if (storageError) {
      throw storageError;
    }

    const {
      error: databaseError
    } = await state.client
      .from("media_library")
      .delete()
      .eq("id", media.id)
      .eq(
        "game_id",
        state.game.id
      );

    if (databaseError) {
      throw databaseError;
    }

    state.mediaLibrary =
      state.mediaLibrary.filter(
        item =>
          item.id !==
          media.id
      );

    applyMediaLibraryFilters();
  } catch (error) {
    console.error(
      "Erro ao excluir mídia:",
      error
    );

    setMediaLibraryMessage(
      formatMediaError(error)
    );
  }
}

async function checkMediaUsage(
  publicUrl
) {
  const {
    count,
    error
  } = await state.client
    .from("scene_blocks")
    .select(
      "id",
      {
        count:
          "exact",

        head:
          true
      }
    )
    .eq(
      "media_url",
      publicUrl
    );

  if (error) {
    throw error;
  }

  return Number(
    count || 0
  ) > 0;
}


/* ==========================================================
   CONTROLE DOS MODAIS
   ========================================================== */

function updateBodyOverflow() {
 const hasOpenModal = [
  elements.sceneModal,
  elements.sceneActionsModal,
  elements.blocksModal,
  elements.blockFormModal,
  elements.mediaLibraryModal,
  elements.responseModal,
  elements.responseActionsModal,
  elements.routeModal,
  elements.routeActionsModal,
  elements.itemModal,
  elements.itemActionsModal
  ].some(
    modal =>
      modal &&
      !modal.classList.contains(
        "is-hidden"
      )
  );

  document.body.style.overflow =
    hasOpenModal
      ? "hidden"
      : "";
}

/* ==========================================================
   EDITOR DE ROTAS
   ========================================================== */


/* ==========================================================
   SELETOR DE CENA INICIAL
   ========================================================== */

function populateRouteSceneSelector() {
  elements.routeStartScene
    .querySelectorAll(
      'option[data-dynamic-scene="true"]'
    )
    .forEach(option => option.remove());

  const sortedScenes =
    [...state.scenes].sort(
      (firstScene, secondScene) => {
        const firstName =
          firstScene.title ||
          firstScene.scene_key;

        const secondName =
          secondScene.title ||
          secondScene.scene_key;

        return firstName.localeCompare(
          secondName,
          "pt-BR"
        );
      }
    );

  sortedScenes.forEach(scene => {
    const option =
      document.createElement("option");

    option.value = scene.id;

    option.textContent =
      scene.title
        ? `${scene.title} — ${scene.scene_key}`
        : scene.scene_key;

    option.dataset.dynamicScene =
      "true";

    elements.routeStartScene.appendChild(
      option
    );
  });
}


/* ==========================================================
   FILTROS DAS ROTAS
   ========================================================== */

function applyRouteFilters() {
  const searchTerm =
    normalizeText(
      elements.routeSearch.value
    );

  const statusFilter =
    elements.routeStatusFilter.value;

  state.filteredRoutes =
    state.routes.filter(route => {
      const searchableContent =
        normalizeText(
          [
            route.name,
            route.code,
            route.description,
            route.admin_description
          ]
            .filter(Boolean)
            .join(" ")
        );

      const matchesSearch =
        !searchTerm ||
        searchableContent.includes(
          searchTerm
        );

      let matchesStatus = true;

      switch (statusFilter) {
        case "active":
          matchesStatus =
            route.is_enabled === true;
          break;

        case "inactive":
          matchesStatus =
            route.is_enabled === false;
          break;

        case "secret":
          matchesStatus =
            route.is_secret === true;
          break;

        case "initial":
          matchesStatus =
            route.is_initially_available === true;
          break;

        default:
          matchesStatus = true;
      }

      return (
        matchesSearch &&
        matchesStatus
      );
    });

  updateRouteStatistics();
  renderRouteList();
}


function updateRouteStatistics() {
  elements.totalRoutes.textContent =
    String(state.routes.length);

  elements.activeRoutes.textContent =
    String(
      state.routes.filter(
        route => route.is_enabled
      ).length
    );

  elements.secretRoutes.textContent =
    String(
      state.routes.filter(
        route => route.is_secret
      ).length
    );

  elements.initialRoutes.textContent =
    String(
      state.routes.filter(
        route =>
          route.is_initially_available
      ).length
    );
}


/* ==========================================================
   LISTA DAS ROTAS
   ========================================================== */

function renderRouteList() {
  elements.routeList.replaceChildren();

  if (
    state.filteredRoutes.length === 0
  ) {
    const empty =
      document.createElement("div");

    empty.className =
      "route-list__empty";

    empty.textContent =
      "Nenhuma rota corresponde aos filtros selecionados.";

    elements.routeList.appendChild(
      empty
    );

    showRouteListMessage(
      "NENHUMA ROTA ENCONTRADA."
    );

    return;
  }

  const fragment =
    document.createDocumentFragment();

  state.filteredRoutes.forEach(route => {
    fragment.appendChild(
      createRouteCard(route)
    );
  });

  elements.routeList.appendChild(
    fragment
  );

  showRouteListMessage(
    `${state.filteredRoutes.length} ROTA(S) EXIBIDA(S).`
  );
}


function createRouteCard(route) {
  const fragment =
    elements.routeCardTemplate.content
      .cloneNode(true);

  const card =
    fragment.querySelector(
      ".route-card"
    );

  const color =
    fragment.querySelector(
      ".route-card__color"
    );

  const title =
    fragment.querySelector(
      ".route-card__title"
    );

  const code =
    fragment.querySelector(
      ".route-card__code"
    );

  const description =
    fragment.querySelector(
      ".route-card__description"
    );

  const secretBadge =
    fragment.querySelector(
      '[data-route-badge="secret"]'
    );

  const initialBadge =
    fragment.querySelector(
      '[data-route-badge="initial"]'
    );

  const stateBadge =
    fragment.querySelector(
      '[data-route-badge="state"]'
    );

  const sceneDetail =
    fragment.querySelector(
      '[data-route-detail="scene"]'
    );

  const orderDetail =
    fragment.querySelector(
      '[data-route-detail="order"]'
    );

  const primaryColor =
    fragment.querySelector(
      '[data-route-color="primary"]'
    );

  const secondaryColor =
    fragment.querySelector(
      '[data-route-color="secondary"]'
    );

  const backgroundColor =
    fragment.querySelector(
      '[data-route-color="background"]'
    );

  const panelColor =
    fragment.querySelector(
      '[data-route-color="panel"]'
    );

  const editButton =
    fragment.querySelector(
      '[data-route-action="edit"]'
    );

  const moreButton =
    fragment.querySelector(
      '[data-route-action="more"]'
    );

  card.dataset.routeId = route.id;

  card.classList.toggle(
    "is-inactive",
    !route.is_enabled
  );

  color.style.background =
    sanitizeRouteColor(
      route.primary_color,
      "#e8e8e8"
    );

  title.textContent =
    route.name ||
    "Rota sem nome";

  code.textContent =
    route.code ||
    "sem_codigo";

  description.textContent =
    route.admin_description ||
    route.description ||
    "Nenhuma descrição cadastrada.";

  secretBadge.textContent =
    route.is_secret
      ? "SECRETA"
      : "";

  initialBadge.textContent =
    route.is_initially_available
      ? "INICIAL"
      : "";

  stateBadge.textContent =
    route.is_enabled
      ? "ATIVA"
      : "DESATIVADA";

  const startScene =
    getSceneById(
      route.start_scene_id
    );

  sceneDetail.textContent =
    startScene
      ? `INÍCIO: ${
          startScene.title ||
          startScene.scene_key
        }`
      : "SEM CENA INICIAL";

  orderDetail.textContent =
    `ORDEM ${
      Number(route.display_order) || 0
    }`;

  primaryColor.style.background =
    sanitizeRouteColor(
      route.primary_color,
      "#e8e8e8"
    );

  primaryColor.title =
    `Principal: ${
      route.primary_color ||
      "#e8e8e8"
    }`;

  secondaryColor.style.background =
    sanitizeRouteColor(
      route.secondary_color,
      "#8a8a8a"
    );

  secondaryColor.title =
    `Secundária: ${
      route.secondary_color ||
      "#8a8a8a"
    }`;

  backgroundColor.style.background =
    sanitizeRouteColor(
      route.background_color,
      "#030303"
    );

  backgroundColor.title =
    `Fundo: ${
      route.background_color ||
      "#030303"
    }`;

  panelColor.style.background =
    sanitizeRouteColor(
      route.panel_color,
      "#0c0c0c"
    );

  panelColor.title =
    `Painel: ${
      route.panel_color ||
      "#0c0c0c"
    }`;

  editButton.dataset.routeId =
    route.id;

  moreButton.dataset.routeId =
    route.id;

  return fragment;
}


function showRouteListMessage(
  message,
  type = ""
) {
  elements.routeListMessage.className =
    "scene-list-message";

  if (type) {
    elements.routeListMessage.classList.add(
      `is-${type}`
    );
  }

  elements.routeListMessage.textContent =
    message || "";
}


/* ==========================================================
   CLIQUES DA LISTA
   ========================================================== */

function handleRouteListClick(event) {
  const button = event.target.closest(
    "[data-route-action]"
  );

  if (!button) {
    return;
  }

  const routeId =
    button.dataset.routeId;

  if (!routeId) {
    return;
  }

  switch (
    button.dataset.routeAction
  ) {
    case "edit":
      openEditRouteModal(routeId);
      break;

    case "more":
      openRouteActionsModal(routeId);
      break;
  }
}


/* ==========================================================
   FORMULÁRIO DA ROTA
   ========================================================== */

function openNewRouteModal() {
  state.editingRouteId = null;

  resetRouteForm();

  elements.routeModalTitle.textContent =
    "Nova rota";

  elements.routeCode.disabled = false;

  openRouteModal();
}


function openEditRouteModal(routeId) {
  const route =
    getRouteById(routeId);

  if (!route) {
    showRouteListMessage(
      "A rota selecionada não foi encontrada.",
      "error"
    );

    return;
  }

  state.editingRouteId = route.id;

  fillRouteForm(route);

  elements.routeModalTitle.textContent =
    "Editar rota";

  elements.routeCode.disabled = false;

  openRouteModal();
}


function resetRouteForm() {
  elements.routeForm.reset();

  elements.routeId.value = "";

  elements.routeDisplayOrder.value =
    "10";

  elements.routePrimaryColor.value =
    "#e8e8e8";

  elements.routePrimaryPicker.value =
    "#e8e8e8";

  elements.routeSecondaryColor.value =
    "#8a8a8a";

  elements.routeSecondaryPicker.value =
    "#8a8a8a";

  elements.routeBackgroundColor.value =
    "#030303";

  elements.routeBackgroundPicker.value =
    "#030303";

  elements.routePanelColor.value =
    "#0c0c0c";

  elements.routePanelPicker.value =
    "#0c0c0c";

  elements.routeEnabled.checked = true;
  elements.routeSecret.checked = false;

  elements.routeInitiallyAvailable.checked =
    false;

  elements.routeFormMessage.textContent =
    "";

  setRouteSaving(false);

  renderRoutePreview();
}


function fillRouteForm(route) {
  elements.routeId.value =
    route.id;

  elements.routeName.value =
    route.name || "";

  elements.routeCode.value =
    route.code || "";

  elements.routeDescription.value =
    route.description || "";

  elements.routeAdminDescription.value =
    route.admin_description || "";

  elements.routeStartScene.value =
    route.start_scene_id || "";

  elements.routeDisplayOrder.value =
    String(
      Number(route.display_order) || 0
    );

  setRouteColorField(
    elements.routePrimaryColor,
    elements.routePrimaryPicker,
    route.primary_color,
    "#e8e8e8"
  );

  setRouteColorField(
    elements.routeSecondaryColor,
    elements.routeSecondaryPicker,
    route.secondary_color,
    "#8a8a8a"
  );

  setRouteColorField(
    elements.routeBackgroundColor,
    elements.routeBackgroundPicker,
    route.background_color,
    "#030303"
  );

  setRouteColorField(
    elements.routePanelColor,
    elements.routePanelPicker,
    route.panel_color,
    "#0c0c0c"
  );

  elements.routeBackgroundImage.value =
    route.background_image_url || "";

  elements.routeEnabled.checked =
    route.is_enabled === true;

  elements.routeSecret.checked =
    route.is_secret === true;

  elements.routeInitiallyAvailable.checked =
    route.is_initially_available === true;

  elements.routeFormMessage.textContent =
    "";

  setRouteSaving(false);

  renderRoutePreview();
}


function handleRouteNameInput() {
  if (
    state.editingRouteId ||
    elements.routeCode.value.trim()
  ) {
    renderRoutePreview();
    return;
  }

  elements.routeCode.value =
    createRouteCode(
      elements.routeName.value
    );

  renderRoutePreview();
}


function handleRouteCodeInput() {
  const cursorPosition =
    elements.routeCode.selectionStart;

  elements.routeCode.value =
    createRouteCode(
      elements.routeCode.value
    );

  try {
    elements.routeCode.setSelectionRange(
      cursorPosition,
      cursorPosition
    );
  } catch {
    /*
      Alguns navegadores não permitem alterar
      a seleção durante determinados eventos.
    */
  }
}


function createRouteCode(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 100);
}


/* ==========================================================
   CORES E PRÉ-VISUALIZAÇÃO
   ========================================================== */

function configureRouteColorEvents() {
  const colorPairs = [
    [
      elements.routePrimaryPicker,
      elements.routePrimaryColor
    ],
    [
      elements.routeSecondaryPicker,
      elements.routeSecondaryColor
    ],
    [
      elements.routeBackgroundPicker,
      elements.routeBackgroundColor
    ],
    [
      elements.routePanelPicker,
      elements.routePanelColor
    ]
  ];

  colorPairs.forEach(
    ([picker, textInput]) => {
      picker.addEventListener(
        "input",
        () => {
          textInput.value =
            picker.value;

          renderRoutePreview();
        }
      );

      textInput.addEventListener(
        "input",
        () => {
          const normalizedColor =
            normalizeHexColor(
              textInput.value
            );

          if (normalizedColor) {
            picker.value =
              normalizedColor;
          }

          renderRoutePreview();
        }
      );
    }
  );

  elements.routeBackgroundImage.addEventListener(
    "input",
    renderRoutePreview
  );

  elements.routeName.addEventListener(
    "input",
    renderRoutePreview
  );
}


function setRouteColorField(
  textInput,
  picker,
  value,
  fallback
) {
  const validColor =
    normalizeHexColor(value) ||
    fallback;

  textInput.value =
    validColor;

  picker.value =
    validColor;
}


function normalizeHexColor(value) {
  const normalized =
    String(value || "")
      .trim()
      .toLowerCase();

  if (
    /^#[0-9a-f]{6}$/.test(
      normalized
    )
  ) {
    return normalized;
  }

  if (
    /^#[0-9a-f]{3}$/.test(
      normalized
    )
  ) {
    return (
      "#" +
      normalized
        .slice(1)
        .split("")
        .map(character =>
          character + character
        )
        .join("")
    );
  }

  return null;
}


function sanitizeRouteColor(
  value,
  fallback
) {
  return (
    normalizeHexColor(value) ||
    fallback
  );
}


function renderRoutePreview() {
  const primaryColor =
    sanitizeRouteColor(
      elements.routePrimaryColor.value,
      "#e8e8e8"
    );

  const secondaryColor =
    sanitizeRouteColor(
      elements.routeSecondaryColor.value,
      "#8a8a8a"
    );

  const backgroundColor =
    sanitizeRouteColor(
      elements.routeBackgroundColor.value,
      "#030303"
    );

  const panelColor =
    sanitizeRouteColor(
      elements.routePanelColor.value,
      "#0c0c0c"
    );

  const backgroundImage =
    elements.routeBackgroundImage.value
      .trim();

  elements.routePreview.style.color =
    primaryColor;

  elements.routePreview.style.backgroundColor =
    backgroundColor;

  elements.routePreview.style.borderColor =
    secondaryColor;

  elements.routePreview.style.backgroundImage =
    backgroundImage &&
    isValidHttpUrl(backgroundImage)
      ? `linear-gradient(
          rgba(0, 0, 0, 0.34),
          rgba(0, 0, 0, 0.34)
        ),
        url("${backgroundImage}")`
      : "";

  const previewPanel =
    elements.routePreview.querySelector(
      ".route-preview__panel"
    );

  previewPanel.style.background =
    panelColor;

  previewPanel.style.borderColor =
    secondaryColor;

  elements.routePreviewName.textContent =
    elements.routeName.value
      .trim()
      .toLocaleUpperCase("pt-BR") ||
    "NOME DA ROTA";
}


/* ==========================================================
   SALVAR ROTA
   ========================================================== */

async function handleRouteFormSubmit(event) {
  event.preventDefault();

  if (state.isSavingRoute) {
    return;
  }

  clearRouteFormMessage();

  try {
    const routeData =
      collectRouteFormData();

    validateRouteData(routeData);

    setRouteSaving(true);

    if (state.editingRouteId) {
      await updateRoute(
        state.editingRouteId,
        routeData
      );
    } else {
      await createRoute(routeData);
    }

    await refreshRoutes();

    populateRouteSelectors();
    repopulateResponseRouteSelector();

    applySceneFilters();
    applyResponseFilters();

    showRouteFormMessage(
      "ROTA SALVA COM SUCESSO.",
      "success"
    );

    window.setTimeout(() => {
      closeRouteModal();
    }, 450);
  } catch (error) {
    console.error(
      "Erro ao salvar rota:",
      error
    );

    showRouteFormMessage(
      formatDatabaseError(error),
      "error"
    );
  } finally {
    setRouteSaving(false);
  }
}


function collectRouteFormData() {
  return {
    game_id: state.game.id,

    name:
      elements.routeName.value
        .trim(),

    code:
      createRouteCode(
        elements.routeCode.value
      ),

    description:
      emptyToNull(
        elements.routeDescription.value
      ),

    admin_description:
      emptyToNull(
        elements.routeAdminDescription.value
      ),

    start_scene_id:
      elements.routeStartScene.value ||
      null,

    display_order:
      Number(
        elements.routeDisplayOrder.value
      ) || 0,

    primary_color:
      sanitizeRouteColor(
        elements.routePrimaryColor.value,
        "#e8e8e8"
      ),

    secondary_color:
      sanitizeRouteColor(
        elements.routeSecondaryColor.value,
        "#8a8a8a"
      ),

    background_color:
      sanitizeRouteColor(
        elements.routeBackgroundColor.value,
        "#030303"
      ),

    panel_color:
      sanitizeRouteColor(
        elements.routePanelColor.value,
        "#0c0c0c"
      ),

    background_image_url:
      emptyToNull(
        elements.routeBackgroundImage.value
      ),

    is_enabled:
      elements.routeEnabled.checked,

    is_secret:
      elements.routeSecret.checked,

    is_initially_available:
      elements.routeInitiallyAvailable.checked
  };
}


function validateRouteData(routeData) {
  if (!routeData.name) {
    throw new Error(
      "Informe o nome da rota."
    );
  }

  if (!routeData.code) {
    throw new Error(
      "Informe o código interno da rota."
    );
  }

  if (
    routeData.background_image_url &&
    !isValidHttpUrl(
      routeData.background_image_url
    )
  ) {
    throw new Error(
      "A imagem de fundo precisa possuir um endereço HTTP ou HTTPS válido."
    );
  }
}


async function createRoute(routeData) {
  const {
    error
  } = await state.client
    .from("routes")
    .insert(routeData);

  if (error) {
    throw error;
  }
}


async function updateRoute(
  routeId,
  routeData
) {
  const {
    error
  } = await state.client
    .from("routes")
    .update(routeData)
    .eq("id", routeId)
    .eq("game_id", state.game.id);

  if (error) {
    throw error;
  }
}


/* ==========================================================
   ATUALIZAR ROTAS
   ========================================================== */

async function refreshRoutes() {
  showRouteListMessage(
    "ATUALIZANDO ROTAS..."
  );

  const {
    data,
    error
  } = await state.client
    .from("routes")
    .select(`
      id,
      game_id,
      code,
      name,
      description,
      admin_description,
      primary_color,
      secondary_color,
      background_color,
      panel_color,
      background_image_url,
      start_scene_id,
      is_secret,
      is_initially_available,
      is_enabled,
      display_order,
      created_at,
      updated_at
    `)
    .eq("game_id", state.game.id)
    .order("display_order", {
      ascending: true
    });

  if (error) {
    throw error;
  }

  state.routes = data || [];

  applyRouteFilters();
}


function repopulateResponseRouteSelector() {
  elements.responseTargetRoute
    .querySelectorAll(
      'option[data-dynamic-route="true"]'
    )
    .forEach(option => option.remove());

  state.routes.forEach(route => {
    const option =
      document.createElement("option");

    option.value = route.id;

    option.textContent =
      route.is_secret
        ? `${route.name} — secreta`
        : route.name;

    option.dataset.dynamicRoute =
      "true";

    elements.responseTargetRoute.appendChild(
      option
    );
  });
}


/* ==========================================================
   AÇÕES DA ROTA
   ========================================================== */

function openRouteActionsModal(routeId) {
  const route =
    getRouteById(routeId);

  if (!route) {
    showRouteListMessage(
      "A rota selecionada não foi encontrada.",
      "error"
    );

    return;
  }

  state.actionsRouteId = route.id;

  elements.routeActionsTitle.textContent =
    route.name ||
    route.code ||
    "Rota";

  elements.toggleRouteButton
    .querySelector("strong")
    .textContent =
      route.is_enabled
        ? "DESATIVAR ROTA"
        : "ATIVAR ROTA";

  elements.toggleRouteButton
    .querySelector("span")
    .textContent =
      route.is_enabled
        ? "Impede temporariamente o uso da rota."
        : "Permite novamente o uso da rota.";

  elements.routeActionsModal.classList.remove(
    "is-hidden"
  );

  updateBodyOverflow();
}


function closeRouteActionsModal() {
  elements.routeActionsModal.classList.add(
    "is-hidden"
  );

  state.actionsRouteId = null;

  updateBodyOverflow();
}


function handleRouteActionsModalClick(event) {
  const closeTarget =
    event.target.closest(
      "[data-close-route-actions]"
    );

  if (closeTarget) {
    closeRouteActionsModal();
  }
}


async function duplicateSelectedRoute() {
  const routeId =
    state.actionsRouteId;

  if (!routeId) {
    return;
  }

  setRouteActionButtonsDisabled(true);

  try {
    const {
      data,
      error
    } = await state.client.rpc(
      "duplicate_route",
      {
        p_route_id: routeId
      }
    );

    if (error) {
      throw error;
    }

    closeRouteActionsModal();

    await refreshRoutes();

    populateRouteSelectors();
    repopulateResponseRouteSelector();

    const duplicatedRoute =
      getRouteById(data);

    if (duplicatedRoute) {
      openEditRouteModal(
        duplicatedRoute.id
      );
    }

    showRouteListMessage(
      "ROTA DUPLICADA COM SUCESSO.",
      "success"
    );
  } catch (error) {
    console.error(
      "Erro ao duplicar rota:",
      error
    );

    showRouteListMessage(
      formatDatabaseError(error),
      "error"
    );
  } finally {
    setRouteActionButtonsDisabled(false);
  }
}


async function toggleSelectedRoute() {
  const route =
    getRouteById(
      state.actionsRouteId
    );

  if (!route) {
    return;
  }

  setRouteActionButtonsDisabled(true);

  try {
    const {
      error
    } = await state.client
      .from("routes")
      .update({
        is_enabled:
          !route.is_enabled
      })
      .eq("id", route.id)
      .eq("game_id", state.game.id);

    if (error) {
      throw error;
    }

    closeRouteActionsModal();

    await refreshRoutes();

    populateRouteSelectors();
    repopulateResponseRouteSelector();

    showRouteListMessage(
      route.is_enabled
        ? "ROTA DESATIVADA."
        : "ROTA ATIVADA.",
      "success"
    );
  } catch (error) {
    console.error(
      "Erro ao alterar rota:",
      error
    );

    showRouteListMessage(
      formatDatabaseError(error),
      "error"
    );
  } finally {
    setRouteActionButtonsDisabled(false);
  }
}


async function deleteSelectedRoute() {
  const route =
    getRouteById(
      state.actionsRouteId
    );

  if (!route) {
    return;
  }

  const confirmed =
    window.confirm(
      `Excluir definitivamente a rota "${route.name}"?\n\n` +
      "A exclusão será bloqueada caso existam cenas, caminhos ou partidas utilizando essa rota."
    );

  if (!confirmed) {
    return;
  }

  setRouteActionButtonsDisabled(true);

  try {
    const {
      error
    } = await state.client
      .from("routes")
      .delete()
      .eq("id", route.id)
      .eq("game_id", state.game.id);

    if (error) {
      throw error;
    }

    closeRouteActionsModal();

    await refreshRoutes();

    populateRouteSelectors();
    repopulateResponseRouteSelector();

    applySceneFilters();
    applyResponseFilters();

    showRouteListMessage(
      "ROTA EXCLUÍDA COM SUCESSO.",
      "success"
    );
  } catch (error) {
    console.error(
      "Erro ao excluir rota:",
      error
    );

    showRouteListMessage(
      formatDatabaseError(error),
      "error"
    );
  } finally {
    setRouteActionButtonsDisabled(false);
  }
}


function setRouteActionButtonsDisabled(
  disabled
) {
  elements.duplicateRouteButton.disabled =
    disabled;

  elements.toggleRouteButton.disabled =
    disabled;

  elements.deleteRouteButton.disabled =
    disabled;
}


/* ==========================================================
   CONTROLE DO MODAL
   ========================================================== */

function openRouteModal() {
  elements.routeModal.classList.remove(
    "is-hidden"
  );

  renderRoutePreview();

  updateBodyOverflow();

  window.setTimeout(() => {
    elements.routeName.focus();
  }, 30);
}


function closeRouteModal() {
  if (state.isSavingRoute) {
    return;
  }

  elements.routeModal.classList.add(
    "is-hidden"
  );

  state.editingRouteId = null;

  updateBodyOverflow();
}


function handleRouteModalClick(event) {
  const closeTarget =
    event.target.closest(
      "[data-close-route-modal]"
    );

  if (closeTarget) {
    closeRouteModal();
  }
}


/* ==========================================================
   ESTADO DO FORMULÁRIO
   ========================================================== */

function setRouteSaving(isSaving) {
  state.isSavingRoute = isSaving;

  elements.saveRouteButton.disabled =
    isSaving;

  elements.saveRouteButton.textContent =
    isSaving
      ? "SALVANDO..."
      : "SALVAR ROTA";
}


function clearRouteFormMessage() {
  elements.routeFormMessage.className =
    "form-message";

  elements.routeFormMessage.textContent =
    "";
}


function showRouteFormMessage(
  message,
  type = ""
) {
  elements.routeFormMessage.className =
    "form-message";

  if (type) {
    elements.routeFormMessage.classList.add(
      `is-${type}`
    );
  }

  elements.routeFormMessage.textContent =
    message || "";
}


/* ==========================================================
   BUSCA DE CENA
   ========================================================== */

function getSceneById(sceneId) {
  return state.scenes.find(
    scene => scene.id === sceneId
  ) || null;
}

/* ==========================================================
   EDITOR DE ITENS — BASE TEMPORÁRIA
   ========================================================== */

function applyItemFilters() {
  const searchTerm =
    normalizeText(
      elements.itemSearch.value
    );

  const typeFilter =
    elements.itemTypeFilter.value;

  const statusFilter =
    elements.itemStatusFilter.value;

  state.filteredItems =
    state.items.filter(item => {
      const searchableContent =
        normalizeText(
          [
            item.name,
            item.item_key,
            item.description,
            item.admin_description,
            item.item_type
          ]
            .filter(Boolean)
            .join(" ")
        );

      const matchesSearch =
        !searchTerm ||
        searchableContent.includes(
          searchTerm
        );

      const matchesType =
        !typeFilter ||
        item.item_type === typeFilter;

      let matchesStatus = true;

      switch (statusFilter) {
        case "active":
          matchesStatus =
            item.is_enabled === true;
          break;

        case "inactive":
          matchesStatus =
            item.is_enabled === false;
          break;

        case "secret":
          matchesStatus =
            item.is_secret === true;
          break;

        case "consumable":
          matchesStatus =
            item.is_consumable === true;
          break;

        case "stackable":
          matchesStatus =
            item.is_stackable === true;
          break;

        default:
          matchesStatus = true;
      }

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus
      );
    });

   state.filteredItems.sort(
  (itemA, itemB) => {
    const orderDifference =
      (
        Number(
          itemA.display_order
        ) || 0
      ) -
      (
        Number(
          itemB.display_order
        ) || 0
      );

    if (orderDifference !== 0) {
      return orderDifference;
    }

    return String(
      itemA.name || ""
    ).localeCompare(
      String(
        itemB.name || ""
      ),
      "pt-BR"
    );
  }
);
   
  updateItemStatistics();
  renderItemList();
}

function updateItemStatistics() {
  elements.totalItems.textContent =
    String(state.items.length);

  elements.activeItems.textContent =
    String(
      state.items.filter(
        item => item.is_enabled
      ).length
    );

  elements.secretItems.textContent =
    String(
      state.items.filter(
        item => item.is_secret
      ).length
    );

  elements.consumableItems.textContent =
    String(
      state.items.filter(
        item => item.is_consumable
      ).length
    );
}

/* ==========================================================
   LISTA DE ITENS
   ========================================================== */

function renderItemList() {
  elements.itemList.replaceChildren();

  if (
    state.filteredItems.length === 0
  ) {
    const empty =
      document.createElement("div");

    empty.className =
      "item-list__empty";

    empty.textContent =
      "Nenhum item corresponde aos filtros selecionados.";

    elements.itemList.appendChild(
      empty
    );

    showItemListMessage(
      "NENHUM ITEM ENCONTRADO."
    );

    return;
  }

  const fragment =
    document.createDocumentFragment();

  state.filteredItems.forEach(item => {
    fragment.appendChild(
      createItemCard(item)
    );
  });

  elements.itemList.appendChild(
    fragment
  );

  showItemListMessage(
    `${state.filteredItems.length} ITEM(NS) EXIBIDO(S).`
  );
}


function createItemCard(item) {
  const fragment =
    elements.itemCardTemplate.content
      .cloneNode(true);

  const card =
    fragment.querySelector(
      ".item-card"
    );

  const imagePlaceholder =
    fragment.querySelector(
      ".item-card__image-placeholder"
    );

  const imageElement =
    fragment.querySelector(
      ".item-card__image-element"
    );

  const title =
    fragment.querySelector(
      ".item-card__title"
    );

  const key =
    fragment.querySelector(
      ".item-card__key"
    );

  const description =
    fragment.querySelector(
      ".item-card__description"
    );

  const typeBadge =
    fragment.querySelector(
      '[data-item-badge="type"]'
    );

  const secretBadge =
    fragment.querySelector(
      '[data-item-badge="secret"]'
    );

  const consumableBadge =
    fragment.querySelector(
      '[data-item-badge="consumable"]'
    );

  const stateBadge =
    fragment.querySelector(
      '[data-item-badge="state"]'
    );

  const quantityDetail =
    fragment.querySelector(
      '[data-item-detail="quantity"]'
    );

  const stackableDetail =
    fragment.querySelector(
      '[data-item-detail="stackable"]'
    );

  const orderDetail =
    fragment.querySelector(
      '[data-item-detail="order"]'
    );

  const editButton =
    fragment.querySelector(
      '[data-item-action="edit"]'
    );

  const moreButton =
    fragment.querySelector(
      '[data-item-action="more"]'
    );

  card.dataset.itemId =
    item.id;

  card.classList.toggle(
    "is-inactive",
    !item.is_enabled
  );

  title.textContent =
    item.name ||
    "Item sem nome";

  key.textContent =
    item.item_key ||
    "sem_identificador";

  description.textContent =
    item.admin_description ||
    item.description ||
    "Nenhuma descrição cadastrada.";

  typeBadge.textContent =
    formatItemType(
      item.item_type
    );

  secretBadge.textContent =
    item.is_secret
      ? "SECRETO"
      : "";

  consumableBadge.textContent =
    item.is_consumable
      ? "CONSUMÍVEL"
      : "";

  stateBadge.textContent =
    item.is_enabled
      ? "ATIVO"
      : "DESATIVADO";

  quantityDetail.textContent =
    `MÁXIMO: ${
      Number(
        item.maximum_quantity
      ) || 1
    }`;

  stackableDetail.textContent =
    item.is_stackable
      ? "EMPILHÁVEL"
      : "ITEM ÚNICO";

  orderDetail.textContent =
    `ORDEM ${
      Number(item.display_order) || 0
    }`;

  if (
    item.image_url &&
    isValidHttpUrl(item.image_url)
  ) {
    imageElement.src =
      item.image_url;

    imageElement.alt =
      item.name ||
      "Imagem do item";

    imageElement.classList.remove(
      "is-hidden"
    );

    imagePlaceholder.classList.add(
      "is-hidden"
    );

    imageElement.addEventListener(
      "error",
      () => {
        imageElement.classList.add(
          "is-hidden"
        );

        imagePlaceholder.classList.remove(
          "is-hidden"
        );
      }
    );
  }

  editButton.dataset.itemId =
    item.id;

  moreButton.dataset.itemId =
    item.id;

  return fragment;
}


function formatItemType(itemType) {
  const names = {
    general: "GERAL",
    key: "CHAVE",
    document: "DOCUMENTO",
    tool: "FERRAMENTA",
    weapon: "ARMA",
    clue: "PISTA",
    consumable: "CONSUMÍVEL",
    quest: "MISSÃO",
    secret: "SECRETO"
  };

  return (
    names[itemType] ||
    String(itemType || "GERAL")
      .toLocaleUpperCase("pt-BR")
  );
}

function showItemListMessage(
  message,
  type = ""
) {
  elements.itemListMessage.className =
    "scene-list-message";

  if (type) {
    elements.itemListMessage.classList.add(
      `is-${type}`
    );
  }

  elements.itemListMessage.textContent =
    message || "";
}
function openNewItemModal() {
  state.editingItemId = null;

  resetItemForm();

  elements.itemModalTitle.textContent =
    "Novo item";

  elements.itemKey.disabled =
    false;

  openItemModal();
}


function openEditItemModal(itemId) {
  const item =
    getItemById(itemId);

  if (!item) {
    showItemListMessage(
      "O item selecionado não foi encontrado.",
      "error"
    );

    return;
  }

  state.editingItemId =
    item.id;

  fillItemForm(item);

  elements.itemModalTitle.textContent =
    "Editar item";

  elements.itemKey.disabled =
    false;

  openItemModal();
}


function openItemModal() {
  elements.itemModal.classList.remove(
    "is-hidden"
  );

  updateBodyOverflow();

  window.setTimeout(() => {
    elements.itemName.focus();
  }, 30);
}

function resetItemForm() {
  elements.itemForm.reset();

  elements.itemId.value = "";

  elements.itemType.value =
    "general";

  elements.itemDisplayOrder.value =
    "10";

  elements.itemMaximumQuantity.value =
    "1";

  elements.itemStackable.checked =
    false;

  elements.itemConsumable.checked =
    false;

  elements.itemEnabled.checked =
    true;

  elements.itemSecret.checked =
    false;

  elements.itemFormMessage.className =
    "form-message";

  elements.itemFormMessage.textContent =
    "";

  elements.itemKey.disabled =
    false;

  setItemSaving(false);

  updateItemQuantityInterface();
  renderItemImagePreview();
}


function fillItemForm(item) {
  elements.itemId.value =
    item.id;

  elements.itemName.value =
    item.name || "";

  elements.itemKey.value =
    item.item_key || "";

  elements.itemType.value =
    item.item_type ||
    "general";

  elements.itemDisplayOrder.value =
    String(
      Number(item.display_order) || 0
    );

  elements.itemDescription.value =
    item.description || "";

  elements.itemAdminDescription.value =
    item.admin_description || "";

  elements.itemImageUrl.value =
    item.image_url || "";

  elements.itemReceiveText.value =
    item.receive_text || "";

  elements.itemUseText.value =
    item.use_text || "";

  elements.itemMaximumQuantity.value =
    String(
      Number(
        item.maximum_quantity
      ) || 1
    );

  elements.itemStackable.checked =
    item.is_stackable === true;

  elements.itemConsumable.checked =
    item.is_consumable === true;

  elements.itemEnabled.checked =
    item.is_enabled === true;

  elements.itemSecret.checked =
    item.is_secret === true;

  elements.itemFormMessage.className =
    "form-message";

  elements.itemFormMessage.textContent =
    "";

  setItemSaving(false);

  updateItemQuantityInterface();
  renderItemImagePreview();
}

function closeItemModal() {
  if (state.isSavingItem) {
    return;
  }

  elements.itemModal.classList.add(
    "is-hidden"
  );

  state.editingItemId = null;

  elements.itemForm.reset();

  updateBodyOverflow();
}

function handleItemModalClick(event) {
  const closeTarget =
    event.target.closest(
      "[data-close-item-modal]"
    );

  if (closeTarget) {
    closeItemModal();
  }
}


function closeItemActionsModal() {
  elements.itemActionsModal.classList.add(
    "is-hidden"
  );

  state.actionsItemId = null;

  updateBodyOverflow();
}


function handleItemActionsModalClick(event) {
  const closeTarget =
    event.target.closest(
      "[data-close-item-actions]"
    );

  if (closeTarget) {
    closeItemActionsModal();
  }
}


function renderItemImagePreview() {
  elements.itemImagePreview.replaceChildren();

  const imageUrl =
    elements.itemImageUrl.value.trim();

  if (!imageUrl) {
    const message =
      document.createElement("p");

    message.textContent =
      "NENHUMA IMAGEM SELECIONADA";

    elements.itemImagePreview.appendChild(
      message
    );

    return;
  }

  if (!isValidHttpUrl(imageUrl)) {
    const message =
      document.createElement("p");

    message.textContent =
      "O ENDEREÇO DA IMAGEM NÃO É VÁLIDO";

    elements.itemImagePreview.appendChild(
      message
    );

    return;
  }

  const image =
    document.createElement("img");

  image.src = imageUrl;

  image.alt =
    elements.itemName.value.trim() ||
    "Pré-visualização do item";

  image.addEventListener(
    "error",
    () => {
      elements.itemImagePreview.replaceChildren();

      const message =
        document.createElement("p");

      message.textContent =
        "NÃO FOI POSSÍVEL CARREGAR A IMAGEM";

      elements.itemImagePreview.appendChild(
        message
      );
    }
  );

  elements.itemImagePreview.appendChild(
    image
  );
}

function handleItemNameInput() {
  if (state.editingItemId) {
    return;
  }

  if (
    elements.itemKey.value.trim()
  ) {
    return;
  }

  elements.itemKey.value =
    normalizeItemKey(
      elements.itemName.value
    );
}


function handleItemKeyInput() {
  elements.itemKey.value =
    normalizeItemKey(
      elements.itemKey.value
    );
}


function normalizeItemKey(value) {
  return String(value || "")
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 100);
}


function updateItemQuantityInterface() {
  if (state.isSavingItem) {
    return;
  }

  if (!elements.itemStackable.checked) {
    elements.itemMaximumQuantity.value =
      "1";

    elements.itemMaximumQuantity.disabled =
      true;

    return;
  }

  elements.itemMaximumQuantity.disabled =
    false;

  if (
    Number(
      elements.itemMaximumQuantity.value
    ) < 2
  ) {
    elements.itemMaximumQuantity.value =
      "2";
  }
}

function collectItemFormData() {
  const isStackable =
    elements.itemStackable.checked;

  const maximumQuantity =
    isStackable
      ? Number(
          elements.itemMaximumQuantity.value
        )
      : 1;

  return {
    game_id:
      state.game.id,

    item_key:
      normalizeItemKey(
        elements.itemKey.value
      ),

    name:
      elements.itemName.value.trim(),

    description:
      emptyToNull(
        elements.itemDescription.value
      ),

    admin_description:
      emptyToNull(
        elements.itemAdminDescription.value
      ),

    item_type:
      elements.itemType.value ||
      "general",

    image_url:
      emptyToNull(
        elements.itemImageUrl.value
      ),

    receive_text:
      emptyToNull(
        elements.itemReceiveText.value
      ),

    use_text:
      emptyToNull(
        elements.itemUseText.value
      ),

    maximum_quantity:
      maximumQuantity,

    is_stackable:
      isStackable,

    is_consumable:
      elements.itemConsumable.checked,

    is_secret:
      elements.itemSecret.checked,

    is_enabled:
      elements.itemEnabled.checked,

    display_order:
      Number(
        elements.itemDisplayOrder.value
      ) || 0
  };
}

function validateItemData(itemData) {
  if (!itemData.name) {
    return (
      "Informe o nome do item."
    );
  }

  if (!itemData.item_key) {
    return (
      "Informe o identificador interno do item."
    );
  }

  if (
    !/^[a-z0-9_]+$/.test(
      itemData.item_key
    )
  ) {
    return (
      "O identificador pode conter apenas letras minúsculas, " +
      "números e sublinhados."
    );
  }

  const validTypes = new Set([
    "general",
    "key",
    "document",
    "tool",
    "weapon",
    "clue",
    "consumable",
    "quest",
    "secret"
  ]);

  if (
    !validTypes.has(
      itemData.item_type
    )
  ) {
    return (
      "Selecione um tipo de item válido."
    );
  }

  if (
    !Number.isInteger(
      itemData.maximum_quantity
    ) ||
    itemData.maximum_quantity < 1 ||
    itemData.maximum_quantity > 999
  ) {
    return (
      "A quantidade máxima deve estar entre 1 e 999."
    );
  }

  if (
    !Number.isInteger(
      itemData.display_order
    ) ||
    itemData.display_order < 0 ||
    itemData.display_order > 10000
  ) {
    return (
      "A ordem do item deve estar entre 0 e 10000."
    );
  }

  if (
    itemData.image_url &&
    !isValidHttpUrl(
      itemData.image_url
    )
  ) {
    return (
      "O endereço da imagem não é válido."
    );
  }

  return null;
}

/* ==========================================================
   CRIAR E ATUALIZAR ITEM
   ========================================================== */

async function createItem(itemData) {
  /*
    Insere um novo Item na tabela items.
  */
  const {
    data,
    error
  } = await state.client
    .from("items")
    .insert(itemData)
    .select(`
      id,
      game_id,
      item_key,
      name
    `)
    .single();

  if (error) {
    throw error;
  }

  return data;
}


async function updateItem(
  itemId,
  itemData
) {
  /*
    O game_id não precisa ser alterado
    durante a edição.
  */
  const {
    game_id,
    ...editableData
  } = itemData;

  /*
    Atualiza somente o Item selecionado
    e pertencente ao jogo atual.
  */
  const {
    data,
    error
  } = await state.client
    .from("items")
    .update(editableData)
    .eq(
      "id",
      itemId
    )
    .eq(
      "game_id",
      state.game.id
    )
    .select(`
      id,
      game_id,
      item_key,
      name
    `)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/* ==========================================================
   ATUALIZAR LISTA DE ITENS
   ========================================================== */

async function refreshItems() {
  showItemListMessage(
    "ATUALIZANDO ITENS..."
  );

  /*
    Consulta novamente todos os Itens
    pertencentes ao jogo atual.
  */
  const {
    data,
    error
  } = await state.client
    .from("items")
    .select(`
      id,
      game_id,
      item_key,
      name,
      description,
      admin_description,
      item_type,
      image_url,
      receive_text,
      use_text,
      maximum_quantity,
      is_stackable,
      is_consumable,
      is_secret,
      is_enabled,
      display_order,
      created_at,
      updated_at
    `)
    .eq(
      "game_id",
      state.game.id
    )
    .order(
      "display_order",
      {
        ascending: true
      }
    )
    .order(
      "name",
      {
        ascending: true
      }
    );

  if (error) {
    throw error;
  }

  /*
    Substitui a lista antiga pela versão
    atualizada que veio do Supabase.
  */
 state.items =
  data || [];

/*
  Atualiza a aba de Itens.
*/
applyItemFilters();

/*
  Atualiza os três seletores dentro
  do formulário de Caminhos.
*/
populateResponseItemSelectors();
}

async function handleItemFormSubmit(event) {
  event.preventDefault();

  if (state.isSavingItem) {
    return;
  }

  /*
    Reúne todos os valores preenchidos
    dentro do formulário.
  */
  const itemData =
    collectItemFormData();

  /*
    Confere se os dados estão válidos antes
    de enviar para o Supabase.
  */
  const validationError =
    validateItemData(itemData);

  if (validationError) {
    showItemFormMessage(
      validationError,
      "error"
    );

    return;
  }

  setItemSaving(true);

  showItemFormMessage(
    "SALVANDO ITEM..."
  );

  try {
    /*
      Caso exista editingItemId, estamos editando
      um Item já existente.
    */
    if (state.editingItemId) {
      await updateItem(
        state.editingItemId,
        itemData
      );
    } else {
      /*
        Caso contrário, estamos criando
        um Item novo.
      */
      await createItem(
        itemData
      );
    }

    /*
      Recarrega a lista depois do salvamento.
    */
    await refreshItems();

    showItemFormMessage(
      "ITEM SALVO COM SUCESSO.",
      "success"
    );

    /*
      Aguarda um pequeno momento para o usuário
      enxergar a mensagem de sucesso.
    */
    window.setTimeout(() => {
      setItemSaving(false);
      closeItemModal();
    }, 450);
  } catch (error) {
    console.error(
      "Erro ao salvar item:",
      error
    );

    showItemFormMessage(
      formatItemDatabaseError(
        error
      ),
      "error"
    );

    setItemSaving(false);
  }
}

function setItemSaving(isSaving) {
  state.isSavingItem =
    isSaving;

  elements.itemForm
    .querySelectorAll(
      "input, textarea, select, button"
    )
    .forEach(control => {
      control.disabled =
        isSaving;
    });

  if (!isSaving) {
    elements.itemKey.disabled =
      false;

    updateItemQuantityInterface();
  }

  elements.saveItemButton.textContent =
    isSaving
      ? "SALVANDO..."
      : "SALVAR ITEM";
}


function clearItemFormMessage() {
  elements.itemFormMessage.className =
    "form-message";

  elements.itemFormMessage.textContent =
    "";
}


function showItemFormMessage(
  message,
  type = ""
) {
  elements.itemFormMessage.className =
    "form-message";

  if (type) {
    elements.itemFormMessage.classList.add(
      `is-${type}`
    );
  }

  elements.itemFormMessage.textContent =
    message || "";
}

function handleItemListClick(event) {
  /*
    Descobre se o jogador clicou em um botão
    de ação dentro de algum cartão de Item.
  */
  const button =
    event.target.closest(
      "[data-item-action]"
    );

  if (!button) {
    return;
  }

  /*
    Recupera o ID do Item associado ao botão.
  */
  const itemId =
    button.dataset.itemId;

  if (!itemId) {
    return;
  }

  /*
    Executa a ação correspondente ao botão.
  */
  switch (
    button.dataset.itemAction
  ) {
    case "edit":
      openEditItemModal(
        itemId
      );
      break;

    case "more":
      openItemActionsModal(
        itemId
      );
      break;
  }
}


function openItemActionsModal(itemId) {
  /*
    Localiza o Item usando o ID recebido.
  */
  const item =
    getItemById(itemId);

  if (!item) {
    showItemListMessage(
      "O item selecionado não foi encontrado.",
      "error"
    );

    return;
  }

  /*
    Guarda qual Item está com o menu
    de ações aberto.
  */
  state.actionsItemId =
    item.id;

  /*
    Coloca o nome do Item no título do modal.
  */
  elements.itemActionsTitle.textContent =
    item.name ||
    item.item_key ||
    "Item";

  /*
    Muda o texto do botão conforme o estado atual.
  */
  elements.toggleItemButton
    .querySelector("strong")
    .textContent =
      item.is_enabled
        ? "DESATIVAR ITEM"
        : "ATIVAR ITEM";

  elements.toggleItemButton
    .querySelector("span")
    .textContent =
      item.is_enabled
        ? "Impede temporariamente o uso deste item."
        : "Permite novamente o uso deste item.";

  /*
    Exibe o modal.
  */
  elements.itemActionsModal.classList.remove(
    "is-hidden"
  );

  updateBodyOverflow();
}

function getItemById(itemId) {
  return state.items.find(
    item => item.id === itemId
  ) || null;
}

async function duplicateSelectedItem() {
  const item =
    getItemById(
      state.actionsItemId
    );

  if (!item) {
    return;
  }

  elements.duplicateItemButton.disabled =
    true;

  showItemListMessage(
    "DUPLICANDO ITEM..."
  );

  try {
    const {
      error
    } = await state.client.rpc(
      "duplicate_item",
      {
        p_item_id:
          item.id
      }
    );

    if (error) {
      throw error;
    }

    closeItemActionsModal();

    await refreshItems();

    showItemListMessage(
      "ITEM DUPLICADO COM SUCESSO.",
      "success"
    );
  } catch (error) {
    console.error(
      "Erro ao duplicar item:",
      error
    );

    showItemListMessage(
      formatItemDatabaseError(error),
      "error"
    );
  } finally {
    elements.duplicateItemButton.disabled =
      false;
  }
}

async function toggleSelectedItem() {
  const item =
    getItemById(
      state.actionsItemId
    );

  if (!item) {
    return;
  }

  const newEnabledState =
    !item.is_enabled;

  elements.toggleItemButton.disabled =
    true;

  showItemListMessage(
    newEnabledState
      ? "ATIVANDO ITEM..."
      : "DESATIVANDO ITEM..."
  );

  try {
    const {
      error
    } = await state.client
      .from("items")
      .update({
        is_enabled:
          newEnabledState
      })
      .eq(
        "id",
        item.id
      )
      .eq(
        "game_id",
        state.game.id
      );

    if (error) {
      throw error;
    }

    closeItemActionsModal();

    await refreshItems();

    showItemListMessage(
      newEnabledState
        ? "ITEM ATIVADO COM SUCESSO."
        : "ITEM DESATIVADO COM SUCESSO.",
      "success"
    );
  } catch (error) {
    console.error(
      "Erro ao alterar item:",
      error
    );

    showItemListMessage(
      formatItemDatabaseError(error),
      "error"
    );
  } finally {
    elements.toggleItemButton.disabled =
      false;
  }
}


async function deleteSelectedItem() {
  const item =
    getItemById(
      state.actionsItemId
    );

  if (!item) {
    return;
  }

  const confirmation =
    window.confirm(
      `Excluir permanentemente o item "${item.name}"?\n\n` +
      "Esta ação não poderá ser desfeita."
    );

  if (!confirmation) {
    return;
  }

  elements.deleteItemButton.disabled =
    true;

  showItemListMessage(
    "EXCLUINDO ITEM..."
  );

  try {
    const {
      error
    } = await state.client
      .from("items")
      .delete()
      .eq(
        "id",
        item.id
      )
      .eq(
        "game_id",
        state.game.id
      );

    if (error) {
      throw error;
    }

    closeItemActionsModal();

    await refreshItems();

    showItemListMessage(
      "ITEM EXCLUÍDO COM SUCESSO.",
      "success"
    );
  } catch (error) {
    console.error(
      "Erro ao excluir item:",
      error
    );

    showItemListMessage(
      formatItemDatabaseError(error),
      "error"
    );
  } finally {
    elements.deleteItemButton.disabled =
      false;
  }
}

/* ==========================================================
   ERROS DO EDITOR DE ITENS
   ========================================================== */

function formatItemDatabaseError(error) {
  /*
    Tenta recuperar a mensagem em qualquer
    formato devolvido pelo Supabase.
  */
  const message =
    String(
      error?.message ||
      error?.details ||
      error?.hint ||
      error ||
      "Não foi possível concluir a operação."
    );

  const lowerMessage =
    message.toLocaleLowerCase(
      "pt-BR"
    );

  /*
    Identificador duplicado.
  */
  if (
    lowerMessage.includes(
      "items_game_item_key_unique"
    ) ||
    (
      lowerMessage.includes(
        "duplicate key value"
      ) &&
      lowerMessage.includes(
        "item_key"
      )
    )
  ) {
    return (
      "Já existe um item com esse identificador."
    );
  }

  /*
    Tipo de Item inválido.
  */
  if (
    lowerMessage.includes(
      "items_item_type_check"
    )
  ) {
    return (
      "O tipo selecionado não é permitido."
    );
  }

  /*
    Quantidade fora dos limites.
  */
  if (
    lowerMessage.includes(
      "items_maximum_quantity_check"
    )
  ) {
    return (
      "A quantidade máxima deve estar entre 1 e 999."
    );
  }

  /*
    Item ligado a inventários ou outros registros.
  */
  if (
    lowerMessage.includes(
      "foreign key constraint"
    ) ||
    lowerMessage.includes(
      "violates foreign key"
    )
  ) {
    return (
      "Este item já está sendo utilizado em uma partida " +
      "ou em outra parte do jogo. Desative o item em vez de excluí-lo."
    );
  }

  /*
    Problema de permissão ou RLS.
  */
  if (
    lowerMessage.includes(
      "row-level security"
    ) ||
    lowerMessage.includes(
      "permission denied"
    ) ||
    lowerMessage.includes(
      "not authorized"
    )
  ) {
    return (
      "Sua conta não possui permissão para alterar este item."
    );
  }

  /*
    Função SQL de duplicação ausente.
  */
  if (
    lowerMessage.includes(
      "duplicate_item"
    ) &&
    (
      lowerMessage.includes(
        "does not exist"
      ) ||
      lowerMessage.includes(
        "could not find"
      )
    )
  ) {
    return (
      "A função de duplicação de Itens ainda não existe no Supabase."
    );
  }

  /*
    Item não encontrado.
  */
  if (
    lowerMessage.includes(
      "item não encontrado"
    )
  ) {
    return (
      "O item selecionado não foi encontrado."
    );
  }

  return message;
}

/* ==========================================================
   UTILIDADES
   ========================================================== */

function normalizeText(value) {
  return String(value || "")
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function emptyToNull(value) {
  const trimmed =
    String(value || "")
      .trim();

  return trimmed ||
    null;
}

function isValidHttpUrl(value) {
  try {
    const url =
      new URL(
        String(value)
      );

    return (
      url.protocol ===
        "http:" ||
      url.protocol ===
        "https:"
    );
  } catch {
    return false;
  }
}


/* ==========================================================
   TRATAMENTO DE ERROS
   ========================================================== */

function formatDatabaseError(error) {
  const message =
    String(
      error?.message ||
      error?.details ||
      "Erro desconhecido."
    );

  const lowerMessage =
    message.toLocaleLowerCase(
      "pt-BR"
    );

  if (
    lowerMessage.includes(
      "scenes_game_key_unique"
    ) ||
    lowerMessage.includes(
      "duplicate key value"
    )
  ) {
    return (
      "Já existe um registro com esse identificador."
    );
  }

  if (
    lowerMessage.includes(
      "row-level security"
    ) ||
    lowerMessage.includes(
      "violates row-level security"
    )
  ) {
    return (
      "A operação foi bloqueada pelas permissões do banco."
    );
  }

  if (
    lowerMessage.includes(
      "permission denied"
    )
  ) {
    return (
      "A conta não possui permissão para alterar esta tabela."
    );
  }

  if (
    lowerMessage.includes(
      "failed to fetch"
    ) ||
    lowerMessage.includes(
      "networkerror"
    )
  ) {
    return (
      "Não foi possível alcançar o Supabase. Confira sua internet."
    );
  }

  if (
    lowerMessage.includes(
      "normalize_scene_block_order"
    )
  ) {
    return (
      "A função de organização dos blocos não foi encontrada ou não possui permissão."
    );
  }

  if (
    lowerMessage.includes(
      "move_scene_block"
    )
  ) {
    return (
      "A função de movimentação dos blocos não foi encontrada ou não possui permissão."
    );
  }

  if (
    lowerMessage.includes(
      "foreign key constraint"
    )
  ) {
    return (
      "A operação não pôde ser concluída porque existem dados relacionados."
    );
  }

  if (
    lowerMessage.includes(
      "check constraint"
    )
  ) {
    return (
      "Um dos valores informados não é aceito pelo banco de dados."
    );
  }

  return message;
}

function formatMediaError(error) {
  const message =
    String(
      error?.message ||
      error?.details ||
      "Erro desconhecido."
    );

  const lowerMessage =
    message.toLocaleLowerCase(
      "pt-BR"
    );

  if (
    lowerMessage.includes(
      "maximum allowed size"
    ) ||
    lowerMessage.includes(
      "payload too large"
    )
  ) {
    return (
      "O arquivo é maior que o limite permitido."
    );
  }

  if (
    lowerMessage.includes(
      "mime type"
    )
  ) {
    return (
      "O formato do arquivo não é permitido."
    );
  }

  if (
    lowerMessage.includes(
      "row-level security"
    ) ||
    lowerMessage.includes(
      "unauthorized"
    )
  ) {
    return (
      "A operação foi bloqueada pelas permissões do Storage."
    );
  }

  if (
    lowerMessage.includes(
      "already exists"
    ) ||
    lowerMessage.includes(
      "duplicate"
    )
  ) {
    return (
      "Já existe um arquivo com esse endereço."
    );
  }

  if (
    lowerMessage.includes(
      "bucket not found"
    )
  ) {
    return (
      "O bucket adventure-media não foi encontrado."
    );
  }

  if (
    lowerMessage.includes(
      "scene_responses_scene_key_unique"
    )
  ) {
    return (
      "Já existe um caminho com esse identificador nesta cena."
    );
  }

  if (
    lowerMessage.includes(
      "caminho não encontrado"
    )
  ) {
    return (
      "O caminho selecionado não foi encontrado."
    );
  }

  if (
    lowerMessage.includes(
      "acesso administrativo necessário"
    )
  ) {
    return (
      "Sua sessão não possui autorização administrativa."
    );
  }

  if (
    lowerMessage.includes(
      "invalid input syntax for type uuid"
    )
  ) {
    return (
      "Uma das cenas ou rotas selecionadas possui um identificador inválido."
    );
  }

     if (
    lowerMessage.includes(
      "routes_game_code_unique"
    )
  ) {
    return (
      "Já existe uma rota com esse código interno."
    );
  }

  if (
    lowerMessage.includes(
      "duplicate_route"
    )
  ) {
    return (
      "Não foi possível duplicar a rota."
    );
  }

  if (
    lowerMessage.includes(
      "rota não encontrada"
    )
  ) {
    return (
      "A rota selecionada não foi encontrada."
    );
  }

  if (
  lowerMessage.includes(
    "informe o nome da rota"
  ) ||
  lowerMessage.includes(
    "informe o código interno da rota"
  ) ||
  lowerMessage.includes(
    "imagem de fundo precisa"
  )
) {
  return message;
}

return message;
}

/* ==========================================================
   NAVEGAÇÃO ADMINISTRATIVA
   ========================================================== */

function handleNavigationClick(event) {
  const button = event.currentTarget;

  if (button.disabled) {
    return;
  }

  const section =
    button.dataset.section;

  if (!section) {
    return;
  }

  showAdminSection(section);
}

function showAdminSection(section) {
  state.currentSection = section;

  elements.navigationItems.forEach(
    navigationItem => {
      navigationItem.classList.toggle(
        "is-active",
        navigationItem.dataset.section === section
      );
    }
  );

  document
    .querySelectorAll(".admin-section")
    .forEach(sectionElement => {
      sectionElement.classList.toggle(
        "is-hidden",
        sectionElement.id !== `${section}-section`
      );
    });

  if (section === "scenes") {
    applySceneFilters();
  } else if (section === "responses") {
    applyResponseFilters();
  } else if (section === "routes") {
    applyRouteFilters();
  } else if (section === "items") {
    applyItemFilters();
  } else {
    loadDefinitiveSection(section);
  }
}

/* ==========================================================
   SELETORES DOS CAMINHOS
   ========================================================== */

function populateResponseSelectors() {
  const sortedScenes = [...state.scenes].sort(
    (firstScene, secondScene) => {
      const firstName =
        firstScene.title ||
        firstScene.scene_key;

      const secondName =
        secondScene.title ||
        secondScene.scene_key;

      return firstName.localeCompare(
        secondName,
        "pt-BR"
      );
    }
  );

   sortedScenes.forEach(scene => {
    const label =
      scene.title
        ? `${scene.title} — ${scene.scene_key}`
        : scene.scene_key;

    appendOption(
      elements.responseSceneFilter,
      scene.id,
      label
    );

    appendOption(
      elements.responseSourceScene,
      scene.id,
      label
    );

    appendOption(
      elements.responseTargetScene,
      scene.id,
      label
    );
  });

  repopulateResponseRouteSelector();
}

function appendOption(
  selectElement,
  value,
  label
) {
  const option =
    document.createElement("option");

  option.value = value;
  option.textContent = label;

  selectElement.appendChild(option);
}

/* ==========================================================
   SELETORES DE ITENS DOS CAMINHOS
   ========================================================== */

function populateResponseItemSelectors() {
  /*
    Guarda os valores atuais.

    Isso evita perder a seleção caso a lista
    seja atualizada depois de criar ou editar um Item.
  */
  const currentRequiredItem =
    elements.responseRequiredItem.value;

  const currentGiveItem =
    elements.responseGiveItem.value;

  const currentRemoveItem =
    elements.responseRemoveItem.value;

  /*
    Remove somente as opções criadas pelo JavaScript.

    As opções iniciais, como "Nenhum item exigido",
    permanecem no HTML.
  */
  [
    elements.responseRequiredItem,
    elements.responseGiveItem,
    elements.responseRemoveItem
  ].forEach(selectElement => {
    selectElement
      .querySelectorAll(
        'option[data-dynamic-item="true"]'
      )
      .forEach(option => {
        option.remove();
      });
  });

  /*
    Organiza os Itens primeiro pela ordem definida
    no painel e depois pelo nome.
  */
  const sortedItems =
    [...state.items].sort(
      (firstItem, secondItem) => {
        const orderDifference =
          (
            Number(
              firstItem.display_order
            ) || 0
          ) -
          (
            Number(
              secondItem.display_order
            ) || 0
          );

        if (orderDifference !== 0) {
          return orderDifference;
        }

        return String(
          firstItem.name || ""
        ).localeCompare(
          String(
            secondItem.name || ""
          ),
          "pt-BR"
        );
      }
    );

  sortedItems.forEach(item => {
    /*
      Um Item desativado continua aparecendo no painel,
      mas recebe uma indicação no nome.

      Isso permite identificar Caminhos antigos que
      ainda estejam ligados a esse Item.
    */
    const itemLabel = [
      item.name || item.item_key,
      item.is_enabled
        ? ""
        : "— desativado",
      item.is_secret
        ? "— secreto"
        : ""
    ]
      .filter(Boolean)
      .join(" ");

    [
      elements.responseRequiredItem,
      elements.responseGiveItem,
      elements.responseRemoveItem
    ].forEach(selectElement => {
      const option =
        document.createElement("option");

      /*
        Usaremos o identificador interno como valor.

        Exemplo:
        chave_enferrujada
      */
      option.value =
        item.item_key;

      option.textContent =
        itemLabel;

      option.dataset.dynamicItem =
        "true";

      selectElement.appendChild(
        option
      );
    });
  });

  /*
    Tenta restaurar as seleções anteriores.
  */
  elements.responseRequiredItem.value =
    currentRequiredItem;

  elements.responseGiveItem.value =
    currentGiveItem;

  elements.responseRemoveItem.value =
    currentRemoveItem;

  updateResponseItemInterface();
}

/* ==========================================================
   INTERFACE DE ITENS DO CAMINHO
   ========================================================== */

function updateResponseItemInterface() {
  const requiredItem =
    getItemByKey(
      elements.responseRequiredItem.value
    );

  const giveItem =
    getItemByKey(
      elements.responseGiveItem.value
    );

  const removeItem =
    getItemByKey(
      elements.responseRemoveItem.value
    );


  /*
    ITEM EXIGIDO
  */

  const hasRequiredItem =
    Boolean(requiredItem);

  elements.responseMissingItemField.classList.toggle(
    "is-hidden",
    !hasRequiredItem
  );

  elements.responseConsumeRequiredItemOption.classList.toggle(
    "is-hidden",
    !hasRequiredItem
  );

  if (!hasRequiredItem) {
    elements.responseMissingItemText.value =
      "";

    elements.responseConsumeRequiredItem.checked =
      false;
  }


  /*
    ITEM ENTREGUE
  */

  const hasGiveItem =
    Boolean(giveItem);

  elements.responseGiveItemQuantityField.classList.toggle(
    "is-hidden",
    !hasGiveItem
  );

  if (!hasGiveItem) {
    elements.responseGiveItemQuantity.value =
      "1";
  } else if (!giveItem.is_stackable) {
    /*
      Itens únicos sempre são entregues
      em uma única unidade.
    */
    elements.responseGiveItemQuantity.value =
      "1";

    elements.responseGiveItemQuantity.disabled =
      true;
  } else {
    elements.responseGiveItemQuantity.disabled =
      false;

    const maximumQuantity =
      Math.max(
        1,
        Number(
          giveItem.maximum_quantity
        ) || 1
      );

    elements.responseGiveItemQuantity.max =
      String(maximumQuantity);

    const currentQuantity =
      Number(
        elements.responseGiveItemQuantity.value
      ) || 1;

    elements.responseGiveItemQuantity.value =
      String(
        Math.min(
          Math.max(
            currentQuantity,
            1
          ),
          maximumQuantity
        )
      );
  }


  /*
    ITEM REMOVIDO
  */

  const hasRemoveItem =
    Boolean(removeItem);

  elements.responseRemoveItemQuantityField.classList.toggle(
    "is-hidden",
    !hasRemoveItem
  );

  if (!hasRemoveItem) {
    elements.responseRemoveItemQuantity.value =
      "1";
  } else if (!removeItem.is_stackable) {
    elements.responseRemoveItemQuantity.value =
      "1";

    elements.responseRemoveItemQuantity.disabled =
      true;
  } else {
    elements.responseRemoveItemQuantity.disabled =
      false;

    const maximumQuantity =
      Math.max(
        1,
        Number(
          removeItem.maximum_quantity
        ) || 1
      );

    elements.responseRemoveItemQuantity.max =
      String(maximumQuantity);

    const currentQuantity =
      Number(
        elements.responseRemoveItemQuantity.value
      ) || 1;

    elements.responseRemoveItemQuantity.value =
      String(
        Math.min(
          Math.max(
            currentQuantity,
            1
          ),
          maximumQuantity
        )
      );
  }
}


function getItemByKey(itemKey) {
  if (!itemKey) {
    return null;
  }

  return state.items.find(
    item =>
      item.item_key === itemKey
  ) || null;
}

/* ==========================================================
   CARREGAR E ATUALIZAR CAMINHOS
   ========================================================== */

async function refreshResponses() {
  showResponseListMessage(
    "ATUALIZANDO CAMINHOS..."
  );

  const {
    data,
    error
  } = await state.client
    .from("scene_responses")
    .select(`
      id,
      scene_id,
      response_key,
      admin_description,
      match_mode,
      exact_phrase,
      required_words,
      optional_words,
      forbidden_words,
      synonyms,
      response_text,
      target_scene_id,
      target_route_id,
      priority,
      display_order,
      is_enabled,
      created_at,
      updated_at
    `)
    .in(
      "scene_id",
      state.scenes.map(scene => scene.id)
    )
    .order("priority", {
      ascending: false
    })
    .order("display_order", {
      ascending: true
    });

  if (error) {
    throw error;
  }

  state.responses = data || [];

  applyResponseFilters();
}


/* ==========================================================
   FILTROS DOS CAMINHOS
   ========================================================== */

function applyResponseFilters() {
  const searchTerm =
    normalizeText(
      elements.responseSearch.value
    );

  const sceneFilter =
    elements.responseSceneFilter.value;

  const modeFilter =
    elements.responseModeFilter.value;

  const statusFilter =
    elements.responseStatusFilter.value;

  state.filteredResponses =
    state.responses.filter(response => {
      const searchableText =
        normalizeText([
          response.response_key,
          response.admin_description,
          response.exact_phrase,
          response.response_text,
          ...(response.required_words || []),
          ...(response.optional_words || []),
          ...(response.forbidden_words || [])
        ].filter(Boolean).join(" "));

      const matchesSearch =
        !searchTerm ||
        searchableText.includes(searchTerm);

      const matchesScene =
        !sceneFilter ||
        response.scene_id === sceneFilter;

      const matchesMode =
        !modeFilter ||
        response.match_mode === modeFilter;

      let matchesStatus = true;

      switch (statusFilter) {
        case "active":
          matchesStatus =
            response.is_enabled === true;
          break;

        case "inactive":
          matchesStatus =
            response.is_enabled === false;
          break;

        case "destination":
          matchesStatus =
            Boolean(
              response.target_scene_id ||
              response.target_route_id
            );
          break;

        default:
          matchesStatus = true;
      }

      return (
        matchesSearch &&
        matchesScene &&
        matchesMode &&
        matchesStatus
      );
    });

  updateResponseStatistics();
  renderResponseList();
}

function updateResponseStatistics() {
  elements.totalResponses.textContent =
    String(state.responses.length);

  elements.activeResponses.textContent =
    String(
      state.responses.filter(
        response => response.is_enabled
      ).length
    );

  elements.inactiveResponses.textContent =
    String(
      state.responses.filter(
        response => !response.is_enabled
      ).length
    );

  elements.destinationResponses.textContent =
    String(
      state.responses.filter(
        response =>
          response.target_scene_id ||
          response.target_route_id
      ).length
    );
}


/* ==========================================================
   LISTA DE CAMINHOS
   ========================================================== */

function renderResponseList() {
  elements.responseList.replaceChildren();

  if (
    state.filteredResponses.length === 0
  ) {
    const empty =
      document.createElement("div");

    empty.className =
      "response-list__empty";

    empty.textContent =
      "Nenhum caminho corresponde aos filtros selecionados.";

    elements.responseList.appendChild(
      empty
    );

    showResponseListMessage(
      "NENHUM CAMINHO ENCONTRADO."
    );

    return;
  }

  const fragment =
    document.createDocumentFragment();

  state.filteredResponses.forEach(
    response => {
      fragment.appendChild(
        createResponseCard(response)
      );
    }
  );

  elements.responseList.appendChild(
    fragment
  );

  showResponseListMessage(
    `${state.filteredResponses.length} CAMINHO(S) EXIBIDO(S).`
  );
}

function createResponseCard(response) {
  const fragment =
    elements.responseCardTemplate.content
      .cloneNode(true);

  const card =
    fragment.querySelector(
      ".response-card"
    );

  const title =
    fragment.querySelector(
      ".response-card__title"
    );

  const identifier =
    fragment.querySelector(
      ".response-card__identifier"
    );

  const priority =
    fragment.querySelector(
      ".response-card__priority"
    );

  const source =
    fragment.querySelector(
      '[data-response-location="source"]'
    );

  const target =
    fragment.querySelector(
      '[data-response-location="target"]'
    );

  const description =
    fragment.querySelector(
      ".response-card__description"
    );

  const mode =
    fragment.querySelector(
      ".response-card__mode"
    );

  const matcher =
    fragment.querySelector(
      ".response-card__matcher"
    );

  const answer =
    fragment.querySelector(
      ".response-card__answer"
    );

  card.dataset.responseId =
    response.id;

  card.classList.toggle(
    "is-inactive",
    !response.is_enabled
  );

  title.textContent =
    response.admin_description ||
    response.response_key ||
    "Caminho sem nome";

  identifier.textContent =
    response.response_key;

  priority.textContent =
    `PRIORIDADE ${response.priority ?? 100}`;

  const sourceScene =
    getSceneById(response.scene_id);

  const targetScene =
    getSceneById(
      response.target_scene_id
    );

  const targetRoute =
    getRouteById(
      response.target_route_id
    );

  source.textContent =
    sourceScene
      ? (
          sourceScene.title ||
          sourceScene.scene_key
        )
      : "ORIGEM DESCONHECIDA";

  if (targetScene && targetRoute) {
    target.textContent =
      `${
        targetScene.title ||
        targetScene.scene_key
      } · ROTA ${targetRoute.name}`;
  } else if (targetScene) {
    target.textContent =
      targetScene.title ||
      targetScene.scene_key;
  } else if (targetRoute) {
    target.textContent =
      `MESMA CENA · ROTA ${targetRoute.name}`;
  } else {
    target.textContent =
      "MESMA CENA";
  }

  description.textContent =
    response.admin_description ||
    "Nenhuma descrição administrativa.";

  mode.textContent =
    formatResponseMatchMode(
      response.match_mode
    );

  matcher.textContent =
    formatResponseMatcher(response);

  answer.textContent =
    response.response_text ||
    "Sem texto de resposta.";

  fragment
    .querySelectorAll(
      "[data-response-action]"
    )
    .forEach(button => {
      button.dataset.responseId =
        response.id;
    });

  return fragment;
}

function getSceneById(sceneId) {
  return state.scenes.find(
    scene => scene.id === sceneId
  ) || null;
}

function formatResponseMatchMode(mode) {
  const names = {
    exact: "FRASE EXATA",
    keywords: "PALAVRAS COMBINADAS",
    any_keyword: "QUALQUER PALAVRA"
  };

  return names[mode] || mode;
}

function formatResponseMatcher(response) {
  if (response.match_mode === "exact") {
    return response.exact_phrase ||
      "Frase não cadastrada";
  }

  const sections = [];

  if (
    response.required_words?.length
  ) {
    sections.push(
      `obrigatórias: ${
        response.required_words.join(", ")
      }`
    );
  }

  if (
    response.optional_words?.length
  ) {
    sections.push(
      `opcionais: ${
        response.optional_words.join(", ")
      }`
    );
  }

  if (
    response.forbidden_words?.length
  ) {
    sections.push(
      `proibidas: ${
        response.forbidden_words.join(", ")
      }`
    );
  }

  return sections.length > 0
    ? sections.join(" | ")
    : "Nenhuma palavra cadastrada";
}

function showResponseListMessage(
  message,
  type = ""
) {
  elements.responseListMessage.className =
    "scene-list-message";

  if (type) {
    elements.responseListMessage.classList.add(
      `is-${type}`
    );
  }

  elements.responseListMessage.textContent =
    message || "";
}


/* ==========================================================
   CLIQUES DA LISTA
   ========================================================== */

function handleResponseListClick(event) {
  const button = event.target.closest(
    "[data-response-action]"
  );

  if (!button) {
    return;
  }

  const responseId =
    button.dataset.responseId;

  if (!responseId) {
    return;
  }

  switch (button.dataset.responseAction) {
    case "edit":
      openEditResponseModal(
        responseId
      );
      break;

    case "more":
      openResponseActionsModal(
        responseId
      );
      break;
  }
}


/* ==========================================================
   MODAL DO CAMINHO
   ========================================================== */

function openNewResponseModal() {
  state.editingResponseId = null;

  resetResponseForm();

  elements.responseModalTitle.textContent =
    "Novo caminho";

  elements.responseKey.disabled = false;

  openResponseModal();
}

function openEditResponseModal(responseId) {
  const response =
    state.responses.find(
      item => item.id === responseId
    );

  if (!response) {
    showResponseListMessage(
      "O caminho selecionado não foi encontrado.",
      "error"
    );

    return;
  }

  state.editingResponseId =
    response.id;

  fillResponseForm(response);

  elements.responseModalTitle.textContent =
    response.admin_description ||
    response.response_key;

  /*
    O identificador e a cena de origem permanecem
    bloqueados para evitar quebrar referências.
  */
  elements.responseKey.disabled = true;

  elements.responseSourceScene.disabled =
    true;

  openResponseModal();
}

function openResponseModal() {
  clearResponseFormMessage();

  elements.responseModal.classList.remove(
    "is-hidden"
  );

  document.body.style.overflow =
    "hidden";

  window.setTimeout(() => {
    elements.responseKey.focus();
  }, 50);
}

function closeResponseModal() {
  if (state.isSavingResponse) {
    return;
  }

  elements.responseModal.classList.add(
    "is-hidden"
  );

  document.body.style.overflow = "";

  state.editingResponseId = null;

  elements.responseSourceScene.disabled =
    false;
}

function handleResponseModalClick(event) {
  if (
    event.target.closest(
      "[data-close-response-modal]"
    )
  ) {
    closeResponseModal();
  }
}

function resetResponseForm() {
  elements.responseForm.reset();

  elements.responseId.value = "";
  elements.responseKey.value = "";

  elements.responseSourceScene.value =
    elements.responseSceneFilter.value || "";

  elements.responseMatchMode.value =
    "exact";

  elements.responsePriority.value =
    "100";

  elements.responseEnabled.checked =
    true;

  elements.responseTargetScene.value =
    "";

  elements.responseTargetRoute.value =
    "";

  if (elements.responseConditionRules) {
    elements.responseConditionRules.value = "[]";
  }

  if (elements.responseEffectRules) {
    elements.responseEffectRules.value = "[]";
  }

     /*
    Limpa todas as configurações de Itens.
  */
  elements.responseRequiredItem.value =
    "";

  elements.responseMissingItemText.value =
    "";

  elements.responseConsumeRequiredItem.checked =
    false;

  elements.responseGiveItem.value =
    "";

  elements.responseGiveItemQuantity.value =
    "1";

  elements.responseRemoveItem.value =
    "";

  elements.responseRemoveItemQuantity.value =
    "1";
   
  elements.responseKey.disabled =
    false;

  elements.responseSourceScene.disabled =
    false;

  updateResponseModeInterface();
  updateResponseDestinationPreview();
   updateResponseItemInterface();

  clearResponseFormMessage();

  resetResponseTestResult();
}

function fillResponseForm(response) {
  elements.responseId.value =
    response.id;

  elements.responseKey.value =
    response.response_key || "";

  elements.responseSourceScene.value =
    response.scene_id || "";

  elements.responseDescription.value =
    response.admin_description || "";

  elements.responseMatchMode.value =
    response.match_mode || "keywords";

  elements.responseExactPhrase.value =
    response.exact_phrase || "";

  elements.responseRequiredWords.value =
    formatWordArrayForField(
      response.required_words
    );

  elements.responseOptionalWords.value =
    formatWordArrayForField(
      response.optional_words
    );

  elements.responseForbiddenWords.value =
    formatWordArrayForField(
      response.forbidden_words
    );

  elements.responseSynonyms.value =
    formatSynonymsForField(
      response.synonyms
    );

  elements.responseText.value =
    response.response_text || "";

  elements.responseTargetScene.value =
    response.target_scene_id || "";

  elements.responseTargetRoute.value =
    response.target_route_id || "";

  elements.responsePriority.value =
    String(response.priority ?? 100);

  elements.responseEnabled.checked =
    response.is_enabled === true;

  if (elements.responseConditionRules) {
    elements.responseConditionRules.value =
      formatJsonField(response.condition_rules, []);
  }

  if (elements.responseEffectRules) {
    elements.responseEffectRules.value =
      formatJsonField(response.effect_rules, []);
  }

  updateResponseModeInterface();
  updateResponseDestinationPreview();

  clearResponseFormMessage();
  resetResponseTestResult();
}


/* ==========================================================
   INTERFACE DO CAMINHO
   ========================================================== */

function updateResponseModeInterface() {
  const mode =
    elements.responseMatchMode.value;

  elements.exactPhraseField.classList.toggle(
    "is-hidden",
    mode !== "exact"
  );

  elements.keywordFields.classList.toggle(
    "is-hidden",
    mode === "exact"
  );

  testCurrentResponseRule();
}

function updateResponseDestinationPreview() {
  const targetScene =
    getSceneById(
      elements.responseTargetScene.value
    );

  const targetRoute =
    getRouteById(
      elements.responseTargetRoute.value
    );

  let message =
    "O jogador permanecerá na cena e na rota atuais.";

  if (targetScene && targetRoute) {
    message =
      `O jogador irá para “${
        targetScene.title ||
        targetScene.scene_key
      }” e entrará na rota “${targetRoute.name}”.`;
  } else if (targetScene) {
    message =
      `O jogador irá para “${
        targetScene.title ||
        targetScene.scene_key
      }” e manterá a rota atual.`;
  } else if (targetRoute) {
    message =
      `O jogador permanecerá na cena atual e entrará na rota “${targetRoute.name}”.`;
  }

  elements.responseDestinationPreview.textContent =
    message;
}

function handleResponseKeyInput() {
  if (elements.responseKey.disabled) {
    return;
  }

  elements.responseKey.value =
    normalizeSceneKey(
      elements.responseKey.value
    );
}


/* ==========================================================
   CONVERTER PALAVRAS E SINÔNIMOS
   ========================================================== */

function parseWordList(value) {
  const words = String(value || "")
    .split(/[\n,;]+/)
    .map(word =>
      normalizeCommandText(word)
    )
    .filter(Boolean);

  return [...new Set(words)];
}

function formatWordArrayForField(words) {
  return Array.isArray(words)
    ? words.join(", ")
    : "";
}

function parseSynonyms(value) {
  const result = {};

  String(value || "")
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean)
    .forEach(line => {
      const separatorIndex =
        line.indexOf("=");

      if (separatorIndex === -1) {
        return;
      }

      const mainWord =
        normalizeCommandText(
          line.slice(
            0,
            separatorIndex
          )
        );

      const synonyms =
        parseWordList(
          line.slice(
            separatorIndex + 1
          )
        );

      if (
        mainWord &&
        synonyms.length > 0
      ) {
        result[mainWord] = synonyms;
      }
    });

  return result;
}

function formatSynonymsForField(synonyms) {
  if (
    !synonyms ||
    typeof synonyms !== "object"
  ) {
    return "";
  }

  return Object.entries(synonyms)
    .map(([word, values]) => {
      const synonymList =
        Array.isArray(values)
          ? values
          : [];

      return (
        `${word} = ` +
        synonymList.join(", ")
      );
    })
    .join("\n");
}


/* ==========================================================
   SALVAR CAMINHO
   ========================================================== */

async function handleResponseFormSubmit(event) {
  event.preventDefault();

  if (state.isSavingResponse) {
    return;
  }

  const responseData =
    collectResponseFormData();

  const validationError =
    validateResponseData(
      responseData
    );

  if (validationError) {
    showResponseFormMessage(
      validationError,
      "error"
    );

    return;
  }

  setResponseSaving(true);

  showResponseFormMessage(
    "SALVANDO CAMINHO..."
  );

  try {
    if (state.editingResponseId) {
      await updateResponse(
        state.editingResponseId,
        responseData
      );
    } else {
      await createResponse(
        responseData
      );
    }

    showResponseFormMessage(
      "CAMINHO SALVO COM SUCESSO.",
      "success"
    );

    await refreshResponses();

    window.setTimeout(() => {
      closeResponseModal();
    }, 450);
  } catch (error) {
    console.error(
      "Erro ao salvar caminho:",
      error
    );

    showResponseFormMessage(
      formatDatabaseError(error),
      "error"
    );
  } finally {
    setResponseSaving(false);
  }
}

function collectResponseFormData() {
  const matchMode =
    elements.responseMatchMode.value;

  return {
    scene_id:
      elements.responseSourceScene.value,

    response_key:
      normalizeSceneKey(
        elements.responseKey.value
      ),

    admin_description:
      emptyToNull(
        elements.responseDescription.value
      ),

    match_mode:
      matchMode,

    exact_phrase:
      matchMode === "exact"
        ? emptyToNull(
            elements.responseExactPhrase.value
          )
        : null,

    required_words:
      matchMode !== "exact"
        ? parseWordList(
            elements.responseRequiredWords.value
          )
        : [],

    optional_words:
      matchMode !== "exact"
        ? parseWordList(
            elements.responseOptionalWords.value
          )
        : [],

    forbidden_words:
      matchMode !== "exact"
        ? parseWordList(
            elements.responseForbiddenWords.value
          )
        : [],

    synonyms:
      parseSynonyms(
        elements.responseSynonyms.value
      ),

    response_text:
      emptyToNull(
        elements.responseText.value
      ),

    target_scene_id:
      elements.responseTargetScene.value ||
      null,

    target_route_id:
      elements.responseTargetRoute.value ||
      null,

    condition_rules:
      parseJsonField(
        elements.responseConditionRules?.value,
        []
      ),

    effect_rules:
      parseJsonField(
        elements.responseEffectRules?.value,
        []
      ),

    priority:
      Number.parseInt(
        elements.responsePriority.value,
        10
      ) || 100,

    is_enabled:
      elements.responseEnabled.checked
  };
}

function validateResponseData(responseData) {
  if (!responseData.response_key) {
    return (
      "Informe o identificador interno do caminho."
    );
  }

  if (!responseData.scene_id) {
    return "Selecione a cena de origem.";
  }

  if (
    responseData.match_mode === "exact" &&
    !responseData.exact_phrase
  ) {
    return "Informe a frase exata.";
  }

  if (
    responseData.match_mode === "keywords" &&
    responseData.required_words.length === 0
  ) {
    return (
      "Cadastre pelo menos uma palavra obrigatória."
    );
  }

  if (
    responseData.match_mode ===
      "any_keyword" &&
    responseData.required_words.length === 0 &&
    responseData.optional_words.length === 0
  ) {
    return (
      "Cadastre pelo menos uma palavra obrigatória ou opcional."
    );
  }

  if (
    !responseData.response_text &&
    !responseData.target_scene_id &&
    !responseData.target_route_id
  ) {
    return (
      "O caminho precisa mostrar uma resposta ou alterar cena/rota."
    );
  }

  return null;
}

async function createResponse(
  responseData
) {
  const nextDisplayOrder =
    getNextResponseDisplayOrder(
      responseData.scene_id
    );

  const {
    data,
    error
  } = await state.client
    .from("scene_responses")
    .insert({
      ...responseData,
      display_order:
        nextDisplayOrder
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function updateResponse(
  responseId,
  responseData
) {
  const {
    scene_id,
    response_key,
    ...editableData
  } = responseData;

  const {
    data,
    error
  } = await state.client
    .from("scene_responses")
    .update(editableData)
    .eq("id", responseId)
    .eq("scene_id", scene_id)
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

function getNextResponseDisplayOrder(
  sceneId
) {
  const sceneResponses =
    state.responses.filter(
      response =>
        response.scene_id === sceneId
    );

  if (sceneResponses.length === 0) {
    return 10;
  }

  return Math.max(
    ...sceneResponses.map(
      response =>
        Number(
          response.display_order || 0
        )
    )
  ) + 10;
}

function setResponseSaving(isSaving) {
  state.isSavingResponse =
    isSaving;

  elements.responseForm
    .querySelectorAll(
      "input, textarea, select, button"
    )
    .forEach(control => {
      control.disabled = isSaving;
    });

  if (!isSaving) {
    elements.responseKey.disabled =
      Boolean(
        state.editingResponseId
      );

    elements.responseSourceScene.disabled =
      Boolean(
        state.editingResponseId
      );
  }

  elements.saveResponseButton.textContent =
    isSaving
      ? "SALVANDO..."
      : "SALVAR CAMINHO";
}

function showResponseFormMessage(
  message,
  type = ""
) {
  elements.responseFormMessage.className =
    "form-message";

  if (type) {
    elements.responseFormMessage.classList.add(
      `is-${type}`
    );
  }

  elements.responseFormMessage.textContent =
    message || "";
}

function clearResponseFormMessage() {
  showResponseFormMessage("");
}


/* ==========================================================
   TESTADOR DE COMANDO
   ========================================================== */

function testCurrentResponseRule() {
  const originalCommand =
    elements.responseTestInput.value;

  if (!originalCommand.trim()) {
    resetResponseTestResult();
    return;
  }

  const command =
    normalizeCommandText(
      originalCommand
    );

  const rule =
    collectResponseFormData();

  const matched =
    responseRuleMatchesCommand(
      rule,
      command
    );

  elements.responseTestResult.className =
    "response-test-result";

  elements.responseTestResult.classList.add(
    matched
      ? "is-match"
      : "is-no-match"
  );

  elements.responseTestResult.textContent =
    matched
      ? "CORRESPONDE: este caminho reconheceria o comando."
      : "NÃO CORRESPONDE: este caminho seria ignorado.";
}

function resetResponseTestResult() {
  elements.responseTestResult.className =
    "response-test-result";

  elements.responseTestResult.textContent =
    "Digite um comando para verificar se ele corresponde às regras acima.";
}

function responseRuleMatchesCommand(
  rule,
  normalizedCommand
) {
  if (!normalizedCommand) {
    return false;
  }

  if (rule.match_mode === "exact") {
    return (
      normalizedCommand ===
      normalizeCommandText(
        rule.exact_phrase
      )
    );
  }

  const expandedCommandWords =
    createExpandedCommandWords(
      normalizedCommand,
      rule.synonyms
    );

  const forbiddenMatched =
    rule.forbidden_words.some(
      forbiddenWord =>
        expandedCommandWords.has(
          forbiddenWord
        )
    );

  if (forbiddenMatched) {
    return false;
  }

  if (
    rule.match_mode === "any_keyword"
  ) {
    const allPossibleWords = [
      ...rule.required_words,
      ...rule.optional_words
    ];

    return allPossibleWords.some(
      word =>
        expandedCommandWords.has(word)
    );
  }

  const requiredMatched =
    rule.required_words.every(
      requiredWord =>
        expandedCommandWords.has(
          requiredWord
        )
    );

  if (!requiredMatched) {
    return false;
  }

  /*
    Quando existem palavras opcionais,
    pelo menos uma delas deve aparecer.
    Sem opcionais, as obrigatórias bastam.
  */
  if (
    rule.optional_words.length > 0
  ) {
    return rule.optional_words.some(
      optionalWord =>
        expandedCommandWords.has(
          optionalWord
        )
    );
  }

  return true;
}

function createExpandedCommandWords(
  normalizedCommand,
  synonymGroups
) {
  const commandWords =
    normalizedCommand
      .split(" ")
      .filter(Boolean);

  const expanded =
    new Set(commandWords);

  Object.entries(
    synonymGroups || {}
  ).forEach(([mainWord, synonyms]) => {
    const normalizedMainWord =
      normalizeCommandText(mainWord);

    const normalizedSynonyms =
      Array.isArray(synonyms)
        ? synonyms.map(
            synonym =>
              normalizeCommandText(
                synonym
              )
          )
        : [];

    const mainWordPresent =
      expanded.has(
        normalizedMainWord
      );

    const synonymPresent =
      normalizedSynonyms.some(
        synonym =>
          expanded.has(synonym)
      );

    if (
      mainWordPresent ||
      synonymPresent
    ) {
      expanded.add(
        normalizedMainWord
      );

      normalizedSynonyms.forEach(
        synonym => {
          expanded.add(synonym);
        }
      );
    }
  });

  return expanded;
}

function normalizeCommandText(value) {
  return String(value || "")
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^a-z0-9\s]+/g,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
}


/* ==========================================================
   MENU DE AÇÕES DO CAMINHO
   ========================================================== */

function openResponseActionsModal(
  responseId
) {
  const response =
    state.responses.find(
      item => item.id === responseId
    );

  if (!response) {
    return;
  }

  state.actionsResponseId =
    response.id;

  elements.responseActionsTitle.textContent =
    response.admin_description ||
    response.response_key;

  updateToggleResponseButton(
    response
  );

  elements.responseActionsModal.classList.remove(
    "is-hidden"
  );

  document.body.style.overflow =
    "hidden";
}

function closeResponseActionsModal() {
  elements.responseActionsModal.classList.add(
    "is-hidden"
  );

  document.body.style.overflow = "";

  state.actionsResponseId = null;
}

function handleResponseActionsModalClick(
  event
) {
  if (
    event.target.closest(
      "[data-close-response-actions]"
    )
  ) {
    closeResponseActionsModal();
  }
}

function updateToggleResponseButton(
  response
) {
  const title =
    elements.toggleResponseButton
      .querySelector("strong");

  const description =
    elements.toggleResponseButton
      .querySelector("span");

  if (response.is_enabled) {
    title.textContent =
      "DESATIVAR CAMINHO";

    description.textContent =
      "Impede temporariamente que esta regra seja utilizada.";
  } else {
    title.textContent =
      "ATIVAR CAMINHO";

    description.textContent =
      "Torna esta regra novamente disponível para o jogo.";
  }
}


/* ==========================================================
   DUPLICAR CAMINHO
   ========================================================== */

async function duplicateSelectedResponse() {
  const response =
    state.responses.find(
      item =>
        item.id ===
        state.actionsResponseId
    );

  if (!response) {
    return;
  }

  elements.duplicateResponseButton.disabled =
    true;

  try {
    const {
      data,
      error
    } = await state.client.rpc(
      "duplicate_scene_response",
      {
        p_response_id: response.id
      }
    );

    if (error) {
      throw error;
    }

    await refreshResponses();

    closeResponseActionsModal();

    if (data) {
      openEditResponseModal(data);
    }
  } catch (error) {
    console.error(
      "Erro ao duplicar caminho:",
      error
    );

    window.alert(
      formatDatabaseError(error)
    );
  } finally {
    elements.duplicateResponseButton.disabled =
      false;
  }
}


/* ==========================================================
   ATIVAR OU DESATIVAR CAMINHO
   ========================================================== */

async function toggleSelectedResponse() {
  const response =
    state.responses.find(
      item =>
        item.id ===
        state.actionsResponseId
    );

  if (!response) {
    return;
  }

  elements.toggleResponseButton.disabled =
    true;

  try {
    const {
      error
    } = await state.client
      .from("scene_responses")
      .update({
        is_enabled:
          !response.is_enabled
      })
      .eq("id", response.id)
      .eq(
        "scene_id",
        response.scene_id
      );

    if (error) {
      throw error;
    }

    await refreshResponses();

    closeResponseActionsModal();
  } catch (error) {
    console.error(
      "Erro ao alterar caminho:",
      error
    );

    window.alert(
      formatDatabaseError(error)
    );
  } finally {
    elements.toggleResponseButton.disabled =
      false;
  }
}


/* ==========================================================
   EXCLUIR CAMINHO
   ========================================================== */

async function deleteSelectedResponse() {
  const response =
    state.responses.find(
      item =>
        item.id ===
        state.actionsResponseId
    );

  if (!response) {
    return;
  }

  const confirmed = window.confirm(
    `Excluir permanentemente o caminho “${
      response.admin_description ||
      response.response_key
    }”?\n\n` +
    "Essa ação não poderá ser desfeita."
  );

  if (!confirmed) {
    return;
  }

  elements.deleteResponseButton.disabled =
    true;

  try {
    const {
      error
    } = await state.client
      .from("scene_responses")
      .delete()
      .eq("id", response.id)
      .eq(
        "scene_id",
        response.scene_id
      );

    if (error) {
      throw error;
    }

    await refreshResponses();

    closeResponseActionsModal();
  } catch (error) {
    console.error(
      "Erro ao excluir caminho:",
      error
    );

    window.alert(
      formatDatabaseError(error)
    );
  } finally {
    elements.deleteResponseButton.disabled =
      false;
  }
}


/* ==========================================================
   PAINEL DEFINITIVO — MÓDULOS 14 A 28
   ========================================================== */

function initializeDefinitiveAdminModules() {
  cacheDefinitiveElements();
  configureDefinitiveEvents();
  populateDefinitiveSelectors();
}

function cacheDefinitiveElements() {
  const ids = [
    "flags-section", "new-flag-button", "total-flags", "active-flags",
    "boolean-flags", "numeric-flags", "flag-search", "flag-type-filter",
    "flag-status-filter", "flag-list-message", "flag-list", "flag-modal",
    "flag-modal-title", "flag-form", "flag-id", "flag-name", "flag-key",
    "flag-description", "flag-value-type", "flag-default-value", "flag-enabled",
    "flag-form-message", "save-flag-button",

    "secrets-section", "new-secret-button", "new-secret-code-button",
    "total-secrets", "active-secrets", "total-secret-codes",
    "single-use-secret-codes", "secret-search", "secret-kind-filter",
    "secret-status-filter", "secret-list-message", "secret-list", "secret-modal",
    "secret-modal-title", "secret-form", "secret-id", "secret-name", "secret-key",
    "secret-description", "secret-discovery-text", "secret-type", "secret-points",
    "secret-image-url", "secret-audio-url", "secret-enabled", "secret-hidden",
    "secret-form-message", "save-secret-button", "secret-code-modal",
    "secret-code-modal-title", "secret-code-form", "secret-code-id",
    "secret-code-value", "secret-code-name", "secret-code-response",
    "secret-code-effect-rules", "secret-code-enabled", "secret-code-single-use",
    "secret-code-silent", "secret-code-form-message", "save-secret-code-button",

    "map-section", "new-map-location-button", "new-map-connection-button",
    "total-map-locations", "active-map-locations", "secret-map-locations",
    "total-map-connections", "map-search", "map-view-filter", "map-status-filter",
    "map-editor-canvas", "map-editor-empty", "map-list-message", "map-list",
    "map-location-modal", "map-location-modal-title", "map-location-form",
    "map-location-id", "map-location-name", "map-location-key",
    "map-location-description", "map-location-type", "map-location-order",
    "map-location-x", "map-location-y", "map-location-image-url",
    "map-location-icon-url", "map-location-scene", "map-location-route",
    "map-location-ascii-symbol", "map-location-ascii-art",
    "map-location-locked-text", "map-location-show-when-locked",
    "map-location-allow-map-click", "map-location-allow-direct-travel",
    "map-location-enabled", "map-location-secret",
    "map-location-initially-discovered", "map-location-initially-unlocked",
    "map-location-form-message", "save-map-location-button",
    "map-connection-modal", "map-connection-modal-title", "map-connection-form",
    "map-connection-id", "map-connection-name", "map-connection-key",
    "map-connection-from", "map-connection-to", "map-connection-description",
    "map-connection-travel-text", "map-connection-blocked-text",
    "map-connection-forward-scene", "map-connection-reverse-scene",
    "map-connection-command-aliases", "map-connection-condition-rules",
    "map-connection-effect-rules", "map-connection-allow-map-travel",
    "map-connection-enabled", "map-connection-bidirectional",
    "map-connection-secret", "map-connection-initially-unlocked",
    "map-connection-form-message", "save-map-connection-button",

    "progress-section", "refresh-progress-button", "total-player-profiles",
    "total-progress-records", "active-progress-records", "test-progress-records",
    "progress-search", "progress-route-filter", "progress-type-filter",
    "progress-list-message", "progress-list", "progress-detail-modal",
    "progress-detail-title", "progress-detail-summary", "progress-detail-inventory",
    "progress-detail-flags", "progress-detail-routes", "progress-detail-map",
    "progress-detail-message", "reset-player-progress-button",

    "unrecognized-section", "refresh-unrecognized-button", "pending-unrecognized",
    "resolved-unrecognized", "converted-unrecognized", "ignored-unrecognized",
    "unrecognized-search", "unrecognized-status-filter", "unrecognized-scene-filter",
    "unrecognized-list-message", "unrecognized-list", "unrecognized-convert-modal",
    "unrecognized-convert-title", "unrecognized-convert-form",
    "unrecognized-convert-id", "unrecognized-original-input",
    "unrecognized-normalized-input", "unrecognized-target-scene",
    "unrecognized-response-key", "unrecognized-response-text",
    "unrecognized-convert-message", "save-unrecognized-conversion-button",

    "history-section", "refresh-history-button", "history-search",
    "history-type-filter", "history-period-filter", "history-list-message",
    "history-list", "history-entry-template",

    "settings-section", "settings-form", "settings-default-fallback",
    "settings-default-help", "settings-inventory-empty", "settings-map-empty",
    "settings-max-input-length", "settings-history-limit",
    "settings-enable-inventory", "settings-enable-history", "settings-enable-map",
    "settings-log-unrecognized", "settings-form-message", "reload-settings-button",
    "save-settings-button",

    "validator-section", "run-validator-button", "validator-errors",
    "validator-warnings", "validator-info", "validator-last-run",
    "validator-message", "validator-results", "validator-result-template",

    "testing-section", "new-test-session-button", "reset-test-session-button",
    "test-start-route", "test-start-scene", "test-session-id",
    "test-current-scene", "test-current-route", "test-command-count",
    "test-scene-preview", "test-response-output", "test-command-form",
    "test-command-input", "send-test-command-button", "test-inventory-inspector",
    "test-flags-inspector", "test-map-inspector", "test-history-inspector",
    "test-mode-message",

    "response-condition-rules", "response-effect-rules",
    "format-condition-rules-button", "format-effect-rules-button",
    "open-rule-builder-button", "advanced-rules-message", "rule-builder-modal",
    "rule-builder-condition-tab", "rule-builder-effect-tab",
    "rule-builder-condition-panel", "rule-builder-effect-panel",
    "rule-condition-type", "rule-condition-reference", "rule-condition-operator",
    "rule-condition-value", "add-condition-rule-button", "condition-rule-list",
    "rule-effect-type", "rule-effect-reference", "rule-effect-value",
    "rule-effect-text", "add-effect-rule-button", "effect-rule-list",
    "rule-builder-message", "apply-rule-builder-button", "entity-card-template"
  ];

  ids.forEach(id => {
    const key = id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    elements[key] = document.getElementById(id);
  });
}

function configureDefinitiveEvents() {
  bindClick(elements.newFlagButton, openNewFlagModal);
  bindInput(elements.flagSearch, renderFlags);
  bindChange(elements.flagTypeFilter, renderFlags);
  bindChange(elements.flagStatusFilter, renderFlags);
  bindClick(elements.flagList, handleFlagListClick);
  bindSubmit(elements.flagForm, saveFlag);

  bindClick(elements.newSecretButton, openNewSecretModal);
  bindClick(elements.newSecretCodeButton, openNewSecretCodeModal);
  bindInput(elements.secretSearch, renderSecrets);
  bindChange(elements.secretKindFilter, renderSecrets);
  bindChange(elements.secretStatusFilter, renderSecrets);
  bindClick(elements.secretList, handleSecretListClick);
  bindSubmit(elements.secretForm, saveSecret);
  bindSubmit(elements.secretCodeForm, saveSecretCode);

  bindClick(elements.newMapLocationButton, openNewMapLocationModal);
  bindClick(elements.newMapConnectionButton, openNewMapConnectionModal);
  bindInput(elements.mapSearch, renderMapAdmin);
  bindChange(elements.mapViewFilter, renderMapAdmin);
  bindChange(elements.mapStatusFilter, renderMapAdmin);
  bindClick(elements.mapList, handleMapListClick);
  bindSubmit(elements.mapLocationForm, saveMapLocation);
  bindSubmit(elements.mapConnectionForm, saveMapConnection);

  bindClick(elements.refreshProgressButton, () => loadProgressData(true));
  bindInput(elements.progressSearch, renderProgress);
  bindChange(elements.progressRouteFilter, renderProgress);
  bindChange(elements.progressTypeFilter, renderProgress);
  bindClick(elements.progressList, handleProgressListClick);
  bindClick(elements.resetPlayerProgressButton, resetSelectedProgress);

  bindClick(elements.refreshUnrecognizedButton, () => loadUnrecognizedData(true));
  bindInput(elements.unrecognizedSearch, renderUnrecognized);
  bindChange(elements.unrecognizedStatusFilter, renderUnrecognized);
  bindChange(elements.unrecognizedSceneFilter, renderUnrecognized);
  bindClick(elements.unrecognizedList, handleUnrecognizedListClick);
  bindSubmit(elements.unrecognizedConvertForm, convertUnrecognizedToResponse);

  bindClick(elements.refreshHistoryButton, () => loadHistoryData(true));
  bindInput(elements.historySearch, renderHistoryAdmin);
  bindChange(elements.historyTypeFilter, renderHistoryAdmin);
  bindChange(elements.historyPeriodFilter, renderHistoryAdmin);

  bindSubmit(elements.settingsForm, saveGameSettings);
  bindClick(elements.reloadSettingsButton, () => loadSettingsData(true));
  bindClick(elements.runValidatorButton, runStoryValidator);

  bindClick(elements.newTestSessionButton, createAdminTestSession);
  bindClick(elements.resetTestSessionButton, resetAdminTestSession);
  bindSubmit(elements.testCommandForm, sendAdminTestCommand);

  bindClick(elements.formatConditionRulesButton, () => formatRuleTextarea("condition"));
  bindClick(elements.formatEffectRulesButton, () => formatRuleTextarea("effect"));
  bindClick(elements.openRuleBuilderButton, openRuleBuilder);
  bindClick(elements.ruleBuilderConditionTab, () => setRuleBuilderMode("condition"));
  bindClick(elements.ruleBuilderEffectTab, () => setRuleBuilderMode("effect"));
  bindClick(elements.addConditionRuleButton, addConditionFromBuilder);
  bindClick(elements.addEffectRuleButton, addEffectFromBuilder);
  bindClick(elements.applyRuleBuilderButton, applyRuleBuilder);
  bindChange(elements.ruleConditionType, populateRuleBuilderReferences);
  bindChange(elements.ruleEffectType, populateRuleBuilderReferences);

  document.addEventListener("click", handleDefinitiveModalClose);
}

function bindClick(element, handler) {
  element?.addEventListener("click", handler);
}

function bindInput(element, handler) {
  element?.addEventListener("input", handler);
}

function bindChange(element, handler) {
  element?.addEventListener("change", handler);
}

function bindSubmit(element, handler) {
  element?.addEventListener("submit", handler);
}

function handleDefinitiveModalClose(event) {
  const closeMap = [
    ["[data-close-flag-modal]", elements.flagModal],
    ["[data-close-secret-modal]", elements.secretModal],
    ["[data-close-secret-code-modal]", elements.secretCodeModal],
    ["[data-close-map-location-modal]", elements.mapLocationModal],
    ["[data-close-map-connection-modal]", elements.mapConnectionModal],
    ["[data-close-progress-detail-modal]", elements.progressDetailModal],
    ["[data-close-unrecognized-convert-modal]", elements.unrecognizedConvertModal],
    ["[data-close-rule-builder-modal]", elements.ruleBuilderModal]
  ];

  for (const [selector, modal] of closeMap) {
    if (event.target.closest(selector)) {
      closeDefinitiveModal(modal);
      break;
    }
  }
}

async function loadDefinitiveSection(section) {
  try {
    switch (section) {
      case "flags":
        await loadFlagsData();
        break;
      case "secrets":
        await loadSecretsData();
        break;
      case "map":
        await loadMapData();
        break;
      case "progress":
        await loadProgressData();
        break;
      case "unrecognized":
        await loadUnrecognizedData();
        break;
      case "history":
        await loadHistoryData();
        break;
      case "settings":
        await loadSettingsData();
        break;
      case "validator":
        renderStoredValidation();
        break;
      case "testing":
        prepareTestingSection();
        break;
      default:
        break;
    }
  } catch (error) {
    console.error(`Erro ao carregar a seção ${section}:`, error);
    showSectionError(section, formatDatabaseError(error));
  }
}

function showSectionError(section, message) {
  const messageElement = document.getElementById(`${section}-list-message`) ||
    document.getElementById(`${section}-message`) ||
    document.getElementById(`${section}-form-message`) ||
    elements.testModeMessage;

  if (messageElement) {
    messageElement.textContent = message;
    messageElement.classList.add("is-error");
  }
}

async function selectGameTable(table, options = {}) {
  let query = state.client.from(table).select(options.select || "*");

  if (options.gameColumn !== false) {
    query = query.eq(options.gameColumn || "game_id", state.game.id);
  }

  if (options.orderBy) {
    query = query.order(options.orderBy, { ascending: options.ascending !== false });
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function callAdminRpc(name, args = {}) {
  const { data, error } = await state.client.rpc(name, args);
  if (error) throw error;
  return data;
}

function openDefinitiveModal(modal) {
  modal?.classList.remove("is-hidden");
  document.body.style.overflow = "hidden";
}

function closeDefinitiveModal(modal) {
  modal?.classList.add("is-hidden");
  if (!document.querySelector(".modal:not(.is-hidden)")) {
    document.body.style.overflow = "";
  }
}

function setMessage(element, message = "", type = "") {
  if (!element) return;
  element.textContent = message;
  element.classList.toggle("is-error", type === "error");
  element.classList.toggle("is-success", type === "success");
}

function formatJsonField(value, fallback = {}) {
  const normalized = value ?? fallback;
  return JSON.stringify(normalized, null, 2);
}

function parseJsonField(value, fallback = {}) {
  const text = String(value ?? "").trim();
  if (!text) return fallback;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("O conteúdo JSON possui um erro de formatação.");
  }
}

function normalizeInternalKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR");
}

function createEntityCard({ id, title, identifier, description, badge, metadata = [], inactive = false, kind }) {
  const template = elements.entityCardTemplate;
  const card = template?.content.firstElementChild.cloneNode(true) || document.createElement("article");

  card.classList.add("entity-card");
  card.dataset.entityId = id;
  card.dataset.entityKind = kind;
  card.classList.toggle("is-inactive", inactive);

  const titleElement = card.querySelector(".entity-card__title");
  const identifierElement = card.querySelector(".entity-card__identifier");
  const descriptionElement = card.querySelector(".entity-card__description");
  const badgeElement = card.querySelector(".entity-card__badge");
  const metadataElement = card.querySelector(".entity-card__metadata");

  if (titleElement) titleElement.textContent = title || "Sem nome";
  if (identifierElement) identifierElement.textContent = identifier || "sem_identificador";
  if (descriptionElement) descriptionElement.textContent = description || "";
  if (badgeElement) badgeElement.textContent = badge || "";

  if (metadataElement) {
    metadataElement.replaceChildren();
    metadata.filter(Boolean).forEach(value => {
      const span = document.createElement("span");
      span.textContent = value;
      metadataElement.appendChild(span);
    });
  }

  return card;
}

/* FLAGS */
async function loadFlagsData(force = false) {
  if (!force && state.loadedDefinitiveSections.has("flags")) {
    renderFlags();
    return;
  }

  setMessage(elements.flagListMessage, "CARREGANDO FLAGS...");
  state.flags = await selectGameTable("flags", { orderBy: "display_order" });
  state.loadedDefinitiveSections.add("flags");
  renderFlags();
  populateRuleBuilderReferences();
}

function renderFlags() {
  if (!elements.flagList) return;
  const search = normalizeCommandText(elements.flagSearch?.value || "");
  const type = elements.flagTypeFilter?.value || "";
  const status = elements.flagStatusFilter?.value || "";

  const filtered = state.flags.filter(flag => {
    const haystack = normalizeCommandText(`${flag.name || ""} ${flag.flag_key || ""} ${flag.description || flag.admin_description || ""}`);
    if (search && !haystack.includes(search)) return false;
    if (type && (flag.value_type || flag.flag_type) !== type) return false;
    if (status === "active" && flag.is_enabled !== true) return false;
    if (status === "inactive" && flag.is_enabled === true) return false;
    return true;
  });

  elements.totalFlags.textContent = String(state.flags.length);
  elements.activeFlags.textContent = String(state.flags.filter(item => item.is_enabled).length);
  elements.booleanFlags.textContent = String(state.flags.filter(item => (item.value_type || item.flag_type) === "boolean").length);
  elements.numericFlags.textContent = String(state.flags.filter(item => ["number", "numeric", "integer"].includes(item.value_type || item.flag_type)).length);

  elements.flagList.replaceChildren();
  filtered.forEach(flag => elements.flagList.appendChild(createEntityCard({
    id: flag.id,
    kind: "flag",
    title: flag.name || flag.flag_key,
    identifier: flag.flag_key,
    description: flag.description || flag.admin_description,
    badge: String(flag.value_type || flag.flag_type || "boolean").toUpperCase(),
    metadata: [`Inicial: ${String(flag.default_value ?? flag.initial_value ?? false)}`],
    inactive: flag.is_enabled !== true
  })));

  setMessage(elements.flagListMessage, filtered.length ? `${filtered.length} FLAG(S).` : "Nenhuma Flag encontrada.");
}

function openNewFlagModal() {
  state.editingFlagId = null;
  elements.flagForm.reset();
  elements.flagId.value = "";
  elements.flagValueType.value = "boolean";
  elements.flagDefaultValue.value = "false";
  elements.flagEnabled.checked = true;
  elements.flagModalTitle.textContent = "Nova Flag";
  setMessage(elements.flagFormMessage);
  openDefinitiveModal(elements.flagModal);
  elements.flagName.focus();
}

function openEditFlagModal(id) {
  const flag = state.flags.find(item => item.id === id);
  if (!flag) return;
  state.editingFlagId = id;
  elements.flagId.value = id;
  elements.flagName.value = flag.name || "";
  elements.flagKey.value = flag.flag_key || "";
  elements.flagDescription.value = flag.description || flag.admin_description || "";
  elements.flagValueType.value = flag.value_type || flag.flag_type || "boolean";
  elements.flagDefaultValue.value = String(flag.default_value ?? flag.initial_value ?? "false");
  elements.flagEnabled.checked = flag.is_enabled !== false;
  elements.flagModalTitle.textContent = flag.name || flag.flag_key;
  setMessage(elements.flagFormMessage);
  openDefinitiveModal(elements.flagModal);
}

function handleFlagListClick(event) {
  const card = event.target.closest("[data-entity-id]");
  if (!card) return;
  if (event.target.closest('[data-entity-action="edit"]')) openEditFlagModal(card.dataset.entityId);
  if (event.target.closest('[data-entity-action="more"]')) openEditFlagModal(card.dataset.entityId);
}

async function saveFlag(event) {
  event.preventDefault();
  const payload = {
    id: state.editingFlagId,
    game_id: state.game.id,
    flag_key: normalizeInternalKey(elements.flagKey.value || elements.flagName.value),
    name: elements.flagName.value.trim(),
    description: emptyToNull(elements.flagDescription.value),
    value_type: elements.flagValueType.value,
    default_value: elements.flagDefaultValue.value,
    is_enabled: elements.flagEnabled.checked
  };

  if (!payload.name || !payload.flag_key) {
    setMessage(elements.flagFormMessage, "Informe o nome e o identificador da Flag.", "error");
    return;
  }

  try {
    setMessage(elements.flagFormMessage, "SALVANDO FLAG...");
    await callAdminRpc("admin_save_flag", { p_data: payload });
    state.loadedDefinitiveSections.delete("flags");
    await loadFlagsData(true);
    closeDefinitiveModal(elements.flagModal);
  } catch (error) {
    setMessage(elements.flagFormMessage, formatDatabaseError(error), "error");
  }
}

/* SEGREDOS */
async function loadSecretsData(force = false) {
  if (!force && state.loadedDefinitiveSections.has("secrets")) {
    renderSecrets();
    return;
  }
  setMessage(elements.secretListMessage, "CARREGANDO SEGREDOS...");
  const [secrets, codes] = await Promise.all([
    selectGameTable("secrets", { orderBy: "display_order" }),
    selectGameTable("secret_codes", { orderBy: "priority", ascending: false })
  ]);
  state.secrets = secrets;
  state.secretCodes = codes;
  state.loadedDefinitiveSections.add("secrets");
  renderSecrets();
  populateRuleBuilderReferences();
}

function renderSecrets() {
  if (!elements.secretList) return;
  const search = normalizeCommandText(elements.secretSearch?.value || "");
  const kind = elements.secretKindFilter?.value || "";
  const status = elements.secretStatusFilter?.value || "";
  const combined = [
    ...state.secrets.map(item => ({ ...item, __kind: "secret" })),
    ...state.secretCodes.map(item => ({ ...item, __kind: "code" }))
  ].filter(item => {
    if (kind && item.__kind !== kind) return false;
    const text = normalizeCommandText(`${item.name || item.internal_name || ""} ${item.secret_key || item.code || ""} ${item.description || ""}`);
    if (search && !text.includes(search)) return false;
    if (status === "active" && item.is_enabled !== true) return false;
    if (status === "inactive" && item.is_enabled === true) return false;
    if (status === "single_use" && !(item.is_single_use || item.one_time_only)) return false;
    return true;
  });

  elements.totalSecrets.textContent = String(state.secrets.length);
  elements.activeSecrets.textContent = String(state.secrets.filter(item => item.is_enabled).length);
  elements.totalSecretCodes.textContent = String(state.secretCodes.length);
  elements.singleUseSecretCodes.textContent = String(state.secretCodes.filter(item => item.is_single_use || item.one_time_only).length);
  elements.secretList.replaceChildren();

  combined.forEach(item => {
    const isCode = item.__kind === "code";
    elements.secretList.appendChild(createEntityCard({
      id: item.id,
      kind: item.__kind,
      title: isCode ? (item.internal_name || item.name || item.code) : (item.name || item.secret_key),
      identifier: isCode ? item.code : item.secret_key,
      description: isCode ? (item.description || item.message_before_action) : item.description,
      badge: isCode ? "CÓDIGO" : String(item.secret_type || "SEGREDO").toUpperCase(),
      metadata: isCode ? [item.one_time_only || item.is_single_use ? "USO ÚNICO" : "REUTILIZÁVEL"] : [`${item.points || 0} PONTO(S)`],
      inactive: item.is_enabled !== true
    }));
  });

  setMessage(elements.secretListMessage, combined.length ? `${combined.length} REGISTRO(S).` : "Nenhum Segredo encontrado.");
}

function handleSecretListClick(event) {
  const card = event.target.closest("[data-entity-id]");
  if (!card) return;
  if (!event.target.closest("[data-entity-action]")) return;
  if (card.dataset.entityKind === "code") openEditSecretCodeModal(card.dataset.entityId);
  else openEditSecretModal(card.dataset.entityId);
}

function openNewSecretModal() {
  state.editingSecretId = null;
  elements.secretForm.reset();
  elements.secretId.value = "";
  elements.secretType.value = "lore";
  elements.secretPoints.value = "0";
  elements.secretEnabled.checked = true;
  elements.secretHidden.checked = true;
  elements.secretModalTitle.textContent = "Novo Segredo";
  setMessage(elements.secretFormMessage);
  openDefinitiveModal(elements.secretModal);
}

function openEditSecretModal(id) {
  const item = state.secrets.find(secret => secret.id === id);
  if (!item) return;
  state.editingSecretId = id;
  elements.secretId.value = id;
  elements.secretName.value = item.name || "";
  elements.secretKey.value = item.secret_key || "";
  elements.secretDescription.value = item.description || "";
  elements.secretDiscoveryText.value = item.discovery_text || "";
  elements.secretType.value = item.secret_type || "lore";
  elements.secretPoints.value = String(item.points || 0);
  elements.secretImageUrl.value = item.image_url || "";
  elements.secretAudioUrl.value = item.audio_url || "";
  elements.secretEnabled.checked = item.is_enabled !== false;
  elements.secretHidden.checked = item.is_hidden !== false;
  elements.secretModalTitle.textContent = item.name || item.secret_key;
  openDefinitiveModal(elements.secretModal);
}

async function saveSecret(event) {
  event.preventDefault();
  const payload = {
    id: state.editingSecretId,
    game_id: state.game.id,
    secret_key: normalizeInternalKey(elements.secretKey.value || elements.secretName.value),
    name: elements.secretName.value.trim(),
    description: emptyToNull(elements.secretDescription.value),
    discovery_text: emptyToNull(elements.secretDiscoveryText.value),
    secret_type: elements.secretType.value,
    points: Number(elements.secretPoints.value || 0),
    image_url: emptyToNull(elements.secretImageUrl.value),
    audio_url: emptyToNull(elements.secretAudioUrl.value),
    is_enabled: elements.secretEnabled.checked,
    is_hidden: elements.secretHidden.checked
  };
  try {
    setMessage(elements.secretFormMessage, "SALVANDO SEGREDO...");
    await callAdminRpc("admin_save_secret", { p_data: payload });
    await loadSecretsData(true);
    closeDefinitiveModal(elements.secretModal);
  } catch (error) {
    setMessage(elements.secretFormMessage, formatDatabaseError(error), "error");
  }
}

function openNewSecretCodeModal() {
  state.editingSecretCodeId = null;
  elements.secretCodeForm.reset();
  elements.secretCodeId.value = "";
  elements.secretCodeEffectRules.value = "[]";
  elements.secretCodeEnabled.checked = true;
  elements.secretCodeModalTitle.textContent = "Novo Código Secreto";
  setMessage(elements.secretCodeFormMessage);
  openDefinitiveModal(elements.secretCodeModal);
}

function openEditSecretCodeModal(id) {
  const item = state.secretCodes.find(code => code.id === id);
  if (!item) return;
  state.editingSecretCodeId = id;
  elements.secretCodeId.value = id;
  elements.secretCodeValue.value = item.code || "";
  elements.secretCodeName.value = item.internal_name || item.name || "";
  elements.secretCodeResponse.value = item.message_before_action || item.response_text || "";
  elements.secretCodeEffectRules.value = formatJsonField(item.effect_rules || [], []);
  elements.secretCodeEnabled.checked = item.is_enabled !== false;
  elements.secretCodeSingleUse.checked = item.is_single_use || item.one_time_only || false;
  elements.secretCodeSilent.checked = item.is_silent || false;
  elements.secretCodeModalTitle.textContent = item.internal_name || item.code;
  openDefinitiveModal(elements.secretCodeModal);
}

async function saveSecretCode(event) {
  event.preventDefault();
  try {
    const payload = {
      id: state.editingSecretCodeId,
      game_id: state.game.id,
      code: elements.secretCodeValue.value.trim(),
      internal_name: elements.secretCodeName.value.trim(),
      message_before_action: emptyToNull(elements.secretCodeResponse.value),
      effect_rules: parseJsonField(elements.secretCodeEffectRules.value, []),
      is_enabled: elements.secretCodeEnabled.checked,
      one_time_only: elements.secretCodeSingleUse.checked,
      is_silent: elements.secretCodeSilent.checked
    };
    setMessage(elements.secretCodeFormMessage, "SALVANDO CÓDIGO...");
    await callAdminRpc("admin_save_secret_code", { p_data: payload });
    await loadSecretsData(true);
    closeDefinitiveModal(elements.secretCodeModal);
  } catch (error) {
    setMessage(elements.secretCodeFormMessage, formatDatabaseError(error), "error");
  }
}

function parseJsonArrayField(value, label) {
  const text = String(value || "").trim();

  if (!text) {
    return [];
  }

  let parsed;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(
      `${label}: o JSON informado é inválido.`
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error(
      `${label}: o conteúdo precisa começar com [ e terminar com ].`
    );
  }

  return parsed;
}

/* MAPA */
async function loadMapData(force = false) {
  if (!force && state.loadedDefinitiveSections.has("map")) {
    renderMapAdmin();
    return;
  }
  const [locations, connections] = await Promise.all([
    selectGameTable("map_locations", { orderBy: "display_order" }),
    selectGameTable("map_connections", { orderBy: "display_order" })
  ]);
  state.mapLocations = locations;
  state.mapConnections = connections;
  state.loadedDefinitiveSections.add("map");
  populateMapLocationSelectors();
  renderMapAdmin();
  populateRuleBuilderReferences();
}

function renderMapAdmin() {
  if (!elements.mapList) return;
  const search = normalizeCommandText(elements.mapSearch?.value || "");
  const view = elements.mapViewFilter?.value || "";
  const status = elements.mapStatusFilter?.value || "";
  const combined = [
    ...state.mapLocations.map(item => ({ ...item, __kind: "location" })),
    ...state.mapConnections.map(item => ({ ...item, __kind: "connection" }))
  ].filter(item => {
    if (view === "locations" && item.__kind !== "location") return false;
    if (view === "connections" && item.__kind !== "connection") return false;
    const text = normalizeCommandText(`${item.name || ""} ${item.location_key || item.connection_key || ""} ${item.description || ""}`);
    if (search && !text.includes(search)) return false;
    if (status === "active" && item.is_enabled !== true) return false;
    if (status === "inactive" && item.is_enabled === true) return false;
    if (status === "secret" && item.is_secret !== true) return false;
    return true;
  });

  elements.totalMapLocations.textContent = String(state.mapLocations.length);
  elements.activeMapLocations.textContent = String(state.mapLocations.filter(item => item.is_enabled).length);
  elements.secretMapLocations.textContent = String(state.mapLocations.filter(item => item.is_secret).length);
  elements.totalMapConnections.textContent = String(state.mapConnections.length);
  elements.mapList.replaceChildren();

  combined.forEach(item => {
    const location = item.__kind === "location";
    elements.mapList.appendChild(createEntityCard({
      id: item.id,
      kind: item.__kind,
      title: item.name || (location ? item.location_key : item.connection_key),
      identifier: location ? item.location_key : item.connection_key,
      description: item.description,
      badge: location ? String(item.location_type || "LOCAL").toUpperCase() : "CONEXÃO",
      metadata: location ? [`X ${item.map_x ?? 0}`, `Y ${item.map_y ?? 0}`] : [item.is_bidirectional ? "IDA E VOLTA" : "SENTIDO ÚNICO"],
      inactive: item.is_enabled !== true
    }));
  });

  renderMapCanvas();
  setMessage(elements.mapListMessage, combined.length ? `${combined.length} REGISTRO(S).` : "Nenhum elemento do Mapa encontrado.");
}

function renderMapCanvas() {
  if (!elements.mapEditorCanvas) return;

  elements.mapEditorCanvas
    .querySelectorAll(".map-editor-node, .map-editor-line")
    .forEach(node => node.remove());

  elements.mapEditorEmpty?.classList.toggle(
    "is-hidden",
    state.mapLocations.length > 0
  );

  const locationById =
    new Map(
      state.mapLocations.map(location => [
        location.id,
        location
      ])
    );

  state.mapConnections.forEach(connection => {
    const from =
      locationById.get(connection.from_location_id);
    const to =
      locationById.get(connection.to_location_id);

    if (!from || !to) return;

    const line = document.createElement("div");
    line.className = "map-editor-line";

    const x1 = Number(from.map_x ?? 50);
    const y1 = Number(from.map_y ?? 50);
    const x2 = Number(to.map_x ?? 50);
    const y2 = Number(to.map_y ?? 50);

    const deltaX = x2 - x1;
    const deltaY = y2 - y1;
    const length =
      Math.sqrt(deltaX ** 2 + deltaY ** 2);
    const angle =
      Math.atan2(deltaY, deltaX) * 180 / Math.PI;

    line.style.left = `${x1}%`;
    line.style.top = `${y1}%`;
    line.style.width = `${length}%`;
    line.style.transform =
      `rotate(${angle}deg)`;

    if (!connection.is_initially_unlocked) {
      line.classList.add("is-locked");
    }

    if (connection.is_secret) {
      line.classList.add("is-secret");
    }

    line.title =
      connection.name ||
      connection.connection_key;

    elements.mapEditorCanvas.appendChild(line);
  });

  state.mapLocations.forEach(location => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "map-editor-node";
    button.style.left =
      `${Math.max(0, Math.min(100, Number(location.map_x ?? 50)))}%`;
    button.style.top =
      `${Math.max(0, Math.min(100, Number(location.map_y ?? 50)))}%`;
    button.dataset.locationId = location.id;

    const ascii = document.createElement("pre");
    ascii.textContent =
      location.ascii_art ||
      location.ascii_symbol ||
      "[ ]";

    const name = document.createElement("span");
    name.textContent =
      location.name || location.location_key;

    button.append(ascii, name);

    button.addEventListener(
      "click",
      event => {
        if (button.dataset.dragged === "true") {
          button.dataset.dragged = "false";
          event.preventDefault();
          return;
        }

        openEditMapLocationModal(location.id);
      }
    );

    configureMapNodeDrag(button, location);

    elements.mapEditorCanvas.appendChild(button);
  });
}

function configureMapNodeDrag(button, location) {
  let startX = 0;
  let startY = 0;
  let moved = false;

  button.addEventListener("pointerdown", event => {
    startX = event.clientX;
    startY = event.clientY;
    moved = false;
    button.setPointerCapture(event.pointerId);
    button.classList.add("is-dragging");
  });

  button.addEventListener("pointermove", event => {
    if (!button.hasPointerCapture(event.pointerId)) return;

    if (
      Math.abs(event.clientX - startX) > 3 ||
      Math.abs(event.clientY - startY) > 3
    ) {
      moved = true;
    }

    const rectangle =
      elements.mapEditorCanvas.getBoundingClientRect();

    const x =
      Math.max(
        0,
        Math.min(
          100,
          ((event.clientX - rectangle.left) /
            rectangle.width) * 100
        )
      );

    const y =
      Math.max(
        0,
        Math.min(
          100,
          ((event.clientY - rectangle.top) /
            rectangle.height) * 100
        )
      );

    button.style.left = `${x}%`;
    button.style.top = `${y}%`;
    button.dataset.pendingX = String(x);
    button.dataset.pendingY = String(y);
  });

  button.addEventListener("pointerup", async event => {
    if (!button.hasPointerCapture(event.pointerId)) return;
    button.releasePointerCapture(event.pointerId);
    button.classList.remove("is-dragging");

    if (!moved) return;

    button.dataset.dragged = "true";

    const payload = {
      ...location,
      id: location.id,
      game_id: state.game.id,
      map_x: Number(button.dataset.pendingX),
      map_y: Number(button.dataset.pendingY)
    };

    try {
      await callAdminRpc(
        "admin_save_map_location_v2",
        { p_data: payload }
      );

      location.map_x = payload.map_x;
      location.map_y = payload.map_y;

      renderMapCanvas();
    } catch (error) {
      window.alert(formatDatabaseError(error));
      renderMapCanvas();
    }
  });
}

function handleMapListClick(event) {
  const card = event.target.closest("[data-entity-id]");
  if (!card || !event.target.closest("[data-entity-action]")) return;
  if (card.dataset.entityKind === "location") openEditMapLocationModal(card.dataset.entityId);
  else openEditMapConnectionModal(card.dataset.entityId);
}

function populateMapLocationSelectors() {
  [elements.mapConnectionFrom, elements.mapConnectionTo].forEach(select => {
    if (!select) return;
    const current = select.value;
    select.replaceChildren();
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = "Selecione um local";
    select.appendChild(empty);
    state.mapLocations.forEach(location => {
      const option = document.createElement("option");
      option.value = location.id;
      option.textContent = location.name || location.location_key;
      select.appendChild(option);
    });
    select.value = current;
  });

  [
    elements.mapLocationScene,
    elements.mapConnectionForwardScene,
    elements.mapConnectionReverseScene
  ].forEach(select => {
    if (!select) return;
    const current = select.value;
    const firstText =
      select === elements.mapLocationScene
        ? "Sem Cena associada"
        : "Usar a Cena padrão do Local";
    select.replaceChildren();
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = firstText;
    select.appendChild(empty);
    state.scenes.forEach(scene => {
      const option = document.createElement("option");
      option.value = scene.id;
      option.textContent = `${scene.title || scene.scene_key} — ${scene.scene_key}`;
      select.appendChild(option);
    });
    select.value = current;
  });

  if (elements.mapLocationRoute) {
    const current = elements.mapLocationRoute.value;
    elements.mapLocationRoute.replaceChildren();
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = "Manter a Rota atual";
    elements.mapLocationRoute.appendChild(empty);
    state.routes.forEach(route => {
      const option = document.createElement("option");
      option.value = route.id;
      option.textContent = route.name || route.code;
      elements.mapLocationRoute.appendChild(option);
    });
    elements.mapLocationRoute.value = current;
  }
}

function openNewMapLocationModal() {
  state.editingMapLocationId = null;
  elements.mapLocationForm.reset();
  elements.mapLocationId.value = "";
  elements.mapLocationType.value = "location";
  elements.mapLocationX.value = "50";
  elements.mapLocationY.value = "50";
  elements.mapLocationOrder.value = "0";
  elements.mapLocationAsciiSymbol.value = "[ ]";
  elements.mapLocationShowWhenLocked.checked = true;
  elements.mapLocationAllowMapClick.checked = true;
  elements.mapLocationAllowDirectTravel.checked = false;
  populateMapLocationSelectors();
  elements.mapLocationEnabled.checked = true;
  elements.mapLocationModalTitle.textContent = "Novo Local";
  openDefinitiveModal(elements.mapLocationModal);
}

function openEditMapLocationModal(id) {
  const item = state.mapLocations.find(location => location.id === id);
  if (!item) return;
  state.editingMapLocationId = id;
  elements.mapLocationId.value = id;
  elements.mapLocationName.value = item.name || "";
  elements.mapLocationKey.value = item.location_key || "";
  elements.mapLocationDescription.value = item.description || "";
  elements.mapLocationType.value = item.location_type || "location";
  elements.mapLocationOrder.value = String(item.display_order || 0);
  elements.mapLocationX.value = String(item.map_x ?? 50);
  elements.mapLocationY.value = String(item.map_y ?? 50);
  elements.mapLocationImageUrl.value = item.image_url || "";
  elements.mapLocationIconUrl.value = item.icon_url || "";
  populateMapLocationSelectors();
  elements.mapLocationScene.value = item.scene_id || "";
  elements.mapLocationRoute.value = item.route_id || "";
  elements.mapLocationAsciiSymbol.value = item.ascii_symbol || "[ ]";
  elements.mapLocationAsciiArt.value = item.ascii_art || "";
  elements.mapLocationLockedText.value = item.locked_text || "";
  elements.mapLocationShowWhenLocked.checked = item.show_when_locked !== false;
  elements.mapLocationAllowMapClick.checked = item.allow_map_click !== false;
  elements.mapLocationAllowDirectTravel.checked = item.allow_direct_travel === true;
  elements.mapLocationEnabled.checked = item.is_enabled !== false;
  elements.mapLocationSecret.checked = item.is_secret === true;
  elements.mapLocationInitiallyDiscovered.checked = item.is_initially_discovered === true;
  elements.mapLocationInitiallyUnlocked.checked = item.is_initially_unlocked === true;
  elements.mapLocationModalTitle.textContent = item.name || item.location_key;
  openDefinitiveModal(elements.mapLocationModal);
}

async function saveMapLocation(event) {
  event.preventDefault();
  const payload = {
    id: state.editingMapLocationId,
    game_id: state.game.id,
    location_key: normalizeInternalKey(elements.mapLocationKey.value || elements.mapLocationName.value),
    name: elements.mapLocationName.value.trim(),
    description: emptyToNull(elements.mapLocationDescription.value),
    location_type: elements.mapLocationType.value,
    display_order: Number(elements.mapLocationOrder.value || 0),
    map_x: Number(elements.mapLocationX.value || 0),
    map_y: Number(elements.mapLocationY.value || 0),
    image_url: emptyToNull(elements.mapLocationImageUrl.value),
    icon_url: emptyToNull(elements.mapLocationIconUrl.value),
    scene_id: emptyToNull(elements.mapLocationScene.value),
    route_id: emptyToNull(elements.mapLocationRoute.value),
    ascii_symbol: emptyToNull(elements.mapLocationAsciiSymbol.value) || "[ ]",
    ascii_art: emptyToNull(elements.mapLocationAsciiArt.value),
    locked_text: emptyToNull(elements.mapLocationLockedText.value),
    show_when_locked: elements.mapLocationShowWhenLocked.checked,
    allow_map_click: elements.mapLocationAllowMapClick.checked,
    allow_direct_travel: elements.mapLocationAllowDirectTravel.checked,
    is_enabled: elements.mapLocationEnabled.checked,
    is_secret: elements.mapLocationSecret.checked,
    is_initially_discovered: elements.mapLocationInitiallyDiscovered.checked,
    is_initially_unlocked: elements.mapLocationInitiallyUnlocked.checked
  };
  try {
    setMessage(elements.mapLocationFormMessage, "SALVANDO LOCAL...");
    await callAdminRpc("admin_save_map_location_v2", { p_data: payload });
    await loadMapData(true);
    closeDefinitiveModal(elements.mapLocationModal);
  } catch (error) {
    setMessage(elements.mapLocationFormMessage, formatDatabaseError(error), "error");
  }
}

function openNewMapConnectionModal() {
  state.editingMapConnectionId = null;
  elements.mapConnectionForm.reset();
  elements.mapConnectionId.value = "";
  populateMapLocationSelectors();
  elements.mapConnectionEnabled.checked = true;
  elements.mapConnectionBidirectional.checked = true;
  elements.mapConnectionAllowMapTravel.checked = true;
  elements.mapConnectionConditionRules.value = "[]";
  elements.mapConnectionEffectRules.value = "[]";
  populateMapLocationSelectors();
  elements.mapConnectionModalTitle.textContent = "Nova Conexão";
  openDefinitiveModal(elements.mapConnectionModal);
}

function openEditMapConnectionModal(id) {
  const item = state.mapConnections.find(connection => connection.id === id);
  if (!item) return;
  state.editingMapConnectionId = id;
  populateMapLocationSelectors();
  elements.mapConnectionId.value = id;
  elements.mapConnectionName.value = item.name || "";
  elements.mapConnectionKey.value = item.connection_key || "";
  elements.mapConnectionFrom.value = item.from_location_id || "";
  elements.mapConnectionTo.value = item.to_location_id || "";
  elements.mapConnectionDescription.value = item.description || "";
  elements.mapConnectionTravelText.value = item.travel_text || "";
  elements.mapConnectionBlockedText.value = item.blocked_text || "";
  elements.mapConnectionForwardScene.value = item.forward_scene_id || "";
  elements.mapConnectionReverseScene.value = item.reverse_scene_id || "";
  elements.mapConnectionCommandAliases.value =
    Array.isArray(item.command_aliases)
      ? item.command_aliases.join(", ")
      : "";
  elements.mapConnectionConditionRules.value =
    JSON.stringify(item.condition_rules || [], null, 2);
  elements.mapConnectionEffectRules.value =
    JSON.stringify(item.effect_rules || [], null, 2);
  elements.mapConnectionAllowMapTravel.checked =
    item.allow_map_travel !== false;
  elements.mapConnectionEnabled.checked = item.is_enabled !== false;
  elements.mapConnectionBidirectional.checked = item.is_bidirectional !== false;
  elements.mapConnectionSecret.checked = item.is_secret === true;
  elements.mapConnectionInitiallyUnlocked.checked = item.is_initially_unlocked === true;
  elements.mapConnectionModalTitle.textContent = item.name || item.connection_key;
  openDefinitiveModal(elements.mapConnectionModal);
}

async function saveMapConnection(event) {
  event.preventDefault();
  const payload = {
    id: state.editingMapConnectionId,
    game_id: state.game.id,
    connection_key: normalizeInternalKey(elements.mapConnectionKey.value || elements.mapConnectionName.value),
    name: emptyToNull(elements.mapConnectionName.value),
    from_location_id: elements.mapConnectionFrom.value,
    to_location_id: elements.mapConnectionTo.value,
    description: emptyToNull(elements.mapConnectionDescription.value),
    travel_text: emptyToNull(elements.mapConnectionTravelText.value),
    blocked_text: emptyToNull(elements.mapConnectionBlockedText.value),
    forward_scene_id: emptyToNull(elements.mapConnectionForwardScene.value),
    reverse_scene_id: emptyToNull(elements.mapConnectionReverseScene.value),
    command_aliases: elements.mapConnectionCommandAliases.value
      .split(",")
      .map(value => value.trim())
      .filter(Boolean),
    condition_rules: parseJsonArrayField(
      elements.mapConnectionConditionRules.value,
      "Condições da passagem"
    ),
    effect_rules: parseJsonArrayField(
      elements.mapConnectionEffectRules.value,
      "Consequências da viagem"
    ),
    allow_map_travel: elements.mapConnectionAllowMapTravel.checked,
    is_enabled: elements.mapConnectionEnabled.checked,
    is_bidirectional: elements.mapConnectionBidirectional.checked,
    is_secret: elements.mapConnectionSecret.checked,
    is_initially_unlocked: elements.mapConnectionInitiallyUnlocked.checked
  };
  try {
    setMessage(elements.mapConnectionFormMessage, "SALVANDO CONEXÃO...");
    await callAdminRpc("admin_save_map_connection_v2", { p_data: payload });
    await loadMapData(true);
    closeDefinitiveModal(elements.mapConnectionModal);
  } catch (error) {
    setMessage(elements.mapConnectionFormMessage, formatDatabaseError(error), "error");
  }
}

/* PROGRESSO */
async function loadProgressData(force = false) {
  if (!force && state.loadedDefinitiveSections.has("progress")) {
    renderProgress();
    return;
  }
  const [profilesResult, sessionsResult] = await Promise.all([
    state.client.from("player_profiles").select("*").order("last_seen_at", { ascending: false }),
    state.client.from("game_sessions").select("*").eq("game_id", state.game.id).order("updated_at", { ascending: false }).limit(500)
  ]);
  if (profilesResult.error) throw profilesResult.error;
  if (sessionsResult.error) throw sessionsResult.error;
  state.playerProfiles = profilesResult.data || [];
  state.progressRecords = sessionsResult.data || [];
  state.loadedDefinitiveSections.add("progress");
  populateProgressRouteFilter();
  renderProgress();
}

function populateProgressRouteFilter() {
  if (!elements.progressRouteFilter) return;
  const current = elements.progressRouteFilter.value;
  elements.progressRouteFilter.innerHTML = '<option value="">Todas</option>';
  state.routes.forEach(route => {
    const option = document.createElement("option");
    option.value = route.id;
    option.textContent = route.name;
    elements.progressRouteFilter.appendChild(option);
  });
  elements.progressRouteFilter.value = current;
}

function renderProgress() {
  if (!elements.progressList) return;
  const search = normalizeCommandText(elements.progressSearch?.value || "");
  const route = elements.progressRouteFilter?.value || "";
  const type = elements.progressTypeFilter?.value || "";
  const profileMap = new Map(state.playerProfiles.map(profile => [profile.user_id, profile]));
  const filtered = state.progressRecords.filter(record => {
    const profile = profileMap.get(record.user_id) || {};
    const scene = getSceneById(record.current_scene_id);
    const currentRoute = getRouteById(record.route_id);
    const text = normalizeCommandText(`${profile.player_code || ""} ${scene?.title || scene?.scene_key || ""} ${currentRoute?.name || ""}`);
    if (search && !text.includes(search)) return false;
    if (route && record.route_id !== route) return false;
    if (type === "test" && record.is_test !== true) return false;
    if (type === "player" && record.is_test === true) return false;
    return true;
  });

  elements.totalPlayerProfiles.textContent = String(state.playerProfiles.length);
  elements.totalProgressRecords.textContent = String(state.progressRecords.length);
  elements.activeProgressRecords.textContent = String(state.progressRecords.filter(item => item.status === "active").length);
  elements.testProgressRecords.textContent = String(state.progressRecords.filter(item => item.is_test).length);
  elements.progressList.replaceChildren();

  filtered.forEach(record => {
    const profile = profileMap.get(record.user_id) || {};
    const scene = getSceneById(record.current_scene_id);
    const routeRecord = getRouteById(record.route_id);
    elements.progressList.appendChild(createEntityCard({
      id: record.id,
      kind: "progress",
      title: profile.player_code || (record.is_test ? "TESTE ADMINISTRATIVO" : "JOGADOR SEM CÓDIGO"),
      identifier: record.id,
      description: scene ? `Cena atual: ${scene.title || scene.scene_key}` : "Cena atual não identificada.",
      badge: record.is_test ? "TESTE" : String(record.status || "ATIVO").toUpperCase(),
      metadata: [routeRecord?.name || "Sem Rota", `${record.command_count || 0} comando(s)`, formatDateTime(record.updated_at)]
    }));
  });
  setMessage(elements.progressListMessage, filtered.length ? `${filtered.length} PROGRESSO(S).` : "Nenhum progresso encontrado.");
}

function handleProgressListClick(event) {
  const card = event.target.closest("[data-entity-id]");
  if (!card || !event.target.closest("[data-entity-action]")) return;
  openProgressDetail(card.dataset.entityId);
}

async function openProgressDetail(id) {
  const record = state.progressRecords.find(item => item.id === id);
  if (!record) return;
  state.selectedProgressId = id;
  elements.progressDetailTitle.textContent = "Detalhes do progresso";
  elements.progressDetailSummary.textContent = "CARREGANDO RUNTIME...";
  openDefinitiveModal(elements.progressDetailModal);
  try {
    const runtime = await callAdminRpc("admin_get_progress_runtime", { p_session_id: id });
    const sceneRuntime = runtime?.scene_runtime || {};
    elements.progressDetailSummary.innerHTML = `
      <p><strong>Cena:</strong> ${escapeHtml(sceneRuntime.scene?.title || sceneRuntime.scene?.scene_key || "—")}</p>
      <p><strong>Rota:</strong> ${escapeHtml(sceneRuntime.route?.name || "—")}</p>
      <p><strong>Atualizado:</strong> ${escapeHtml(formatDateTime(record.updated_at))}</p>`;
    renderSimpleInspector(elements.progressDetailInventory, runtime?.inventory);
    renderSimpleInspector(elements.progressDetailFlags, runtime?.flags);
    renderSimpleInspector(elements.progressDetailRoutes, runtime?.routes);
    renderSimpleInspector(elements.progressDetailMap, runtime?.map?.locations);
  } catch (error) {
    setMessage(elements.progressDetailMessage, formatDatabaseError(error), "error");
  }
}

async function resetSelectedProgress() {
  if (!state.selectedProgressId) return;
  if (!window.confirm("Reiniciar completamente o progresso selecionado?")) return;
  try {
    await callAdminRpc("admin_reset_story_progress", { p_session_id: state.selectedProgressId });
    closeDefinitiveModal(elements.progressDetailModal);
    await loadProgressData(true);
  } catch (error) {
    setMessage(elements.progressDetailMessage, formatDatabaseError(error), "error");
  }
}

/* NÃO RECONHECIDOS */
async function loadUnrecognizedData(force = false) {
  if (!force && state.loadedDefinitiveSections.has("unrecognized")) {
    renderUnrecognized();
    return;
  }
  const { data, error } = await state.client.from("unrecognized_inputs").select("*").order("created_at", { ascending: false }).limit(1000);
  if (error) throw error;
  state.unrecognizedInputs = data || [];
  state.loadedDefinitiveSections.add("unrecognized");
  populateUnrecognizedSceneFilter();
  renderUnrecognized();
}

function populateUnrecognizedSceneFilter() {
  [elements.unrecognizedSceneFilter, elements.unrecognizedTargetScene].forEach(select => {
    if (!select) return;
    const current = select.value;
    select.innerHTML = select === elements.unrecognizedSceneFilter ? '<option value="">Todas</option>' : '<option value="">Selecione</option>';
    state.scenes.forEach(scene => {
      const option = document.createElement("option");
      option.value = scene.id;
      option.textContent = scene.title || scene.scene_key;
      select.appendChild(option);
    });
    select.value = current;
  });
}

function renderUnrecognized() {
  if (!elements.unrecognizedList) return;
  const search = normalizeCommandText(elements.unrecognizedSearch?.value || "");
  const status = elements.unrecognizedStatusFilter?.value || "";
  const scene = elements.unrecognizedSceneFilter?.value || "";
  const filtered = state.unrecognizedInputs.filter(item => {
    const text = normalizeCommandText(`${item.player_input || ""} ${item.normalized_input || ""}`);
    if (search && !text.includes(search)) return false;
    if (status && item.review_status !== status) return false;
    if (scene && item.scene_id !== scene) return false;
    return true;
  });
  const count = value => state.unrecognizedInputs.filter(item => item.review_status === value).length;
  elements.pendingUnrecognized.textContent = String(count("pending"));
  elements.resolvedUnrecognized.textContent = String(count("resolved"));
  elements.convertedUnrecognized.textContent = String(count("converted"));
  elements.ignoredUnrecognized.textContent = String(count("ignored"));
  elements.unrecognizedList.replaceChildren();

  filtered.forEach(item => {
    const card = createEntityCard({
      id: item.id,
      kind: "unrecognized",
      title: item.player_input || "Comando vazio",
      identifier: item.normalized_input || "",
      description: getSceneById(item.scene_id)?.title || "Cena não identificada",
      badge: String(item.review_status || "pending").toUpperCase(),
      metadata: [formatDateTime(item.created_at)]
    });
    const edit = card.querySelector('[data-entity-action="edit"]');
    if (edit) edit.textContent = "CONVERTER";
    const more = card.querySelector('[data-entity-action="more"]');
    if (more) more.textContent = "IGNORAR";
    elements.unrecognizedList.appendChild(card);
  });
  setMessage(elements.unrecognizedListMessage, filtered.length ? `${filtered.length} COMANDO(S).` : "Nenhum comando encontrado.");
}

async function handleUnrecognizedListClick(event) {
  const card = event.target.closest("[data-entity-id]");
  if (!card) return;
  const item = state.unrecognizedInputs.find(entry => String(entry.id) === card.dataset.entityId);
  if (!item) return;
  if (event.target.closest('[data-entity-action="edit"]')) openUnrecognizedConvertModal(item);
  if (event.target.closest('[data-entity-action="more"]')) {
    try {
      await callAdminRpc("admin_review_unrecognized_input", { p_input_id: item.id, p_status: "ignored", p_response_id: null });
      await loadUnrecognizedData(true);
    } catch (error) {
      setMessage(elements.unrecognizedListMessage, formatDatabaseError(error), "error");
    }
  }
}

function openUnrecognizedConvertModal(item) {
  state.selectedUnrecognizedId = item.id;
  elements.unrecognizedConvertId.value = item.id;
  elements.unrecognizedOriginalInput.value = item.player_input || "";
  elements.unrecognizedNormalizedInput.value = item.normalized_input || "";
  elements.unrecognizedTargetScene.value = item.scene_id || "";
  elements.unrecognizedResponseKey.value = normalizeInternalKey(item.normalized_input || item.player_input);
  elements.unrecognizedResponseText.value = "";
  openDefinitiveModal(elements.unrecognizedConvertModal);
}

async function convertUnrecognizedToResponse(event) {
  event.preventDefault();
  try {
    await callAdminRpc("admin_convert_unrecognized_input", {
      p_input_id: state.selectedUnrecognizedId,
      p_scene_id: elements.unrecognizedTargetScene.value,
      p_response_key: normalizeInternalKey(elements.unrecognizedResponseKey.value),
      p_response_text: emptyToNull(elements.unrecognizedResponseText.value)
    });
    await Promise.all([refreshResponses(), loadUnrecognizedData(true)]);
    closeDefinitiveModal(elements.unrecognizedConvertModal);
  } catch (error) {
    setMessage(elements.unrecognizedConvertMessage, formatDatabaseError(error), "error");
  }
}

/* HISTÓRICO */
async function loadHistoryData(force = false) {
  if (!force && state.loadedDefinitiveSections.has("history")) {
    renderHistoryAdmin();
    return;
  }
  const { data, error } = await state.client.from("player_history").select("*").order("created_at", { ascending: false }).limit(1000);
  if (error) throw error;
  state.historyEntries = data || [];
  state.loadedDefinitiveSections.add("history");
  renderHistoryAdmin();
}

function renderHistoryAdmin() {
  if (!elements.historyList) return;
  const search = normalizeCommandText(elements.historySearch?.value || "");
  const type = elements.historyTypeFilter?.value || "";
  const period = elements.historyPeriodFilter?.value || "";
  const now = Date.now();
  const maxAge = period === "today" ? 86400000 : period === "7days" ? 604800000 : period === "30days" ? 2592000000 : null;
  const filtered = state.historyEntries.filter(item => {
    const text = normalizeCommandText(`${item.player_input || item.command_text || ""} ${item.displayed_text || item.response_text || ""}`);
    if (search && !text.includes(search)) return false;
    if (type && item.entry_type !== type) return false;
    if (maxAge && now - new Date(item.created_at).getTime() > maxAge) return false;
    return true;
  });
  elements.historyList.replaceChildren();
  filtered.forEach(item => {
    const template = elements.historyEntryTemplate;
    const entry = template?.content.firstElementChild.cloneNode(true) || document.createElement("article");
    entry.querySelector(".history-entry__type").textContent = String(item.entry_type || "evento").toUpperCase();
    entry.querySelector(".history-entry__time").textContent = formatDateTime(item.created_at);
    entry.querySelector(".history-entry__player").textContent = item.session_id ? `Progresso: ${item.session_id}` : "";
    entry.querySelector(".history-entry__input").textContent = item.player_input || item.command_text || "";
    entry.querySelector(".history-entry__text").textContent = item.displayed_text || item.response_text || "";
    elements.historyList.appendChild(entry);
  });
  setMessage(elements.historyListMessage, filtered.length ? `${filtered.length} EVENTO(S).` : "Nenhum evento encontrado.");
}

/* CONFIGURAÇÕES */
async function loadSettingsData(force = false) {
  if (!force && state.loadedDefinitiveSections.has("settings") && state.gameSettings) {
    fillSettingsForm(state.gameSettings);
    return;
  }
  const { data, error } = await state.client.from("game_settings").select("*").eq("game_id", state.game.id).maybeSingle();
  if (error) throw error;
  state.gameSettings = data || {};
  state.loadedDefinitiveSections.add("settings");
  fillSettingsForm(state.gameSettings);
}

function fillSettingsForm(settings) {
  elements.settingsDefaultFallback.value = settings.default_fallback_text || settings.fallback_text || "Não parece possível fazer isso agora.";
  elements.settingsDefaultHelp.value = settings.default_help_text || settings.help_text || "Tente observar, examinar ou interagir com elementos da Cena.";
  elements.settingsInventoryEmpty.value = settings.inventory_empty_text || "Você não possui nenhum item.";
  elements.settingsMapEmpty.value = settings.map_empty_text || "Nenhum local foi descoberto.";
  elements.settingsMaxInputLength.value = String(settings.max_input_length || 300);
  elements.settingsHistoryLimit.value = String(settings.history_limit || 20);
  elements.settingsEnableInventory.checked = settings.enable_inventory !== false;
  elements.settingsEnableHistory.checked = settings.enable_history !== false;
  elements.settingsEnableMap.checked = settings.enable_map !== false;
  elements.settingsLogUnrecognized.checked = settings.log_unrecognized_inputs !== false;
  setMessage(elements.settingsFormMessage);
}

async function saveGameSettings(event) {
  event.preventDefault();
  const payload = {
    game_id: state.game.id,
    default_fallback_text: elements.settingsDefaultFallback.value,
    default_help_text: elements.settingsDefaultHelp.value,
    inventory_empty_text: elements.settingsInventoryEmpty.value,
    map_empty_text: elements.settingsMapEmpty.value,
    max_input_length: Number(elements.settingsMaxInputLength.value || 300),
    history_limit: Number(elements.settingsHistoryLimit.value || 20),
    enable_inventory: elements.settingsEnableInventory.checked,
    enable_history: elements.settingsEnableHistory.checked,
    enable_map: elements.settingsEnableMap.checked,
    log_unrecognized_inputs: elements.settingsLogUnrecognized.checked
  };
  try {
    setMessage(elements.settingsFormMessage, "SALVANDO CONFIGURAÇÕES...");
    await callAdminRpc("admin_save_game_settings", { p_data: payload });
    state.gameSettings = payload;
    setMessage(elements.settingsFormMessage, "CONFIGURAÇÕES SALVAS.", "success");
  } catch (error) {
    setMessage(elements.settingsFormMessage, formatDatabaseError(error), "error");
  }
}

/* VALIDADOR */
async function runStoryValidator() {
  setMessage(elements.validatorMessage, "VALIDANDO ESTRUTURA...");
  try {
    const results = await callAdminRpc("run_game_validation", { p_game_id: state.game.id });
    state.validationResults = Array.isArray(results) ? results : results?.results || [];
    renderStoredValidation();
  } catch (error) {
    state.validationResults = runClientValidation();
    renderStoredValidation();
    setMessage(elements.validatorMessage, `Validação local executada. ${formatDatabaseError(error)}`);
  }
}

function runClientValidation() {
  const results = [];
  state.scenes.forEach(scene => {
    const hasBlock = state.blocks?.some(block => block.scene_id === scene.id);
    if (!hasBlock) results.push({ severity: "warning", title: "Cena sem Blocos carregados", description: scene.title || scene.scene_key, reference: scene.id });
  });
  state.responses.forEach(response => {
    if (response.target_scene_id && !getSceneById(response.target_scene_id)) results.push({ severity: "error", title: "Destino de Caminho inválido", description: response.response_key, reference: response.target_scene_id });
  });
  state.routes.forEach(route => {
    if (route.start_scene_id && !getSceneById(route.start_scene_id)) results.push({ severity: "error", title: "Rota com Cena inicial inválida", description: route.name, reference: route.start_scene_id });
  });
  return results;
}

function renderStoredValidation() {
  if (!elements.validatorResults) return;
  const results = state.validationResults || [];
  elements.validatorErrors.textContent = String(results.filter(item => item.severity === "error").length);
  elements.validatorWarnings.textContent = String(results.filter(item => item.severity === "warning").length);
  elements.validatorInfo.textContent = String(results.filter(item => item.severity === "info").length);
  elements.validatorLastRun.textContent = results.length ? new Date().toLocaleTimeString("pt-BR") : "—";
  elements.validatorResults.replaceChildren();
  if (!results.length) {
    const empty = document.createElement("div");
    empty.className = "scene-list__empty";
    empty.textContent = "Nenhum problema registrado. Execute a validação para conferir novamente.";
    elements.validatorResults.appendChild(empty);
    return;
  }
  results.forEach(item => {
    const node = elements.validatorResultTemplate.content.firstElementChild.cloneNode(true);
    node.classList.add(`is-${item.severity || "info"}`);
    node.querySelector(".validator-result__severity").textContent = String(item.severity || "info").toUpperCase();
    node.querySelector(".validator-result__title").textContent = item.title || item.object_name || "Validação";
    node.querySelector(".validator-result__description").textContent = item.description || item.details || "";
    node.querySelector(".validator-result__reference").textContent = item.reference || item.object_id || "";
    elements.validatorResults.appendChild(node);
  });
  setMessage(elements.validatorMessage, `${results.length} RESULTADO(S).`);
}

/* TESTE */
function prepareTestingSection() {
  populateDefinitiveSelectors();
  renderTestRuntime();
}

async function createAdminTestSession() {
  try {
    setMessage(elements.testModeMessage, "CRIANDO TESTE...");
    const result = await callAdminRpc("admin_initialize_test_session", {
      p_game_id: state.game.id,
      p_route_id: elements.testStartRoute.value || null,
      p_scene_id: elements.testStartScene.value || null
    });
    state.testSession = result.session || result;
    state.testRuntime = result.runtime || null;
    if (!state.testRuntime && state.testSession?.id) {
      state.testRuntime = await callAdminRpc("admin_get_progress_runtime", { p_session_id: state.testSession.id });
    }
    renderTestRuntime();
    setMessage(elements.testModeMessage, "TESTE INICIADO.", "success");
  } catch (error) {
    setMessage(elements.testModeMessage, formatDatabaseError(error), "error");
  }
}

async function resetAdminTestSession() {
  if (!state.testSession?.id) return;
  try {
    await callAdminRpc("admin_reset_story_progress", { p_session_id: state.testSession.id });
    state.testRuntime = await callAdminRpc("admin_get_progress_runtime", { p_session_id: state.testSession.id });
    renderTestRuntime();
  } catch (error) {
    setMessage(elements.testModeMessage, formatDatabaseError(error), "error");
  }
}

async function sendAdminTestCommand(event) {
  event.preventDefault();
  const input = elements.testCommandInput.value.trim();
  if (!input || !state.testSession?.id) return;
  elements.testCommandInput.value = "";
  try {
    const result = await callAdminRpc("admin_process_test_input", { p_session_id: state.testSession.id, p_input: input });
    state.testRuntime = result.runtime || await callAdminRpc("admin_get_progress_runtime", { p_session_id: state.testSession.id });
    elements.testResponseOutput.textContent = result.message || "";
    renderTestRuntime();
  } catch (error) {
    setMessage(elements.testModeMessage, formatDatabaseError(error), "error");
  }
}

function renderTestRuntime() {
  const runtime = state.testRuntime || {};
  const sceneRuntime = runtime.scene_runtime || {};
  const active = Boolean(state.testSession?.id);
  elements.testCommandInput.disabled = !active;
  elements.sendTestCommandButton.disabled = !active;
  elements.resetTestSessionButton.disabled = !active;
  elements.testSessionId.textContent = state.testSession?.id || "Nenhuma";
  elements.testCurrentScene.textContent = sceneRuntime.scene?.title || sceneRuntime.scene?.scene_key || "—";
  elements.testCurrentRoute.textContent = sceneRuntime.route?.name || "—";
  elements.testCommandCount.textContent = String(sceneRuntime.session?.command_count || state.testSession?.command_count || 0);
  elements.testScenePreview.replaceChildren();
  if (sceneRuntime.blocks?.length) {
    sceneRuntime.blocks.forEach(block => {
      const p = document.createElement(block.block_type === "title" ? "h3" : "p");
      p.textContent = block.content || block.alt_text || block.media_url || "";
      elements.testScenePreview.appendChild(p);
    });
  } else {
    elements.testScenePreview.textContent = active ? "Cena sem Blocos." : "Nenhum teste foi iniciado.";
  }
  renderSimpleInspector(elements.testInventoryInspector, runtime.inventory);
  renderSimpleInspector(elements.testFlagsInspector, runtime.flags);
  renderSimpleInspector(elements.testMapInspector, runtime.map?.locations);
  renderSimpleInspector(elements.testHistoryInspector, runtime.history);
}

function renderSimpleInspector(container, records) {
  if (!container) return;
  container.replaceChildren();
  const list = Array.isArray(records) ? records : [];
  if (!list.length) {
    container.textContent = "Nenhum registro.";
    return;
  }
  list.slice(0, 50).forEach(record => {
    const item = document.createElement("div");
    item.className = "inspector-record";
    item.textContent = record.name || record.title || record.flag_key || record.item_key || record.location_key || record.displayed_text || JSON.stringify(record);
    container.appendChild(item);
  });
}

/* CONSTRUTOR DE REGRAS */
function formatRuleTextarea(mode) {
  try {
    const field = mode === "condition" ? elements.responseConditionRules : elements.responseEffectRules;
    field.value = formatJsonField(parseJsonField(field.value, []), []);
    setMessage(elements.advancedRulesMessage, "JSON FORMATADO.", "success");
  } catch (error) {
    setMessage(elements.advancedRulesMessage, error.message, "error");
  }
}

function openRuleBuilder() {
  try {
    state.ruleBuilderConditions = parseJsonField(elements.responseConditionRules.value, []);
    state.ruleBuilderEffects = parseJsonField(elements.responseEffectRules.value, []);
    setRuleBuilderMode("condition");
    populateRuleBuilderReferences();
    renderRuleBuilderLists();
    openDefinitiveModal(elements.ruleBuilderModal);
  } catch (error) {
    setMessage(elements.advancedRulesMessage, error.message, "error");
  }
}

function setRuleBuilderMode(mode) {
  state.ruleBuilderMode = mode;
  elements.ruleBuilderConditionPanel.classList.toggle("is-hidden", mode !== "condition");
  elements.ruleBuilderEffectPanel.classList.toggle("is-hidden", mode !== "effect");
  elements.ruleBuilderConditionTab.classList.toggle("is-active", mode === "condition");
  elements.ruleBuilderEffectTab.classList.toggle("is-active", mode === "effect");
  populateRuleBuilderReferences();
}

function populateRuleBuilderReferences() {
  if (!elements.ruleConditionReference || !elements.ruleEffectReference) return;
  const conditionType = elements.ruleConditionType.value;
  const effectType = elements.ruleEffectType.value;
  fillReferenceSelect(elements.ruleConditionReference, getReferencesForRuleType(conditionType));
  fillReferenceSelect(elements.ruleEffectReference, getReferencesForRuleType(effectType));
}

function getReferencesForRuleType(type) {
  if (type.includes("item")) return state.items.map(item => ({ id: item.item_key, name: item.name }));
  if (type.includes("flag")) return state.flags.map(item => ({ id: item.flag_key, name: item.name || item.flag_key }));
  if (type.includes("route")) return state.routes.map(item => ({ id: item.id, name: item.name }));
  if (type.includes("secret")) return state.secrets.map(item => ({ id: item.secret_key, name: item.name }));
  if (type.includes("location") || type === "move_location") return state.mapLocations.map(item => ({ id: item.id, name: item.name }));
  return [];
}

function fillReferenceSelect(select, records) {
  const current = select.value;
  select.replaceChildren();
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = records.length ? "Selecione" : "Sem referência";
  select.appendChild(empty);
  records.forEach(record => {
    const option = document.createElement("option");
    option.value = record.id;
    option.textContent = record.name;
    select.appendChild(option);
  });
  select.value = current;
}

function addConditionFromBuilder() {
  state.ruleBuilderConditions.push({
    type: elements.ruleConditionType.value,
    reference: elements.ruleConditionReference.value || null,
    operator: elements.ruleConditionOperator.value,
    value: parseLooseValue(elements.ruleConditionValue.value)
  });
  renderRuleBuilderLists();
}

function addEffectFromBuilder() {
  state.ruleBuilderEffects.push({
    type: elements.ruleEffectType.value,
    reference: elements.ruleEffectReference.value || null,
    value: parseLooseValue(elements.ruleEffectValue.value),
    text: emptyToNull(elements.ruleEffectText.value)
  });
  renderRuleBuilderLists();
}

function parseLooseValue(value) {
  const text = String(value || "").trim();
  if (text === "true") return true;
  if (text === "false") return false;
  if (text !== "" && !Number.isNaN(Number(text))) return Number(text);
  return text || null;
}

function renderRuleBuilderLists() {
  renderRuleList(elements.conditionRuleList, state.ruleBuilderConditions, "condition");
  renderRuleList(elements.effectRuleList, state.ruleBuilderEffects, "effect");
}

function renderRuleList(container, rules, mode) {
  container.replaceChildren();
  rules.forEach((rule, index) => {
    const row = document.createElement("div");
    row.className = "rule-list__item";
    const code = document.createElement("code");
    code.textContent = JSON.stringify(rule);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "button button--icon";
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      rules.splice(index, 1);
      renderRuleBuilderLists();
    });
    row.append(code, remove);
    container.appendChild(row);
  });
}

function applyRuleBuilder() {
  elements.responseConditionRules.value = formatJsonField(state.ruleBuilderConditions, []);
  elements.responseEffectRules.value = formatJsonField(state.ruleBuilderEffects, []);
  closeDefinitiveModal(elements.ruleBuilderModal);
  setMessage(elements.advancedRulesMessage, "REGRAS APLICADAS AO CAMINHO.", "success");
}

function populateDefinitiveSelectors() {
  if (elements.testStartRoute) {
    elements.testStartRoute.innerHTML = '<option value="">Rota padrão</option>';
    state.routes.forEach(route => {
      const option = document.createElement("option");
      option.value = route.id;
      option.textContent = route.name;
      elements.testStartRoute.appendChild(option);
    });
  }
  if (elements.testStartScene) {
    elements.testStartScene.innerHTML = '<option value="">Cena inicial automática</option>';
    state.scenes.forEach(scene => {
      const option = document.createElement("option");
      option.value = scene.id;
      option.textContent = scene.title || scene.scene_key;
      elements.testStartScene.appendChild(option);
    });
  }
  populateUnrecognizedSceneFilter();
  populateProgressRouteFilter();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
