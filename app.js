const DEFAULT_CONFIG = {
  width: 905,
  height: 1280,
  columns: 7,
  rows: 5,
  maxProducts: 35,
  gridGap: 0,
  headerHeight: 382,
  badgeSize: 84,
  priceTagMode: "selling-mrp-off",
  exportScale: 2,
  styles: {
    background: "#ffffff",
    headerA: "#ffbf26",
    headerB: "#f47a22",
    headerC: "#ffd447",
    strip: "#16843a",
    badge: "#dc1019",
    label: "#f7bd22",
    panel: "#fff6dc",
    dark: "#163624"
  }
};

const PRESETS = {
  1: { columns: 1, rows: 1 },
  4: { columns: 2, rows: 2 },
  6: { columns: 3, rows: 2 },
  10: { columns: 5, rows: 2 },
  12: { columns: 4, rows: 3 },
  20: { columns: 5, rows: 4 },
  35: { columns: 7, rows: 5 }
};

const TABS = {
  products: "/products",
  "poster-builder": "/poster-builder",
  templates: "/templates"
};

const SECTION_STORAGE_KEY = "storePoster.collapsedSections";
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_UPLOAD_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const DEMO_IMAGE_SIZE = "1024x1024";
const DEMO_IMAGE_QUALITY = "low";
const IMAGE_STYLE_VALUES = new Set(["auto", "whole", "bunch", "cut", "prepared"]);
const DEFAULT_LOGO_SETTINGS = {
  logoDataUrl: "",
  logoX: 330,
  logoY: 42,
  logoWidth: 250
};
const DESIGN_ELEMENTS = {
  localName: { label: "Local Name", kind: "text", minW: 70, minH: 16 },
  storeName: { label: "Brand Name", kind: "text", minW: 90, minH: 18 },
  hypermarket: { label: "Hypermarket Text", kind: "text", minW: 90, minH: 10 },
  headline: { label: "Headline", kind: "text", minW: 130, minH: 28 },
  subheadline: { label: "Subheadline", kind: "text", minW: 130, minH: 28 },
  basket: { label: "Basket Graphic", kind: "box", minW: 70, minH: 60 },
  delivery: { label: "Delivery Block", kind: "box", minW: 70, minH: 90 },
  contactStrip: { label: "Contact Strip", kind: "box", minW: 260, minH: 34 },
  productGrid: { label: "Product Grid", kind: "box", minW: 180, minH: 180 },
  logo: { label: "Logo", kind: "box", minW: 40, minH: 24 }
};
const DESIGN_ELEMENT_ORDER = Object.keys(DESIGN_ELEMENTS);

const state = {
  health: null,
  brand: null,
  products: [],
  templates: [],
  template: null,
  selectedIds: [],
  activeProductId: null,
  activeTab: "products",
  search: "",
  posterSearch: "",
  hitAreas: [],
  designMode: false,
  selectedElementId: "headline",
  designAreas: [],
  designDrag: null
};

const imageCache = new Map();
const imageLoading = new Set();
let logoImage = null;
let logoImageSource = "";
let toastTimer = null;

const el = {
  healthBadge: $("#healthBadge"),
  storeName: $("#storeNameInput"),
  localName: $("#localNameInput"),
  hypermarketLabel: $("#hypermarketLabelInput"),
  headline: $("#headlineInput"),
  subheadline: $("#subheadlineInput"),
  phone: $("#phoneInput"),
  validUntil: $("#validUntilInput"),
  deliveryText: $("#deliveryTextInput"),
  logoImage: $("#logoImageInput"),
  clearLogo: $("#clearLogoButton"),
  logoSize: $("#logoSizeInput"),
  logoX: $("#logoXInput"),
  logoY: $("#logoYInput"),
  logoSizeValue: $("#logoSizeValue"),
  logoXValue: $("#logoXValue"),
  logoYValue: $("#logoYValue"),
  saveBrand: $("#saveBrandButton"),
  productTemplateSelect: $("#productTemplateSelect"),
  builderTemplateSelect: $("#builderTemplateSelect"),
  builderPriceTag: $("#builderPriceTagInput"),
  designMode: $("#designModeInput"),
  designElement: $("#designElementSelect"),
  designX: $("#designXInput"),
  designY: $("#designYInput"),
  designWidth: $("#designWidthInput"),
  designHeight: $("#designHeightInput"),
  designXValue: $("#designXValue"),
  designYValue: $("#designYValue"),
  designWidthValue: $("#designWidthValue"),
  designHeightValue: $("#designHeightValue"),
  designVisible: $("#designVisibleInput"),
  designLocked: $("#designLockedInput"),
  resetDesignElement: $("#resetDesignElementButton"),
  templateSelect: $("#templateSelect"),
  templateName: $("#templateNameInput"),
  priceTag: $("#priceTagInput"),
  presetRow: $("#presetRow"),
  columns: $("#columnsInput"),
  rows: $("#rowsInput"),
  gap: $("#gapInput"),
  badgeSize: $("#badgeSizeInput"),
  headerHeight: $("#headerHeightInput"),
  exportScale: $("#exportScaleInput"),
  newTemplate: $("#newTemplateButton"),
  saveTemplate: $("#saveTemplateButton"),
  productSearch: $("#productSearchInput"),
  posterProductSearch: $("#posterProductSearchInput"),
  addProduct: $("#addProductButton"),
  selectAll: $("#selectAllButton"),
  clearSelection: $("#clearSelectionButton"),
  productList: $("#productList"),
  posterProductList: $("#posterProductList"),
  posterCanvas: $("#posterCanvas"),
  templatePreviewCanvas: $("#templatePreviewCanvas"),
  templatePreviewTitle: $("#templatePreviewTitle"),
  templatePreviewMetric: $("#templatePreviewMetric"),
  posterTitle: $("#posterTitle"),
  download: $("#downloadButton"),
  selectionCount: $("#selectionCount"),
  imageState: $("#imageState"),
  productThumb: $("#productThumb"),
  productName: $("#productNameInput"),
  productUnit: $("#productUnitInput"),
  productCategory: $("#productCategoryInput"),
  productImageStyle: $("#productImageStyleInput"),
  sellingPrice: $("#sellingPriceInput"),
  mrp: $("#mrpInput"),
  imageUrl: $("#imageUrlInput"),
  saveProduct: $("#saveProductButton"),
  sendToBuilder: $("#sendToBuilderButton"),
  builderProductThumb: $("#builderProductThumb"),
  builderProductLabel: $("#builderProductLabel"),
  builderProductMeta: $("#builderProductMeta"),
  builderProductName: $("#builderProductNameInput"),
  builderProductUnit: $("#builderProductUnitInput"),
  builderProductCategory: $("#builderProductCategoryInput"),
  builderImageStyle: $("#builderImageStyleInput"),
  builderSellingPrice: $("#builderSellingPriceInput"),
  builderMrp: $("#builderMrpInput"),
  builderImageUrl: $("#builderImageUrlInput"),
  builderUploadImage: $("#builderUploadImageInput"),
  builderUploadImageButton: $("#builderUploadImageButton"),
  builderSaveProduct: $("#builderSaveProductButton"),
  builderContentStatus: $("#builderContentStatus"),
  imageSize: $("#imageSizeInput"),
  imageQuality: $("#imageQualityInput"),
  uploadImage: $("#uploadImageInput"),
  uploadImageButton: $("#uploadImageButton"),
  reuseImage: $("#reuseImageButton"),
  regenerateImage: $("#regenerateImageButton"),
  aiStatus: $("#aiStatus"),
  productMetric: $("#productMetric"),
  templateMetric: $("#templateMetric"),
  openRouterMetric: $("#openRouterMetric"),
  tabLinks: [...document.querySelectorAll("[data-tab-link]")],
  tabPanels: [...document.querySelectorAll("[data-tab-panel]")],
  sectionToggles: [...document.querySelectorAll("[data-section-toggle]")],
  toast: $("#toast")
};

boot();

async function boot() {
  disableUi(true);
  wireEvents();

  try {
    await loadInitialData();
    renderAll();
    toast("Ready");
  } catch (error) {
    setHealthBadge("Load error", "error");
    toast(error.message || "App failed to load");
    console.error(error);
  } finally {
    disableUi(false);
    syncDemoImageControls();
    syncLogoInputs();
    syncDesignControls();
    syncProductInputs();
  }
}

async function loadInitialData() {
  const [health, brand, products, templates] = await Promise.all([
    apiGet("/api/health"),
    apiGet("/api/brand"),
    apiGet("/api/products"),
    apiGet("/api/templates")
  ]);

  state.health = health;
  state.brand = normalizeBrand(brand.brand);
  state.products = products.products || [];
  state.templates = templates.templates || [];
  state.template = state.templates[0] || makeFallbackTemplate();

  const config = getConfig();
  const maxProducts = config.maxProducts || config.columns * config.rows;
  state.selectedIds = state.products.slice(0, maxProducts).map((product) => product.id);
  state.activeProductId = state.selectedIds[0] || state.products[0]?.id || null;
  preloadLogoImage();
  preloadVisibleImages();
}

function wireEvents() {
  wireTabEvents();
  wireCollapsibleSections();

  [
    ["storeName", "storeName"],
    ["localName", "localName"],
    ["hypermarketLabel", "hypermarketLabel"],
    ["headline", "headline"],
    ["subheadline", "subheadline"],
    ["phone", "phone"],
    ["validUntil", "validUntil"],
    ["deliveryText", "deliveryText"]
  ].forEach(([elementKey, brandKey]) => {
    el[elementKey].addEventListener("input", () => {
      state.brand[brandKey] = el[elementKey].value;
      drawCanvases();
      renderHeaderMetrics();
    });
  });

  el.logoImage.addEventListener("change", uploadLogoImage);
  el.clearLogo.addEventListener("click", clearLogoImage);

  [
    ["logoSize", "logoWidth", 50, 420],
    ["logoX", "logoX", 0, DEFAULT_CONFIG.width],
    ["logoY", "logoY", 0, DEFAULT_CONFIG.height]
  ].forEach(([elementKey, brandKey, min, max]) => {
    el[elementKey].addEventListener("input", () => {
      state.brand[brandKey] = clamp(Number(el[elementKey].value), min, max);
      syncLogoInputs();
      drawCanvases();
    });
  });

  el.saveBrand.addEventListener("click", saveBrand);

  el.productTemplateSelect.addEventListener("change", () => {
    activateTemplate(el.productTemplateSelect.value);
  });

  el.templateSelect.addEventListener("change", () => {
    activateTemplate(el.templateSelect.value);
  });

  el.builderTemplateSelect.addEventListener("change", () => {
    activateTemplate(el.builderTemplateSelect.value);
  });

  el.builderPriceTag.addEventListener("change", () => {
    updateTemplateConfig("priceTagMode", el.builderPriceTag.value);
  });

  el.designMode.addEventListener("change", () => {
    state.designMode = el.designMode.checked;
    el.posterCanvas.classList.toggle("is-design-mode", state.designMode);
    syncDesignControls();
    drawPoster();
  });

  el.designElement.addEventListener("change", () => {
    state.selectedElementId = el.designElement.value;
    syncDesignControls();
    drawPoster();
  });

  [
    ["designX", "x"],
    ["designY", "y"],
    ["designWidth", "w"],
    ["designHeight", "h"]
  ].forEach(([elementKey, fieldKey]) => {
    el[elementKey].addEventListener("input", () => {
      updateDesignElement(state.selectedElementId, { [fieldKey]: Number(el[elementKey].value) });
    });
  });

  el.designVisible.addEventListener("change", () => {
    updateDesignElement(state.selectedElementId, { visible: el.designVisible.checked });
  });

  el.designLocked.addEventListener("change", () => {
    updateDesignElement(state.selectedElementId, { locked: el.designLocked.checked });
  });

  el.resetDesignElement.addEventListener("click", () => {
    resetDesignElement(state.selectedElementId);
  });

  el.templateName.addEventListener("input", () => {
    if (!state.template) return;
    state.template.name = el.templateName.value.trimStart();
    syncTemplateSelector();
  });

  el.priceTag.addEventListener("change", () => {
    updateTemplateConfig("priceTagMode", el.priceTag.value);
  });

  el.presetRow.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-preset]");
    if (!button) return;
    applyPreset(Number(button.dataset.preset));
  });

  [
    ["columns", "columns", 1, 10],
    ["rows", "rows", 1, 10],
    ["gap", "gridGap", 0, 18],
    ["badgeSize", "badgeSize", 44, 140],
    ["headerHeight", "headerHeight", 220, 520],
    ["exportScale", "exportScale", 1, 4]
  ].forEach(([elementKey, configKey, min, max]) => {
    el[elementKey].addEventListener("input", () => {
      updateTemplateConfig(configKey, clamp(Number(el[elementKey].value), min, max));
    });
  });

  el.saveTemplate.addEventListener("click", saveTemplate);
  el.newTemplate.addEventListener("click", createTemplate);

  el.productSearch.addEventListener("input", () => {
    state.search = el.productSearch.value.trim().toLowerCase();
    renderProductList();
  });

  el.posterProductSearch.addEventListener("input", () => {
    state.posterSearch = el.posterProductSearch.value.trim().toLowerCase();
    renderProductList();
  });

  el.addProduct.addEventListener("click", addProduct);
  el.selectAll.addEventListener("click", selectAllProducts);
  el.clearSelection.addEventListener("click", () => {
    state.selectedIds = [];
    renderAll();
  });

  ["productName", "productUnit", "productCategory", "productImageStyle", "sellingPrice", "mrp", "imageUrl"].forEach((key) => {
    el[key].addEventListener("input", () => {
      updateActiveProductFromInputs();
      syncBuilderProductInputs();
      renderProductList();
      renderImageState();
      preloadVisibleImages();
      drawCanvases();
    });
  });

  el.saveProduct.addEventListener("click", saveActiveProduct);
  el.sendToBuilder.addEventListener("click", sendActiveProductToBuilder);
  el.productImageStyle.addEventListener("change", () => el.productImageStyle.dispatchEvent(new Event("input")));

  ["builderProductName", "builderProductUnit", "builderProductCategory", "builderImageStyle", "builderSellingPrice", "builderMrp", "builderImageUrl"].forEach((key) => {
    el[key].addEventListener("input", () => {
      updateActiveProductFromBuilderInputs();
      updateBuilderProductSummary(getActiveProduct(), { refreshThumb: key === "builderImageUrl" });
      syncProductInputs();
      renderProductList();
      renderImageState();
      preloadVisibleImages();
      drawCanvases();
    });
  });
  el.builderImageStyle.addEventListener("change", () => el.builderImageStyle.dispatchEvent(new Event("input")));
  el.builderSaveProduct.addEventListener("click", saveActiveProduct);
  el.builderUploadImageButton.addEventListener("click", () => el.builderUploadImage.click());
  el.builderUploadImage.addEventListener("change", () => uploadProductImage("builder"));
  el.uploadImageButton.addEventListener("click", () => el.uploadImage.click());
  el.uploadImage.addEventListener("change", () => uploadProductImage("product"));
  el.reuseImage.addEventListener("click", () => generateImage(false));
  el.regenerateImage.addEventListener("click", () => generateImage(true));
  el.download.addEventListener("click", exportPoster);

  el.posterCanvas.addEventListener("pointerdown", handleDesignPointerDown);
  window.addEventListener("pointermove", handleDesignPointerMove);
  window.addEventListener("pointerup", handleDesignPointerUp);
  window.addEventListener("keydown", handleDesignKeyDown);

  el.posterCanvas.addEventListener("click", (event) => {
    if (state.designMode) return;
    const config = getConfig();
    const rect = el.posterCanvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * config.width;
    const y = ((event.clientY - rect.top) / rect.height) * config.height;
    const hit = state.hitAreas.find((area) => x >= area.x && x <= area.x + area.w && y >= area.y && y <= area.y + area.h);
    if (hit) {
      selectProduct(hit.id);
    }
  });
}

function wireTabEvents() {
  setActiveTab(tabFromPath(window.location.pathname), { updateHistory: false });

  el.tabLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      setActiveTab(link.dataset.tabLink, { updateHistory: true });
    });
  });

  window.addEventListener("popstate", () => {
    setActiveTab(tabFromPath(window.location.pathname), { updateHistory: false });
  });
}

function setActiveTab(tab, { updateHistory } = { updateHistory: false }) {
  const nextTab = TABS[tab] ? tab : "products";
  state.activeTab = nextTab;

  el.tabLinks.forEach((link) => {
    const active = link.dataset.tabLink === nextTab;
    link.classList.toggle("is-active", active);
    if (active) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  el.tabPanels.forEach((panel) => {
    const active = panel.dataset.tabPanel === nextTab;
    panel.classList.toggle("is-active", active);
    panel.hidden = !active;
  });

  if (updateHistory && window.location.pathname !== TABS[nextTab]) {
    window.history.pushState({ tab: nextTab }, "", TABS[nextTab]);
  }

  if (nextTab === "poster-builder" && state.brand) {
    drawPoster();
  }
}

function tabFromPath(pathname) {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/poster-builder") return "poster-builder";
  if (normalized === "/templates") return "templates";
  return "products";
}

function wireCollapsibleSections() {
  const collapsedSections = readCollapsedSections();

  el.sectionToggles.forEach((toggle) => {
    const key = toggle.dataset.sectionToggle;
    const section = toggle.closest(".control-section");
    if (!key || !section) return;

    setSectionCollapsed(section, toggle, collapsedSections.includes(key));
    toggle.addEventListener("click", () => {
      const nextCollapsed = !section.classList.contains("is-collapsed");
      setSectionCollapsed(section, toggle, nextCollapsed);
      writeCollapsedSections();
    });
  });
}

function setSectionCollapsed(section, toggle, collapsed) {
  section.classList.toggle("is-collapsed", collapsed);
  toggle.setAttribute("aria-expanded", String(!collapsed));
}

function readCollapsedSections() {
  try {
    const value = JSON.parse(window.localStorage.getItem(SECTION_STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeCollapsedSections() {
  const collapsed = el.sectionToggles
    .filter((toggle) => toggle.closest(".control-section")?.classList.contains("is-collapsed"))
    .map((toggle) => toggle.dataset.sectionToggle)
    .filter(Boolean);
  window.localStorage.setItem(SECTION_STORAGE_KEY, JSON.stringify(collapsed));
}

function renderAll() {
  syncBrandInputs();
  syncTemplateSelector();
  syncTemplateInputs();
  syncDesignControls();
  syncProductInputs();
  syncBuilderProductInputs();
  renderProductList();
  renderImageState();
  renderHeaderMetrics();
  drawPoster();
  drawTemplatePreview();
}

function syncBrandInputs() {
  if (!state.brand) return;
  state.brand = normalizeBrand(state.brand);
  el.storeName.value = state.brand.storeName || "";
  el.localName.value = state.brand.localName || "";
  el.hypermarketLabel.value = state.brand.hypermarketLabel || "";
  el.headline.value = state.brand.headline || "";
  el.subheadline.value = state.brand.subheadline || "";
  el.phone.value = state.brand.phone || "";
  el.validUntil.value = state.brand.validUntil || "";
  el.deliveryText.value = state.brand.deliveryText || "";
  syncLogoInputs();
}

function syncLogoInputs() {
  if (!state.brand) return;
  const config = getConfig();
  const logoWidth = clamp(Number(state.brand.logoWidth || DEFAULT_LOGO_SETTINGS.logoWidth), 50, 420);
  const logoX = clamp(Number(state.brand.logoX ?? DEFAULT_LOGO_SETTINGS.logoX), 0, config.width);
  const logoY = clamp(Number(state.brand.logoY ?? DEFAULT_LOGO_SETTINGS.logoY), 0, config.height);
  state.brand.logoWidth = logoWidth;
  state.brand.logoX = logoX;
  state.brand.logoY = logoY;
  el.logoSize.max = "420";
  el.logoX.max = String(config.width);
  el.logoY.max = String(config.height);
  el.logoSize.value = String(logoWidth);
  el.logoX.value = String(logoX);
  el.logoY.value = String(logoY);
  el.logoSizeValue.textContent = `${logoWidth}px`;
  el.logoXValue.textContent = `${logoX}px`;
  el.logoYValue.textContent = `${logoY}px`;
  el.clearLogo.disabled = !state.brand.logoDataUrl;
}

function syncTemplateSelector() {
  syncTemplateSelectControl(el.productTemplateSelect);
  syncTemplateSelectControl(el.templateSelect);
  syncTemplateSelectControl(el.builderTemplateSelect);
}

function syncTemplateSelectControl(select) {
  select.innerHTML = "";
  state.templates.forEach((template) => {
    const option = document.createElement("option");
    option.value = template.id;
    option.textContent = template.name;
    option.selected = template.id === state.template?.id;
    select.appendChild(option);
  });
}

function syncTemplateInputs() {
  const config = getConfig();
  el.templateName.value = state.template?.name || "";
  el.columns.value = config.columns;
  el.rows.value = config.rows;
  el.gap.value = config.gridGap;
  el.badgeSize.value = config.badgeSize;
  el.builderPriceTag.value = config.priceTagMode;
  el.priceTag.value = config.priceTagMode;
  el.headerHeight.value = config.headerHeight;
  el.exportScale.value = config.exportScale;

  const activePreset = Object.entries(PRESETS).find(([, preset]) => preset.columns === config.columns && preset.rows === config.rows)?.[0];
  [...el.presetRow.querySelectorAll("button")].forEach((button) => {
    button.classList.toggle("is-active", button.dataset.preset === activePreset);
  });
  syncLogoInputs();
  syncDesignControls();
}

function syncDesignControls() {
  if (!el.designElement || !state.template) return;
  const config = getConfig();
  const elements = getDesignElements(config);

  if (el.designElement.options.length !== DESIGN_ELEMENT_ORDER.length) {
    el.designElement.innerHTML = "";
    elements.forEach((element) => {
      const option = document.createElement("option");
      option.value = element.id;
      option.textContent = element.label;
      el.designElement.appendChild(option);
    });
  }

  if (!DESIGN_ELEMENTS[state.selectedElementId]) {
    state.selectedElementId = DESIGN_ELEMENT_ORDER[0];
  }

  const selected = getDesignElement(state.selectedElementId, config);
  el.designMode.checked = state.designMode;
  el.designElement.value = selected.id;

  const enabled = state.designMode && Boolean(selected);
  [
    el.designElement,
    el.designX,
    el.designY,
    el.designWidth,
    el.designHeight,
    el.designVisible,
    el.designLocked,
    el.resetDesignElement
  ].forEach((control) => {
    control.disabled = !enabled;
  });

  el.designX.max = String(config.width);
  el.designY.max = String(config.height);
  el.designWidth.max = String(config.width);
  el.designHeight.max = String(config.height);
  el.designWidth.min = String(selected.minW);
  el.designHeight.min = String(selected.minH);
  el.designX.value = String(Math.round(selected.x));
  el.designY.value = String(Math.round(selected.y));
  el.designWidth.value = String(Math.round(selected.w));
  el.designHeight.value = String(Math.round(selected.h));
  el.designXValue.textContent = `${Math.round(selected.x)}px`;
  el.designYValue.textContent = `${Math.round(selected.y)}px`;
  el.designWidthValue.textContent = `${Math.round(selected.w)}px`;
  el.designHeightValue.textContent = `${Math.round(selected.h)}px`;
  el.designVisible.checked = selected.visible;
  el.designLocked.checked = selected.locked;
  el.posterCanvas.classList.toggle("is-design-mode", state.designMode);
}

function syncProductInputs() {
  const product = getActiveProduct();
  const hasProduct = Boolean(product);
  syncDemoImageControls();
  ["productName", "productUnit", "productCategory", "productImageStyle", "sellingPrice", "mrp", "imageUrl", "saveProduct", "sendToBuilder", "uploadImage", "uploadImageButton", "reuseImage", "regenerateImage"].forEach((key) => {
    el[key].disabled = !hasProduct;
  });

  if (!product) {
    el.productName.value = "";
    el.productUnit.value = "";
    el.productCategory.value = "";
    el.productImageStyle.value = "auto";
    el.sellingPrice.value = "";
    el.mrp.value = "";
    el.imageUrl.value = "";
    return;
  }

  el.productName.value = product.name || "";
  el.productUnit.value = product.unit || "";
  el.productCategory.value = product.category || "";
  el.productImageStyle.value = sanitizeImageStyle(product.imageStyle);
  el.sellingPrice.value = safePrice(product.sellingPrice);
  el.mrp.value = product.mrp ?? "";
  el.imageUrl.value = product.imageUrl || "";
}

function syncBuilderProductInputs() {
  const product = getActiveProduct();
  const hasProduct = Boolean(product);
  [
    "builderProductName",
    "builderProductUnit",
    "builderProductCategory",
    "builderImageStyle",
    "builderSellingPrice",
    "builderMrp",
    "builderImageUrl",
    "builderUploadImage",
    "builderUploadImageButton",
    "builderSaveProduct"
  ].forEach((key) => {
    el[key].disabled = !hasProduct;
  });

  el.builderProductThumb.innerHTML = "";
  if (!product) {
    el.builderProductThumb.appendChild(textNode("No product"));
    el.builderProductLabel.textContent = "No product selected";
    el.builderProductMeta.textContent = "Click a product in the poster or list.";
    el.builderProductName.value = "";
    el.builderProductUnit.value = "";
    el.builderProductCategory.value = "";
    el.builderImageStyle.value = "auto";
    el.builderSellingPrice.value = "";
    el.builderMrp.value = "";
    el.builderImageUrl.value = "";
    return;
  }

  updateBuilderProductSummary(product, { refreshThumb: true });
  el.builderProductName.value = product.name || "";
  el.builderProductUnit.value = product.unit || "";
  el.builderProductCategory.value = product.category || "";
  el.builderImageStyle.value = sanitizeImageStyle(product.imageStyle);
  el.builderSellingPrice.value = safePrice(product.sellingPrice);
  el.builderMrp.value = product.mrp ?? "";
  el.builderImageUrl.value = product.imageUrl || "";
}

function updateBuilderProductSummary(product, { refreshThumb } = { refreshThumb: false }) {
  if (!product) return;
  if (refreshThumb) {
    el.builderProductThumb.innerHTML = "";
    el.builderProductThumb.appendChild(makeThumbContent(product));
  }
  el.builderProductLabel.textContent = product.name || "Untitled Product";
  const styleLabel = imageStyleLabel(product.imageStyle);
  el.builderProductMeta.textContent = [product.unit, product.category, styleLabel].filter(Boolean).join(" / ") || "Poster item";
}

function syncDemoImageControls() {
  el.imageSize.value = DEMO_IMAGE_SIZE;
  el.imageQuality.value = DEMO_IMAGE_QUALITY;
  el.imageSize.disabled = true;
  el.imageQuality.disabled = true;
}

function renderProductList() {
  const products = filteredProducts(state.search);
  const posterProducts = filteredProducts(state.posterSearch);
  el.productList.innerHTML = "";
  el.posterProductList.innerHTML = "";

  products.forEach((product) => {
    el.productList.appendChild(makeProductRow(product, { selectable: false }));
  });

  posterProducts.forEach((product) => {
    el.posterProductList.appendChild(makeProductRow(product, { selectable: true }));
  });
}

function makeProductRow(product, { selectable }) {
  const row = document.createElement("div");
  row.className = [
    "product-row",
    selectable ? "" : "is-manager",
    product.id === state.activeProductId ? "is-active" : "",
    state.selectedIds.includes(product.id) ? "is-selected" : ""
  ]
    .filter(Boolean)
    .join(" ");
  row.tabIndex = 0;

  const thumb = document.createElement("div");
  thumb.className = "row-thumb";
  thumb.appendChild(makeThumbContent(product));

  const details = document.createElement("div");
  details.innerHTML = `
    <span class="row-name">${escapeHtml(product.name)}</span>
    <span class="row-meta">${escapeHtml([product.unit, product.category].filter(Boolean).join(" / "))}</span>
  `;

  const price = document.createElement("div");
  price.className = "row-price";
  price.textContent = formatRupee(product.sellingPrice);

  let checkbox = null;
  if (selectable) {
    checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = state.selectedIds.includes(product.id);
    checkbox.addEventListener("change", () => toggleProductSelection(product.id, checkbox.checked));
    row.append(checkbox, thumb, details, price);
  } else {
    row.append(thumb, details, price);
  }

  row.addEventListener("click", (event) => {
    if (event.target === checkbox) return;
    selectProduct(product.id);
  });
  row.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectProduct(product.id);
    }
  });

  return row;
}

function renderImageState() {
  const product = getActiveProduct();
  el.productThumb.innerHTML = "";

  if (!product) {
    el.imageState.textContent = "No product";
    el.imageState.className = "status-pill is-warn";
    el.productThumb.appendChild(textNode("No product"));
    return;
  }

  el.productThumb.appendChild(makeThumbContent(product));
  if (product.imageUrl) {
    const reusable = Boolean(state.health?.reusableImages);
    el.imageState.textContent = reusable ? "Reusable" : "Demo only";
    el.imageState.className = reusable ? "status-pill is-ready" : "status-pill is-warn";
  } else {
    el.imageState.textContent = "Fallback";
    el.imageState.className = "status-pill is-warn";
  }
}

function renderHeaderMetrics() {
  const config = getConfig();
  const title = `${state.brand?.storeName || "Store"} ${state.brand?.headline || "Offers"} ${state.brand?.subheadline || ""}`.trim();
  if (el.posterTitle) {
    el.posterTitle.textContent = title;
  }
  if (el.selectionCount) {
    el.selectionCount.textContent = `${state.selectedIds.length} selected`;
  }
  if (el.productMetric) {
    el.productMetric.textContent = String(state.products.length);
  }
  if (el.templateMetric) {
    el.templateMetric.textContent = `${config.columns}x${config.rows}`;
  }
  if (el.openRouterMetric) {
    el.openRouterMetric.textContent = state.health?.openRouterConfigured ? "On" : "Off";
  }

  if (state.health) {
    const mode = state.health.database === "supabase" ? "Supabase" : "Local";
    setHealthBadge(mode, state.health.openRouterConfigured ? "ready" : "warn");
  }
}

function makeThumbContent(product) {
  if (product.imageUrl) {
    const img = document.createElement("img");
    img.alt = product.name || "Product";
    img.src = product.imageUrl;
    img.onerror = () => {
      img.replaceWith(textNode(initials(product.name)));
    };
    return img;
  }
  return textNode(initials(product.name));
}

function textNode(value) {
  const span = document.createElement("span");
  span.textContent = value;
  return span;
}

async function saveBrand() {
  disableControls([el.saveBrand], true);
  try {
    const response = await apiPut("/api/brand", state.brand);
    state.brand = normalizeBrand(response.brand);
    preloadLogoImage();
    syncBrandInputs();
    drawCanvases();
    toast("Store saved");
  } catch (error) {
    toast(error.message || "Store save failed");
  } finally {
    disableControls([el.saveBrand], false);
  }
}

async function uploadLogoImage() {
  const file = el.logoImage.files?.[0];
  el.logoImage.value = "";
  if (!file) return;

  const uploadError = validateProductImageFile(file);
  if (uploadError) {
    toast(uploadError);
    return;
  }

  const formData = new FormData();
  formData.append("logo", file);

  disableControls([el.logoImage, el.clearLogo, el.saveBrand], true);
  try {
    const response = await api("/api/brand/upload-logo", {
      method: "POST",
      body: formData
    });
    state.brand = normalizeBrand(response.brand);
    preloadLogoImage();
    syncLogoInputs();
    drawCanvases();
    toast("Logo uploaded");
  } catch (error) {
    toast(error.message || "Logo upload failed");
    console.error(error);
  } finally {
    disableControls([el.logoImage, el.clearLogo, el.saveBrand], false);
    syncLogoInputs();
  }
}

async function clearLogoImage() {
  if (!state.brand) return;
  state.brand.logoDataUrl = "";
  logoImage = null;
  logoImageSource = "";
  syncLogoInputs();
  drawCanvases();

  disableControls([el.clearLogo, el.logoImage, el.saveBrand], true);
  try {
    const response = await apiPut("/api/brand", state.brand);
    state.brand = normalizeBrand(response.brand);
    toast("Logo cleared");
  } catch (error) {
    toast(error.message || "Logo clear failed");
  } finally {
    disableControls([el.logoImage, el.saveBrand], false);
    syncLogoInputs();
  }
}

async function saveTemplate() {
  if (!state.template) return;
  state.template.name = cleanTemplateName(el.templateName.value, state.template.name || "Custom Template");
  disableControls([el.saveTemplate], true);
  try {
    const response = await apiPut(`/api/templates/${encodeURIComponent(state.template.id)}`, state.template);
    replaceTemplate(response.template);
    state.template = response.template;
    syncTemplateSelector();
    syncTemplateInputs();
    toast("Template saved");
  } catch (error) {
    toast(error.message || "Template save failed");
  } finally {
    disableControls([el.saveTemplate], false);
  }
}

async function createTemplate() {
  const config = getConfig();
  const name = uniqueTemplateName(makeGeneratedTemplateName(config));
  disableControls([el.newTemplate, el.saveTemplate], true);

  try {
    const response = await apiPost("/api/templates", {
      name,
      type: state.template?.type || "grocery-grid",
      config: structuredClone(config)
    });
    replaceTemplate(response.template);
    state.template = response.template;
    trimSelectionToTemplate();
    renderAll();
    toast("New template created");
  } catch (error) {
    toast(error.message || "Template create failed");
  } finally {
    disableControls([el.newTemplate, el.saveTemplate], false);
  }
}

async function addProduct() {
  disableControls([el.addProduct], true);
  try {
    const response = await apiPost("/api/products", {
      name: "New Product",
      unit: "1 KG",
      category: "Grocery",
      imageStyle: "auto",
      sellingPrice: 0
    });
    state.products.push(response.product);
    selectProduct(response.product.id);
    toast("Product added");
  } catch (error) {
    toast(error.message || "Product add failed");
  } finally {
    disableControls([el.addProduct], false);
  }
}

async function saveActiveProduct() {
  const product = getActiveProduct();
  if (!product) return;

  disableControls([el.saveProduct, el.builderSaveProduct], true);
  try {
    const response = await apiPut(`/api/products/${encodeURIComponent(product.id)}`, product);
    replaceProduct(response.product);
    syncProductInputs();
    syncBuilderProductInputs();
    renderProductList();
    renderImageState();
    preloadVisibleImages();
    drawCanvases();
    toast("Product saved");
  } catch (error) {
    toast(error.message || "Product save failed");
  } finally {
    const hasProduct = Boolean(getActiveProduct());
    disableControls([el.saveProduct, el.builderSaveProduct], !hasProduct);
  }
}

async function uploadProductImage(source = "product") {
  const product = getActiveProduct();
  const fileInput = source === "builder" ? el.builderUploadImage : el.uploadImage;
  const statusTarget = source === "builder" ? el.builderContentStatus : el.aiStatus;
  const uploadButton = source === "builder" ? el.builderUploadImageButton : el.uploadImageButton;
  const saveButton = source === "builder" ? el.builderSaveProduct : el.saveProduct;
  const file = fileInput.files?.[0];
  if (!product || !file) return;

  const uploadError = validateProductImageFile(file);
  if (uploadError) {
    statusTarget.textContent = uploadError;
    toast(uploadError);
    fileInput.value = "";
    return;
  }

  const formData = new FormData();
  formData.append("image", file);

  disableControls([fileInput, uploadButton, saveButton, el.uploadImage, el.uploadImageButton, el.reuseImage, el.regenerateImage], true);
  statusTarget.textContent = "Uploading image...";

  try {
    const response = await api(`/api/products/${encodeURIComponent(product.id)}/upload-image`, {
      method: "POST",
      body: formData
    });

    replaceProduct(response.product);
    state.activeProductId = response.product.id;
    imageCache.delete(response.product.id);
    preloadVisibleImages();
    syncProductInputs();
    syncBuilderProductInputs();
    renderProductList();
    renderImageState();
    drawCanvases();
    statusTarget.textContent = "Uploaded image saved.";
    toast("Image uploaded");
  } catch (error) {
    statusTarget.textContent = error.message || "Image upload failed.";
    toast(error.message || "Image upload failed");
  } finally {
    fileInput.value = "";
    const hasProduct = Boolean(getActiveProduct());
    disableControls([el.uploadImage, el.uploadImageButton, el.reuseImage, el.regenerateImage], !hasProduct);
    disableControls([el.builderUploadImage, el.builderUploadImageButton, el.builderSaveProduct], !hasProduct);
  }
}

async function generateImage(regenerate) {
  const product = getActiveProduct();
  if (!product) return;

  disableControls([el.uploadImage, el.uploadImageButton, el.reuseImage, el.regenerateImage], true);
  el.aiStatus.textContent = regenerate ? "Generating replacement image..." : "Checking reusable image...";

  try {
    const response = await apiPost(`/api/products/${encodeURIComponent(product.id)}/generate-image`, {
      regenerate,
      size: DEMO_IMAGE_SIZE,
      quality: DEMO_IMAGE_QUALITY,
      outputFormat: "png",
      background: "transparent"
    });

    replaceProduct(response.product);
    state.activeProductId = response.product.id;
    imageCache.delete(response.product.id);
    preloadVisibleImages();
    syncProductInputs();
    syncBuilderProductInputs();
    renderProductList();
    renderImageState();
    drawCanvases();
    el.aiStatus.textContent = response.reused ? "Existing image reused." : "New image saved.";
    toast(response.reused ? "Image reused" : "Image generated");
  } catch (error) {
    el.aiStatus.textContent = error.message || "Image generation failed.";
    toast(error.message || "Image generation failed");
  } finally {
    const hasProduct = Boolean(getActiveProduct());
    disableControls([el.uploadImage, el.uploadImageButton, el.reuseImage, el.regenerateImage], !hasProduct);
    syncDemoImageControls();
  }
}

async function exportPoster() {
  const config = getConfig();
  const scale = clamp(Number(config.exportScale || 2), 1, 4);
  const exportCanvas = document.createElement("canvas");
  drawPoster(exportCanvas, scale);

  try {
    const dataUrl = exportCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `${slug(state.brand?.storeName || "store")}-grocery-deals.png`;
    link.href = dataUrl;
    link.click();

    await apiPost("/api/posters/export-log", {
      templateId: state.template?.id,
      title: el.posterTitle.textContent,
      selectedProductIds: state.selectedIds,
      config
    });
    toast("PNG exported");
  } catch (error) {
    toast("Export failed. Check image CORS or missing files.");
    console.error(error);
  }
}

function updateActiveProductFromInputs() {
  const product = getActiveProduct();
  if (!product) return;

  product.name = el.productName.value;
  product.unit = el.productUnit.value;
  product.category = el.productCategory.value;
  product.imageStyle = sanitizeImageStyle(el.productImageStyle.value);
  product.sellingPrice = Number(el.sellingPrice.value || 0);
  product.mrp = el.mrp.value === "" ? null : Number(el.mrp.value || 0);
  product.imageUrl = el.imageUrl.value.trim();
}

function updateActiveProductFromBuilderInputs() {
  const product = getActiveProduct();
  if (!product) return;

  product.name = el.builderProductName.value;
  product.unit = el.builderProductUnit.value;
  product.category = el.builderProductCategory.value;
  product.imageStyle = sanitizeImageStyle(el.builderImageStyle.value);
  product.sellingPrice = Number(el.builderSellingPrice.value || 0);
  product.mrp = el.builderMrp.value === "" ? null : Number(el.builderMrp.value || 0);
  product.imageUrl = el.builderImageUrl.value.trim();
}

function applyPreset(count) {
  const preset = PRESETS[count] || PRESETS[35];
  const config = getConfig();
  config.columns = preset.columns;
  config.rows = preset.rows;
  config.maxProducts = count;
  state.selectedIds = state.products.slice(0, count).map((product) => product.id);
  state.activeProductId = state.selectedIds[0] || state.products[0]?.id || null;
  syncTemplateInputs();
  preloadVisibleImages();
  renderAll();
}

function updateTemplateConfig(key, value) {
  const config = getConfig();
  config[key] = value;
  if (key === "columns" || key === "rows") {
    config.maxProducts = clamp(Number(config.columns) * Number(config.rows), 1, 100);
    trimSelectionToTemplate();
  }
  syncTemplateInputs();
  preloadVisibleImages();
  renderProductList();
  renderHeaderMetrics();
  drawCanvases();
}

function activateTemplate(templateId) {
  state.template = state.templates.find((template) => template.id === templateId) || state.templates[0] || makeFallbackTemplate();
  trimSelectionToTemplate();
  preloadVisibleImages();
  renderAll();
}

function trimSelectionToTemplate() {
  const config = getConfig();
  const maxProducts = Number(config.maxProducts || config.columns * config.rows);
  state.selectedIds = state.selectedIds.slice(0, maxProducts);
  if (!state.activeProductId && state.selectedIds[0]) {
    state.activeProductId = state.selectedIds[0];
  }
}

function selectAllProducts() {
  const config = getConfig();
  const maxProducts = Number(config.maxProducts || config.columns * config.rows);
  state.selectedIds = state.products.slice(0, maxProducts).map((product) => product.id);
  state.activeProductId = state.selectedIds[0] || state.activeProductId;
  preloadVisibleImages();
  renderAll();
  if (state.products.length > maxProducts) {
    toast(`Selected ${maxProducts} products for this layout`);
  }
}

function sendActiveProductToBuilder() {
  const product = getActiveProduct();
  if (!product) {
    toast("Select a product first");
    return;
  }

  if (el.productTemplateSelect.value) {
    state.template = state.templates.find((template) => template.id === el.productTemplateSelect.value) || state.template;
  }

  const config = getConfig();
  const maxProducts = Number(config.maxProducts || config.columns * config.rows);
  if (!state.selectedIds.includes(product.id)) {
    state.selectedIds = state.selectedIds.length >= maxProducts
      ? [...state.selectedIds.slice(0, maxProducts - 1), product.id]
      : [...state.selectedIds, product.id];
  }

  state.activeProductId = product.id;
  syncTemplateSelector();
  trimSelectionToTemplate();
  preloadVisibleImages();
  renderAll();
  setActiveTab("poster-builder", { updateHistory: true });
  toast(`${product.name || "Product"} sent to Poster Builder`);
}

function toggleProductSelection(id, checked) {
  const config = getConfig();
  const maxProducts = Number(config.maxProducts || config.columns * config.rows);

  if (checked) {
    if (!state.selectedIds.includes(id)) {
      state.selectedIds = state.selectedIds.length >= maxProducts
        ? [...state.selectedIds.slice(0, maxProducts - 1), id]
        : [...state.selectedIds, id];
    }
    state.activeProductId = id;
  } else {
    state.selectedIds = state.selectedIds.filter((productId) => productId !== id);
  }

  preloadVisibleImages();
  renderAll();
}

function selectProduct(id) {
  state.activeProductId = id;
  syncProductInputs();
  syncBuilderProductInputs();
  renderProductList();
  renderImageState();
  drawCanvases();
}

function replaceProduct(nextProduct) {
  const index = state.products.findIndex((product) => product.id === nextProduct.id);
  if (index === -1) {
    state.products.push(nextProduct);
  } else {
    state.products[index] = nextProduct;
  }
}

function replaceTemplate(nextTemplate) {
  const index = state.templates.findIndex((template) => template.id === nextTemplate.id);
  if (index === -1) {
    state.templates.unshift(nextTemplate);
  } else {
    state.templates[index] = nextTemplate;
  }
}

function defaultDesignElement(id, config) {
  const headerHeight = config.headerHeight;
  const gridY = headerHeight + 4;
  const defaults = {
    localName: { x: 24, y: 54, w: 300, h: 30 },
    storeName: { x: 340, y: 58, w: 340, h: 38 },
    hypermarket: { x: 420, y: 96, w: 200, h: 14 },
    headline: { x: 34, y: 176, w: 560, h: 88 },
    subheadline: { x: 36, y: 284, w: 520, h: 84 },
    basket: { x: config.width * 0.58, y: Math.max(150, headerHeight * 0.42), w: 200, h: 160 },
    delivery: { x: config.width - 184, y: 18, w: 184, h: 246 },
    contactStrip: { x: 24, y: Math.max(154, headerHeight - 75), w: config.width - 48, h: 58 },
    productGrid: { x: 8, y: gridY, w: config.width - 16, h: config.height - gridY - 8 },
    logo: {
      x: Number(state.brand?.logoX ?? DEFAULT_LOGO_SETTINGS.logoX),
      y: Number(state.brand?.logoY ?? DEFAULT_LOGO_SETTINGS.logoY),
      w: Number(state.brand?.logoWidth ?? DEFAULT_LOGO_SETTINGS.logoWidth),
      h: logoImage ? Number(state.brand?.logoWidth ?? DEFAULT_LOGO_SETTINGS.logoWidth) * (logoImage.height / logoImage.width) : 90
    }
  };
  return defaults[id] || { x: 0, y: 0, w: 100, h: 60 };
}

function getDesignElement(id, config = getConfig()) {
  const meta = DESIGN_ELEMENTS[id] || DESIGN_ELEMENTS.headline;
  const base = defaultDesignElement(id, config);
  const saved = config.layoutElements?.[id] || {};
  return normalizeDesignElement({
    id,
    label: meta.label,
    kind: meta.kind,
    minW: meta.minW,
    minH: meta.minH,
    visible: true,
    locked: false,
    ...base,
    ...saved
  }, config);
}

function getDesignElements(config = getConfig()) {
  return DESIGN_ELEMENT_ORDER.map((id) => getDesignElement(id, config));
}

function normalizeDesignElement(element, config) {
  const minW = Number(element.minW || 40);
  const minH = Number(element.minH || 24);
  const width = clamp(Number(element.w), minW, config.width);
  const height = clamp(Number(element.h), minH, config.height);
  return {
    ...element,
    minW,
    minH,
    x: clamp(Number(element.x), -width, config.width),
    y: clamp(Number(element.y), -height, config.height),
    w: width,
    h: height,
    visible: element.visible !== false,
    locked: element.locked === true
  };
}

function designElementArea(element) {
  if (element.kind === "text") {
    return {
      x: element.x,
      y: element.y - element.h,
      w: element.w,
      h: element.h + 8
    };
  }
  return {
    x: element.x,
    y: element.y,
    w: element.w,
    h: element.h
  };
}

function updateDesignElement(id, patch) {
  if (!id || !state.template) return;
  const config = getConfig();
  const current = getDesignElement(id, config);
  const next = normalizeDesignElement({ ...current, ...patch }, config);
  config.layoutElements = {
    ...(config.layoutElements || {}),
    [id]: {
      x: Math.round(next.x),
      y: Math.round(next.y),
      w: Math.round(next.w),
      h: Math.round(next.h),
      visible: next.visible,
      locked: next.locked
    }
  };
  state.template.config = config;

  if (id === "logo") {
    state.brand.logoX = Math.round(next.x);
    state.brand.logoY = Math.round(next.y);
    state.brand.logoWidth = Math.round(next.w);
    syncLogoInputs();
  }

  state.selectedElementId = id;
  syncDesignControls();
  drawCanvases();
}

function resetDesignElement(id) {
  if (!id || !state.template) return;
  const config = getConfig();
  if (config.layoutElements?.[id]) {
    delete config.layoutElements[id];
  }
  state.template.config = config;
  syncDesignControls();
  drawCanvases();
}

function canvasPoint(event) {
  const config = getConfig();
  const rect = el.posterCanvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * config.width,
    y: ((event.clientY - rect.top) / rect.height) * config.height
  };
}

function findDesignTarget(point, config = getConfig()) {
  const elements = getDesignElements(config).filter((element) => element.visible || element.id === state.selectedElementId);
  for (const element of elements.slice().reverse()) {
    const area = designElementArea(element);
    const handleSize = 18;
    const inHandle =
      point.x >= area.x + area.w - handleSize &&
      point.x <= area.x + area.w + handleSize &&
      point.y >= area.y + area.h - handleSize &&
      point.y <= area.y + area.h + handleSize;
    if (inHandle) {
      return { element, mode: "resize" };
    }

    if (point.x >= area.x && point.x <= area.x + area.w && point.y >= area.y && point.y <= area.y + area.h) {
      return { element, mode: "move" };
    }
  }
  return null;
}

function handleDesignPointerDown(event) {
  if (!state.designMode) return;
  event.preventDefault();
  const config = getConfig();
  const point = canvasPoint(event);
  const target = findDesignTarget(point, config);
  if (!target) {
    state.designDrag = null;
    drawPoster();
    return;
  }

  state.selectedElementId = target.element.id;
  syncDesignControls();
  drawPoster();

  if (target.element.locked) {
    toast(`${target.element.label} is locked`);
    return;
  }

  state.designDrag = {
    id: target.element.id,
    mode: target.mode,
    startX: point.x,
    startY: point.y,
    startRect: { x: target.element.x, y: target.element.y, w: target.element.w, h: target.element.h }
  };
  el.posterCanvas.setPointerCapture?.(event.pointerId);
}

function handleDesignPointerMove(event) {
  if (!state.designMode || !state.designDrag) return;
  const point = canvasPoint(event);
  const drag = state.designDrag;
  const dx = point.x - drag.startX;
  const dy = point.y - drag.startY;

  if (drag.mode === "resize") {
    updateDesignElement(drag.id, {
      w: drag.startRect.w + dx,
      h: drag.startRect.h + dy
    });
    return;
  }

  updateDesignElement(drag.id, {
    x: drag.startRect.x + dx,
    y: drag.startRect.y + dy
  });
}

function handleDesignPointerUp() {
  state.designDrag = null;
}

function handleDesignKeyDown(event) {
  if (!state.designMode || !state.selectedElementId) return;
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;

  const element = getDesignElement(state.selectedElementId);
  if (element.locked) return;

  event.preventDefault();
  const step = event.shiftKey ? 10 : 1;
  const patch = {};
  if (event.key === "ArrowLeft") patch.x = element.x - step;
  if (event.key === "ArrowRight") patch.x = element.x + step;
  if (event.key === "ArrowUp") patch.y = element.y - step;
  if (event.key === "ArrowDown") patch.y = element.y + step;
  updateDesignElement(element.id, patch);
}

function makeGeneratedTemplateName(config) {
  const brand = (state.brand?.storeName || "Store").trim();
  return `${brand} ${config.columns}x${config.rows} Template`;
}

function uniqueTemplateName(name) {
  const baseName = cleanTemplateName(name, "Custom Template");
  const existingNames = new Set(state.templates.map((template) => (template.name || "").toLowerCase()));
  if (!existingNames.has(baseName.toLowerCase())) {
    return baseName;
  }

  let suffix = 2;
  while (existingNames.has(`${baseName} ${suffix}`.toLowerCase())) {
    suffix += 1;
  }
  return `${baseName} ${suffix}`;
}

function cleanTemplateName(value, fallback) {
  const name = String(value || "").trim().replace(/\s+/g, " ");
  return name || fallback;
}

function preloadVisibleImages() {
  selectedProducts().forEach((product) => {
    if (!product.imageUrl || imageCache.has(product.id) || imageLoading.has(product.id)) return;

    imageLoading.add(product.id);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageCache.set(product.id, img);
      imageLoading.delete(product.id);
      drawCanvases();
    };
    img.onerror = () => {
      imageLoading.delete(product.id);
      drawCanvases();
    };
    img.src = product.imageUrl;
  });
}

function preloadLogoImage() {
  const source = state.brand?.logoDataUrl || "";
  if (!source) {
    logoImage = null;
    logoImageSource = "";
    return;
  }

  if (logoImage && logoImageSource === source) {
    return;
  }

  logoImage = null;
  logoImageSource = source;
  const img = new Image();
  img.onload = () => {
    if (logoImageSource !== source) return;
    logoImage = img;
    drawCanvases();
  };
  img.onerror = () => {
    if (logoImageSource !== source) return;
    logoImage = null;
    drawCanvases();
  };
  img.src = source;
}

function drawCanvases() {
  drawPoster();
  drawTemplatePreview();
}

function drawTemplatePreview() {
  if (!el.templatePreviewCanvas) return;
  drawPoster(el.templatePreviewCanvas);
  const config = getConfig();
  el.templatePreviewTitle.textContent = state.template?.name || "Template Preview";
  el.templatePreviewMetric.textContent = `${config.columns}x${config.rows}`;
}

function drawPoster(targetCanvas = el.posterCanvas, scale = 1) {
  const config = getConfig();
  const canvas = targetCanvas;
  canvas.width = config.width * scale;
  canvas.height = config.height * scale;
  const ctx = canvas.getContext("2d");
  ctx.save();
  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  drawBackground(ctx, config);
  drawHeader(ctx, config);
  drawContactStrip(ctx, config);
  drawProducts(ctx, config, canvas === el.posterCanvas);
  drawLogo(ctx, config);
  if (canvas === el.posterCanvas && state.designMode) {
    drawDesignOverlay(ctx, config);
  }
  ctx.restore();
}

function drawBackground(ctx, config) {
  ctx.fillStyle = config.styles.background || "#ffffff";
  ctx.fillRect(0, 0, config.width, config.height);
}

function drawHeader(ctx, config) {
  const headerHeight = config.headerHeight;
  const styles = config.styles;
  const gradient = ctx.createLinearGradient(0, 0, config.width, headerHeight);
  gradient.addColorStop(0, styles.headerA || "#ffbf26");
  gradient.addColorStop(0.58, styles.headerC || "#ffd447");
  gradient.addColorStop(1, styles.headerB || "#f47a22");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, config.width, headerHeight);

  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = "#fffdf2";
  for (let i = -2; i < 11; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * 130, 0);
    ctx.lineTo(i * 130 + 90, 0);
    ctx.lineTo(i * 130 - 30, headerHeight);
    ctx.lineTo(i * 130 - 116, headerHeight);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  const localName = getDesignElement("localName", config);
  const storeName = getDesignElement("storeName", config);
  const hypermarket = getDesignElement("hypermarket", config);
  const headline = getDesignElement("headline", config);
  const subheadline = getDesignElement("subheadline", config);
  const basket = getDesignElement("basket", config);
  const delivery = getDesignElement("delivery", config);

  ctx.fillStyle = "#e31318";
  if (localName.visible) {
    fittedText(ctx, state.brand?.localName || "", localName.x, localName.y, localName.w, localName.h, 18, "900", '"Segoe UI", Arial, sans-serif');
  }
  if (storeName.visible) {
    fittedText(ctx, state.brand?.storeName || "GrandPlus", storeName.x, storeName.y, storeName.w, storeName.h, 24, "950", "Arial, sans-serif");
  }
  ctx.fillStyle = "#9e2a2a";
  if (hypermarket.visible) {
    spreadText(ctx, state.brand?.hypermarketLabel || "HYPERMARKET", hypermarket.x, hypermarket.y, hypermarket.w, hypermarket.h);
  }

  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgb(0 0 0 / 0.17)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  if (headline.visible) {
    fittedText(ctx, String(state.brand?.headline || "GROCERY").toUpperCase(), headline.x, headline.y, headline.w, headline.h, 46, "950", "Arial Black, Arial, sans-serif");
  }
  if (subheadline.visible) {
    fittedText(ctx, String(state.brand?.subheadline || "DEALS").toUpperCase(), subheadline.x, subheadline.y, subheadline.w, subheadline.h, 44, "950", "Arial Black, Arial, sans-serif");
  }
  ctx.shadowColor = "transparent";

  if (basket.visible) {
    drawScaledGraphic(ctx, basket, 200, 160, () => drawBasket(ctx, 0, 0));
  }
  if (delivery.visible) {
    drawScaledGraphic(ctx, delivery, 184, 246, () => drawDelivery(ctx, 0, 0, styles));
  }
}

function drawBasket(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "#6f7178";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(28, 44);
  ctx.lineTo(174, 22);
  ctx.lineTo(148, 140);
  ctx.lineTo(48, 140);
  ctx.closePath();
  ctx.stroke();

  ctx.lineWidth = 1.3;
  for (let i = 0; i < 8; i += 1) {
    ctx.beginPath();
    ctx.moveTo(42 + i * 16, 43 - i * 1.8);
    ctx.lineTo(54 + i * 11, 138);
    ctx.stroke();
  }
  for (let i = 0; i < 6; i += 1) {
    ctx.beginPath();
    ctx.moveTo(39, 62 + i * 14);
    ctx.lineTo(160, 43 + i * 14);
    ctx.stroke();
  }

  drawProduceBlob(ctx, 58, 56, 24, 20, "#3aa547");
  drawProduceBlob(ctx, 88, 38, 22, 24, "#e2472f");
  drawProduceBlob(ctx, 118, 45, 26, 18, "#ffd33d");
  drawProduceBlob(ctx, 141, 70, 21, 28, "#77b54c");
  drawProduceBlob(ctx, 78, 88, 50, 17, "#ffe071");
  drawProduceBlob(ctx, 112, 92, 24, 24, "#7d3bb3");
  drawProduceBlob(ctx, 54, 112, 28, 22, "#d72b34");
  drawProduceBlob(ctx, 144, 108, 24, 18, "#f35b2c");
  ctx.restore();
}

function drawProduceBlob(ctx, x, y, w, h, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, w, h, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgb(255 255 255 / 0.22)";
  ctx.beginPath();
  ctx.ellipse(x - w * 0.25, y - h * 0.25, w * 0.24, h * 0.18, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawScaledGraphic(ctx, rect, baseWidth, baseHeight, draw) {
  ctx.save();
  ctx.translate(rect.x, rect.y);
  ctx.scale(rect.w / baseWidth, rect.h / baseHeight);
  draw();
  ctx.restore();
}

function drawDelivery(ctx, x, y, styles) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = styles.strip || "#16843a";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(183, -18);
  ctx.lineTo(183, 234);
  ctx.lineTo(40, 246);
  ctx.closePath();
  ctx.fill();

  ctx.save();
  ctx.rotate(-0.12);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#d5111c";
  ctx.lineWidth = 4;
  ctx.font = "950 54px Arial Black, Arial, sans-serif";
  ctx.strokeText("FREE", 20, 58);
  ctx.fillText("FREE", 20, 58);
  ctx.font = "950 30px Arial Black, Arial, sans-serif";
  ctx.strokeText("DELIVERY", 20, 96);
  ctx.fillText("DELIVERY", 20, 96);
  ctx.restore();

  ctx.fillStyle = "#bde7de";
  roundedRect(ctx, 18, 146, 78, 54, 18);
  ctx.fill();
  ctx.fillStyle = "#6bb4aa";
  roundedRect(ctx, 24, 126, 56, 40, 16);
  ctx.fill();
  ctx.strokeStyle = "#174e4b";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(74, 126);
  ctx.lineTo(118, 110);
  ctx.moveTo(33, 128);
  ctx.lineTo(5, 106);
  ctx.stroke();
  ctx.fillStyle = "#25313d";
  ctx.beginPath();
  ctx.arc(24, 204, 13, 0, Math.PI * 2);
  ctx.arc(92, 204, 13, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f2c28d";
  ctx.beginPath();
  ctx.arc(132, 112, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3a77d6";
  roundedRect(ctx, 114, 132, 42, 76, 18);
  ctx.fill();
  ctx.fillStyle = "#e8bb74";
  roundedRect(ctx, 98, 145, 58, 38, 4);
  ctx.fill();
  ctx.restore();
}

function drawLogo(ctx, config) {
  if (!logoImage || !state.brand?.logoDataUrl) return;

  const logo = getDesignElement("logo", config);
  if (!logo.visible) return;

  ctx.save();
  ctx.shadowColor = "rgb(0 0 0 / 0.14)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  drawImageContain(ctx, logoImage, logo.x, logo.y, logo.w, logo.h);
  ctx.restore();
}

function drawDesignOverlay(ctx, config) {
  state.designAreas = getDesignElements(config).map((element) => ({
    ...designElementArea(element),
    id: element.id,
    label: element.label,
    visible: element.visible,
    locked: element.locked
  }));

  ctx.save();
  ctx.textBaseline = "alphabetic";
  state.designAreas.forEach((area) => {
    const selected = area.id === state.selectedElementId;
    if (!area.visible && !selected) return;

    ctx.setLineDash(selected ? [] : [7, 6]);
    ctx.lineWidth = selected ? 3 : 1.5;
    ctx.strokeStyle = selected ? "#0b7cff" : "rgb(11 124 255 / 0.55)";
    ctx.strokeRect(area.x, area.y, area.w, area.h);

    if (selected) {
      ctx.setLineDash([]);
      ctx.fillStyle = "#0b7cff";
      ctx.fillRect(area.x + area.w - 9, area.y + area.h - 9, 18, 18);
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 13px Arial, sans-serif";
      ctx.textAlign = "left";
      ctx.fillStyle = "rgb(11 124 255 / 0.96)";
      roundedRect(ctx, area.x, Math.max(0, area.y - 24), Math.min(180, Math.max(76, area.label.length * 8 + 20)), 20, 5);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`${area.label}${area.locked ? " locked" : ""}`, area.x + 8, Math.max(15, area.y - 9));
    }
  });
  ctx.restore();
}

function drawContactStrip(ctx, config) {
  const styles = config.styles;
  const contactStrip = getDesignElement("contactStrip", config);
  if (!contactStrip.visible) return;
  const { x, y, w, h } = contactStrip;

  ctx.save();
  ctx.fillStyle = styles.strip || "#16843a";
  roundedRect(ctx, x, y, w, h, Math.min(30, h / 2));
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x + Math.min(34, h * 0.62), y + h / 2, Math.min(23, h * 0.4), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = styles.strip || "#16843a";
  ctx.font = `900 ${Math.max(12, Math.min(24, h * 0.42))}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("TEL", x + Math.min(34, h * 0.62), y + h / 2 + 1);

  ctx.fillStyle = "#ffffff";
  fittedText(ctx, state.brand?.phone || "", x + Math.min(70, h * 1.25), y + h * 0.71, w * 0.39, Math.min(34, h * 0.58), 14, "950", "Arial, sans-serif");
  ctx.textAlign = "right";
  fittedText(ctx, `VALID : ${state.brand?.validUntil || ""}`, x + w - 14, y + h * 0.69, w * 0.37, Math.min(28, h * 0.5), 12, "950", "Arial, sans-serif", "right");
  ctx.restore();
}

function drawProducts(ctx, config, interactive = false) {
  state.hitAreas = [];
  const products = selectedProducts().slice(0, config.maxProducts);
  const rows = Math.max(1, Number(config.rows));
  const columns = Math.max(1, Number(config.columns));
  const gap = Number(config.gridGap || 0);
  const grid = getGridRegion(config);
  if (grid.w <= 0 || grid.h <= 0) return;
  const cellW = (grid.w - gap * (columns - 1)) / columns;
  const cellH = (grid.h - gap * (rows - 1)) / rows;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(grid.x, grid.y, grid.w, grid.h);

  products.forEach((product, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    if (row >= rows) return;

    const x = grid.x + col * (cellW + gap);
    const y = grid.y + row * (cellH + gap);
    const selected = product.id === state.activeProductId;

    ctx.fillStyle = row % 2 === 0 ? "#fffdf4" : "#fbfff3";
    ctx.fillRect(x, y, cellW, cellH);
    ctx.strokeStyle = "#f0cf6d";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, cellW, cellH);

    drawProductVisual(ctx, product, x, y, cellW, cellH, config);
    drawPriceBadge(ctx, product, x + Math.max(8, cellW * 0.12), y + 9, Math.min(config.badgeSize, cellW - 14), Math.min(78, cellH * 0.42), config.styles.badge, config.priceTagMode);
    drawProductNameBar(ctx, product, x, y, cellW, cellH, config);

    if (selected && interactive && !state.designMode) {
      ctx.strokeStyle = "#1b4d8f";
      ctx.lineWidth = 4;
      ctx.strokeRect(x + 3, y + 3, cellW - 6, cellH - 6);
    }

    state.hitAreas.push({ id: product.id, x, y, w: cellW, h: cellH });
  });
}

function drawProductVisual(ctx, product, x, y, w, h, config) {
  const img = imageCache.get(product.id);
  const box = {
    x: x + Math.max(6, w * 0.06),
    y: y + Math.min(72, Math.max(50, h * 0.25)),
    w: w - Math.max(12, w * 0.12),
    h: h - Math.min(110, Math.max(82, h * 0.47))
  };

  if (img) {
    drawImageContain(ctx, img, box.x, box.y, box.w, box.h);
    return;
  }

  drawFallbackProduce(ctx, product, x, y, w, h, config);
}

function drawFallbackProduce(ctx, product, x, y, w, h) {
  const palette = producePalette(product.name);
  const name = String(product.name || "").toLowerCase();
  const centerX = x + w / 2;
  const centerY = y + h * 0.58;
  const longShape = /(gourd|beans|chilli|banana|stem)/.test(name);
  const cluster = /(potato|garlic|mushroom|tomato|lemon|kiwi|mosambi|citrus)/.test(name);

  ctx.save();
  ctx.fillStyle = "rgb(0 0 0 / 0.08)";
  ctx.beginPath();
  ctx.ellipse(centerX, y + h - 42, w * 0.34, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  if (longShape) {
    ctx.translate(centerX, centerY - 2);
    ctx.rotate(name.includes("chilli") ? -0.58 : -0.28);
    ctx.fillStyle = palette.main;
    roundedRect(ctx, -w * 0.28, -h * 0.07, w * 0.58, h * 0.15, h * 0.08);
    ctx.fill();
    ctx.fillStyle = palette.light;
    roundedRect(ctx, -w * 0.22, -h * 0.045, w * 0.34, h * 0.035, h * 0.02);
    ctx.fill();
    ctx.restore();
    drawLeaf(ctx, centerX + w * 0.2, centerY - h * 0.12, palette.leaf);
    return;
  }

  if (cluster) {
    [
      [-0.16, 0.02, 0.16],
      [0.04, -0.08, 0.18],
      [0.18, 0.07, 0.15],
      [-0.02, 0.13, 0.14]
    ].forEach(([dx, dy, radius], index) => {
      ctx.fillStyle = index % 2 ? palette.light : palette.main;
      ctx.beginPath();
      ctx.ellipse(centerX + dx * w, centerY + dy * h, radius * w, radius * h, index * 0.3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
    drawLeaf(ctx, centerX + w * 0.14, centerY - h * 0.2, palette.leaf);
    return;
  }

  ctx.fillStyle = palette.main;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, w * 0.24, h * 0.21, -0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = palette.light;
  ctx.beginPath();
  ctx.ellipse(centerX - w * 0.08, centerY - h * 0.07, w * 0.08, h * 0.05, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  drawLeaf(ctx, centerX + w * 0.13, centerY - h * 0.2, palette.leaf);
}

function drawProductNameBar(ctx, product, x, y, w, h, config) {
  const barHeight = Math.min(28, Math.max(20, h * 0.16));
  ctx.fillStyle = config.styles.label || "#f7bd22";
  roundedRect(ctx, x + 3, y + h - barHeight - 5, w - 6, barHeight, 5);
  ctx.fill();
  ctx.fillStyle = "#141414";
  const label = `${product.name || ""} ${product.unit || ""}`.toUpperCase();
  fittedText(ctx, label, x + w / 2, y + h - 11, w - 12, Math.min(14, barHeight - 7), 8, "950", "Arial, sans-serif", "center");
}

function drawPriceBadge(ctx, product, x, y, w, h, color, mode) {
  const price = formatRupee(product.sellingPrice);
  const mrp = Number(product.mrp);
  const discount = discountPercent(product);
  const saveAmount = Number.isFinite(mrp) ? Math.round(mrp - Number(product.sellingPrice || 0)) : 0;
  const showMrp = ["selling-mrp-off", "selling-mrp", "selling-mrp-save"].includes(mode) && Number.isFinite(mrp) && mrp > 0;
  const showOff = ["selling-mrp-off", "selling-off"].includes(mode) && discount > 0;
  const showSave = mode === "selling-mrp-save" && saveAmount > 0;
  const detailLines = [
    showMrp ? { text: `MRP ${formatRupee(mrp)}`, strike: true, color: "rgb(255 255 255 / 0.86)" } : null,
    showOff ? { text: `${discount}% OFF`, color: "#fff36d" } : null,
    showSave ? { text: `SAVE ${formatRupee(saveAmount)}`, color: "#fff36d" } : null
  ].filter(Boolean);
  const hasDetails = detailLines.length > 0;

  ctx.save();
  ctx.fillStyle = color || "#dc1019";
  roundedRect(ctx, x, y, w, h, 12);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  fittedText(
    ctx,
    price,
    x + w / 2,
    y + (hasDetails ? h * 0.38 : h * 0.5),
    w - 10,
    Math.min(hasDetails ? 34 : 42, h * (hasDetails ? 0.45 : 0.6)),
    20,
    "950",
    "Arial Black, Arial, sans-serif",
    "center"
  );
  fittedText(ctx, "ONLY", x + w / 2, y + (hasDetails ? h * 0.56 : h * 0.74), w - 12, Math.min(14, h * 0.19), 9, "950", "Arial, sans-serif", "center");

  detailLines.slice(0, 2).forEach((line, index) => {
    const lineY = y + h * (detailLines.length === 1 ? 0.82 : 0.75 + index * 0.16);
    ctx.fillStyle = line.color;
    fittedText(ctx, line.text, x + w / 2, lineY, w - 9, Math.min(11, h * 0.15), 8, "950", "Arial, sans-serif", "center");

    if (line.strike) {
      const lineWidth = Math.min(ctx.measureText(line.text).width, w - 12);
      ctx.strokeStyle = "rgb(255 255 255 / 0.92)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x + (w - lineWidth) / 2, lineY - 4);
      ctx.lineTo(x + (w + lineWidth) / 2, lineY - 4);
      ctx.stroke();
    }
  });
  ctx.restore();
}

function getGridRegion(config) {
  const grid = getDesignElement("productGrid", config);
  return {
    x: grid.x,
    y: grid.y,
    w: grid.visible ? grid.w : 0,
    h: grid.visible ? grid.h : 0
  };
}

function getConfig() {
  const rawConfig = state.template?.config || {};
  const config = structuredClone({
    ...DEFAULT_CONFIG,
    ...rawConfig,
    styles: {
      ...DEFAULT_CONFIG.styles,
      ...(rawConfig.styles || {})
    }
  });

  config.width = clamp(Number(config.width), 320, 4000);
  config.height = clamp(Number(config.height), 320, 4000);
  config.columns = clamp(Number(config.columns), 1, 10);
  config.rows = clamp(Number(config.rows), 1, 10);
  config.gridGap = clamp(Number(config.gridGap || 0), 0, 18);
  config.headerHeight = clamp(Number(config.headerHeight || 382), 220, Math.min(520, config.height - 180));
  config.badgeSize = clamp(Number(config.badgeSize || 84), 44, 140);
  config.priceTagMode = sanitizePriceTagMode(config.priceTagMode);
  config.exportScale = clamp(Number(config.exportScale || 2), 1, 4);
  config.maxProducts = clamp(Number(config.maxProducts || config.columns * config.rows), 1, config.columns * config.rows);

  if (state.template) {
    state.template.config = config;
  }
  return config;
}

function selectedProducts() {
  const byId = new Map(state.products.map((product) => [product.id, product]));
  return state.selectedIds.map((id) => byId.get(id)).filter(Boolean);
}

function filteredProducts(search = state.search) {
  if (!search) return state.products;
  return state.products.filter((product) => {
    const value = `${product.name} ${product.unit} ${product.category}`.toLowerCase();
    return value.includes(search);
  });
}

function getActiveProduct() {
  return state.products.find((product) => product.id === state.activeProductId) || null;
}

function makeFallbackTemplate() {
  return {
    id: "grocery-deals-dynamic",
    name: "Grocery Deals Dynamic Grid",
    type: "grocery-grid",
    config: structuredClone(DEFAULT_CONFIG)
  };
}

async function apiGet(url) {
  return api(url);
}

async function apiPost(url, body) {
  return api(url, { method: "POST", body: JSON.stringify(body) });
}

async function apiPut(url, body) {
  return api(url, { method: "PUT", body: JSON.stringify(body) });
}

async function api(url, options = {}) {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {})
    }
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || `Request failed with status ${response.status}`);
  }
  return result;
}

function setHealthBadge(text, mode) {
  el.healthBadge.textContent = text;
  el.healthBadge.className = `status-pill is-${mode}`;
}

function disableUi(disabled) {
  document.querySelectorAll("button, input, select, textarea").forEach((control) => {
    control.disabled = disabled;
  });
}

function disableControls(controls, disabled) {
  controls.forEach((control) => {
    control.disabled = disabled;
  });
}

function toast(message) {
  el.toast.textContent = message;
  el.toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    el.toast.classList.remove("is-visible");
  }, 2200);
}

function safePrice(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0";
  return String(Math.max(0, Math.round(number)));
}

function formatRupee(value) {
  return `₹${safePrice(value)}`;
}

function discountPercent(product) {
  const mrp = Number(product?.mrp);
  const sellingPrice = Number(product?.sellingPrice);
  if (!Number.isFinite(mrp) || !Number.isFinite(sellingPrice) || mrp <= 0 || sellingPrice <= 0 || sellingPrice >= mrp) {
    return 0;
  }
  return Math.max(1, Math.min(99, Math.round(((mrp - sellingPrice) / mrp) * 100)));
}

function validateProductImageFile(file) {
  if (!ALLOWED_UPLOAD_TYPES.has(file.type)) {
    return "Upload PNG, JPG, or WebP only.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return "Image must be 10MB or smaller.";
  }
  return "";
}

function sanitizeImageStyle(value) {
  return IMAGE_STYLE_VALUES.has(value) ? value : "auto";
}

function normalizeBrand(brand = {}) {
  return {
    ...brand,
    hypermarketLabel: typeof brand.hypermarketLabel === "string" ? brand.hypermarketLabel : "HYPERMARKET",
    logoDataUrl: typeof brand.logoDataUrl === "string" ? brand.logoDataUrl : DEFAULT_LOGO_SETTINGS.logoDataUrl,
    logoX: clamp(Number(brand.logoX ?? DEFAULT_LOGO_SETTINGS.logoX), 0, DEFAULT_CONFIG.width),
    logoY: clamp(Number(brand.logoY ?? DEFAULT_LOGO_SETTINGS.logoY), 0, DEFAULT_CONFIG.height),
    logoWidth: clamp(Number(brand.logoWidth ?? DEFAULT_LOGO_SETTINGS.logoWidth), 50, 420)
  };
}

function imageStyleLabel(value) {
  const labels = {
    auto: "Auto style",
    whole: "Whole",
    bunch: "Bunch",
    cut: "Cut / Half",
    prepared: "Prepared"
  };
  return labels[sanitizeImageStyle(value)] || labels.auto;
}

function sanitizePriceTagMode(value) {
  const modes = ["selling-only", "selling-mrp-off", "selling-off", "selling-mrp", "selling-mrp-save"];
  return modes.includes(value) ? value : "selling-mrp-off";
}

function initials(value) {
  const words = String(value || "Product")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  return words.map((word) => word[0]?.toUpperCase() || "").join("") || "P";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "poster";
}

function clamp(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
}

function producePalette(productName) {
  const name = String(productName || "").toLowerCase();
  if (/(tomato|red dragon)/.test(name)) return { main: "#f24a38", light: "#ff8874", leaf: "#278640" };
  if (/brinjal/.test(name)) return { main: "#7d3db4", light: "#ad7dd6", leaf: "#2b8a45" };
  if (/(chilli|beans|gourd|kovakka|chow|knol|cabbage|guava)/.test(name)) return { main: "#72be43", light: "#b2e17b", leaf: "#197b3a" };
  if (/(lemon|citrus|mosambi|pineapple|custard)/.test(name)) return { main: "#f5cf37", light: "#ffe979", leaf: "#2f8b3c" };
  if (/(potato|arbi|garlic|mushroom|stem)/.test(name)) return { main: "#ead8b6", light: "#fff2d5", leaf: "#6f9d50" };
  if (/(papaya|pumpkin)/.test(name)) return { main: "#f28a2e", light: "#ffc165", leaf: "#2b8d44" };
  if (/kiwi/.test(name)) return { main: "#9ccf5a", light: "#d9ee99", leaf: "#3e7b32" };
  if (/(pear|apple)/.test(name)) return { main: "#b8dc64", light: "#e4f3a6", leaf: "#3a873b" };
  if (/banana/.test(name)) return { main: "#f2d24f", light: "#fff08b", leaf: "#337f36" };
  return { main: "#8fcf58", light: "#d9ef9d", leaf: "#2f8b3c" };
}

function drawLeaf(ctx, x, y, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, 10, 5, -0.65, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawImageContain(ctx, img, x, y, w, h) {
  const ratio = Math.min(w / img.width, h / img.height);
  const drawW = img.width * ratio;
  const drawH = img.height * ratio;
  const drawX = x + (w - drawW) / 2;
  const drawY = y + (h - drawH) / 2;
  ctx.drawImage(img, drawX, drawY, drawW, drawH);
}

function roundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function fittedText(ctx, text, x, y, maxWidth, maxSize, minSize, weight, family, align = "left") {
  const value = String(text || "");
  let size = maxSize;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  while (size > minSize) {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(value).width <= maxWidth) break;
    size -= 1;
  }
  ctx.font = `${weight} ${size}px ${family}`;
  ctx.fillText(value, x, y);
}

function spreadText(ctx, text, x, y, width, size) {
  const chars = String(text).split("");
  const gap = chars.length > 1 ? width / (chars.length - 1) : 0;
  ctx.save();
  ctx.font = `900 ${size}px Arial, sans-serif`;
  ctx.textAlign = "center";
  chars.forEach((char, index) => {
    ctx.fillText(char, x + index * gap, y);
  });
  ctx.restore();
}

function $(selector) {
  return document.querySelector(selector);
}
