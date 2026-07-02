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

const state = {
  health: null,
  brand: null,
  products: [],
  templates: [],
  template: null,
  selectedIds: [],
  activeProductId: null,
  search: "",
  hitAreas: []
};

const imageCache = new Map();
const imageLoading = new Set();
let toastTimer = null;

const el = {
  healthBadge: $("#healthBadge"),
  storeName: $("#storeNameInput"),
  localName: $("#localNameInput"),
  headline: $("#headlineInput"),
  subheadline: $("#subheadlineInput"),
  phone: $("#phoneInput"),
  validUntil: $("#validUntilInput"),
  deliveryText: $("#deliveryTextInput"),
  saveBrand: $("#saveBrandButton"),
  templateSelect: $("#templateSelect"),
  priceTag: $("#priceTagInput"),
  presetRow: $("#presetRow"),
  columns: $("#columnsInput"),
  rows: $("#rowsInput"),
  gap: $("#gapInput"),
  badgeSize: $("#badgeSizeInput"),
  headerHeight: $("#headerHeightInput"),
  exportScale: $("#exportScaleInput"),
  saveTemplate: $("#saveTemplateButton"),
  productSearch: $("#productSearchInput"),
  addProduct: $("#addProductButton"),
  selectVisible: $("#selectVisibleButton"),
  clearSelection: $("#clearSelectionButton"),
  productList: $("#productList"),
  posterCanvas: $("#posterCanvas"),
  posterTitle: $("#posterTitle"),
  download: $("#downloadButton"),
  selectionCount: $("#selectionCount"),
  imageState: $("#imageState"),
  productThumb: $("#productThumb"),
  productName: $("#productNameInput"),
  productUnit: $("#productUnitInput"),
  productCategory: $("#productCategoryInput"),
  sellingPrice: $("#sellingPriceInput"),
  mrp: $("#mrpInput"),
  imageUrl: $("#imageUrlInput"),
  saveProduct: $("#saveProductButton"),
  imageSize: $("#imageSizeInput"),
  imageQuality: $("#imageQualityInput"),
  reuseImage: $("#reuseImageButton"),
  regenerateImage: $("#regenerateImageButton"),
  aiStatus: $("#aiStatus"),
  productMetric: $("#productMetric"),
  templateMetric: $("#templateMetric"),
  openRouterMetric: $("#openRouterMetric"),
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
  state.brand = brand.brand;
  state.products = products.products || [];
  state.templates = templates.templates || [];
  state.template = state.templates[0] || makeFallbackTemplate();

  const config = getConfig();
  const maxProducts = config.maxProducts || config.columns * config.rows;
  state.selectedIds = state.products.slice(0, maxProducts).map((product) => product.id);
  state.activeProductId = state.selectedIds[0] || state.products[0]?.id || null;
  preloadVisibleImages();
}

function wireEvents() {
  [
    ["storeName", "storeName"],
    ["localName", "localName"],
    ["headline", "headline"],
    ["subheadline", "subheadline"],
    ["phone", "phone"],
    ["validUntil", "validUntil"],
    ["deliveryText", "deliveryText"]
  ].forEach(([elementKey, brandKey]) => {
    el[elementKey].addEventListener("input", () => {
      state.brand[brandKey] = el[elementKey].value;
      drawPoster();
      renderHeaderMetrics();
    });
  });

  el.saveBrand.addEventListener("click", saveBrand);

  el.templateSelect.addEventListener("change", () => {
    state.template = state.templates.find((template) => template.id === el.templateSelect.value) || state.templates[0];
    trimSelectionToTemplate();
    syncTemplateInputs();
    renderAll();
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

  el.productSearch.addEventListener("input", () => {
    state.search = el.productSearch.value.trim().toLowerCase();
    renderProductList();
  });

  el.addProduct.addEventListener("click", addProduct);
  el.selectVisible.addEventListener("click", selectVisibleProducts);
  el.clearSelection.addEventListener("click", () => {
    state.selectedIds = [];
    renderAll();
  });

  ["productName", "productUnit", "productCategory", "sellingPrice", "mrp", "imageUrl"].forEach((key) => {
    el[key].addEventListener("input", () => {
      updateActiveProductFromInputs();
      renderProductList();
      renderImageState();
      preloadVisibleImages();
      drawPoster();
    });
  });

  el.saveProduct.addEventListener("click", saveActiveProduct);
  el.reuseImage.addEventListener("click", () => generateImage(false));
  el.regenerateImage.addEventListener("click", () => generateImage(true));
  el.download.addEventListener("click", exportPoster);

  el.posterCanvas.addEventListener("click", (event) => {
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

function renderAll() {
  syncBrandInputs();
  syncTemplateSelector();
  syncTemplateInputs();
  syncProductInputs();
  renderProductList();
  renderImageState();
  renderHeaderMetrics();
  drawPoster();
}

function syncBrandInputs() {
  if (!state.brand) return;
  el.storeName.value = state.brand.storeName || "";
  el.localName.value = state.brand.localName || "";
  el.headline.value = state.brand.headline || "";
  el.subheadline.value = state.brand.subheadline || "";
  el.phone.value = state.brand.phone || "";
  el.validUntil.value = state.brand.validUntil || "";
  el.deliveryText.value = state.brand.deliveryText || "";
}

function syncTemplateSelector() {
  el.templateSelect.innerHTML = "";
  state.templates.forEach((template) => {
    const option = document.createElement("option");
    option.value = template.id;
    option.textContent = template.name;
    option.selected = template.id === state.template?.id;
    el.templateSelect.appendChild(option);
  });
}

function syncTemplateInputs() {
  const config = getConfig();
  el.columns.value = config.columns;
  el.rows.value = config.rows;
  el.gap.value = config.gridGap;
  el.badgeSize.value = config.badgeSize;
  el.priceTag.value = config.priceTagMode;
  el.headerHeight.value = config.headerHeight;
  el.exportScale.value = config.exportScale;

  const activePreset = Object.entries(PRESETS).find(([, preset]) => preset.columns === config.columns && preset.rows === config.rows)?.[0];
  [...el.presetRow.querySelectorAll("button")].forEach((button) => {
    button.classList.toggle("is-active", button.dataset.preset === activePreset);
  });
}

function syncProductInputs() {
  const product = getActiveProduct();
  const hasProduct = Boolean(product);
  ["productName", "productUnit", "productCategory", "sellingPrice", "mrp", "imageUrl", "saveProduct", "reuseImage", "regenerateImage"].forEach((key) => {
    el[key].disabled = !hasProduct;
  });

  if (!product) {
    el.productName.value = "";
    el.productUnit.value = "";
    el.productCategory.value = "";
    el.sellingPrice.value = "";
    el.mrp.value = "";
    el.imageUrl.value = "";
    return;
  }

  el.productName.value = product.name || "";
  el.productUnit.value = product.unit || "";
  el.productCategory.value = product.category || "";
  el.sellingPrice.value = safePrice(product.sellingPrice);
  el.mrp.value = product.mrp ?? "";
  el.imageUrl.value = product.imageUrl || "";
}

function renderProductList() {
  const products = filteredProducts();
  el.productList.innerHTML = "";

  products.forEach((product) => {
    const row = document.createElement("div");
    row.className = [
      "product-row",
      product.id === state.activeProductId ? "is-active" : "",
      state.selectedIds.includes(product.id) ? "is-selected" : ""
    ]
      .filter(Boolean)
      .join(" ");
    row.tabIndex = 0;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = state.selectedIds.includes(product.id);
    checkbox.addEventListener("change", () => toggleProductSelection(product.id, checkbox.checked));

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
    price.textContent = safePrice(product.sellingPrice);

    row.append(checkbox, thumb, details, price);
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

    el.productList.appendChild(row);
  });
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
    el.imageState.textContent = "Reusable";
    el.imageState.className = "status-pill is-ready";
  } else {
    el.imageState.textContent = "Fallback";
    el.imageState.className = "status-pill is-warn";
  }
}

function renderHeaderMetrics() {
  const config = getConfig();
  const title = `${state.brand?.storeName || "Store"} ${state.brand?.headline || "Offers"} ${state.brand?.subheadline || ""}`.trim();
  el.posterTitle.textContent = title;
  el.selectionCount.textContent = `${state.selectedIds.length} selected`;
  el.productMetric.textContent = String(state.products.length);
  el.templateMetric.textContent = `${config.columns}x${config.rows}`;
  el.openRouterMetric.textContent = state.health?.openRouterConfigured ? "On" : "Off";

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
    state.brand = response.brand;
    syncBrandInputs();
    drawPoster();
    toast("Store saved");
  } catch (error) {
    toast(error.message || "Store save failed");
  } finally {
    disableControls([el.saveBrand], false);
  }
}

async function saveTemplate() {
  if (!state.template) return;
  disableControls([el.saveTemplate], true);
  try {
    const response = await apiPut(`/api/templates/${encodeURIComponent(state.template.id)}`, state.template);
    replaceTemplate(response.template);
    state.template = response.template;
    syncTemplateSelector();
    toast("Template saved");
  } catch (error) {
    toast(error.message || "Template save failed");
  } finally {
    disableControls([el.saveTemplate], false);
  }
}

async function addProduct() {
  disableControls([el.addProduct], true);
  try {
    const response = await apiPost("/api/products", {
      name: "New Product",
      unit: "1 KG",
      category: "Grocery",
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

  disableControls([el.saveProduct], true);
  try {
    const response = await apiPut(`/api/products/${encodeURIComponent(product.id)}`, product);
    replaceProduct(response.product);
    syncProductInputs();
    renderProductList();
    renderImageState();
    preloadVisibleImages();
    drawPoster();
    toast("Product saved");
  } catch (error) {
    toast(error.message || "Product save failed");
  } finally {
    disableControls([el.saveProduct], false);
  }
}

async function generateImage(regenerate) {
  const product = getActiveProduct();
  if (!product) return;

  disableControls([el.reuseImage, el.regenerateImage], true);
  el.aiStatus.textContent = regenerate ? "Generating replacement image..." : "Checking reusable image...";

  try {
    const response = await apiPost(`/api/products/${encodeURIComponent(product.id)}/generate-image`, {
      regenerate,
      size: el.imageSize.value,
      quality: el.imageQuality.value,
      outputFormat: "png",
      background: "transparent"
    });

    replaceProduct(response.product);
    state.activeProductId = response.product.id;
    imageCache.delete(response.product.id);
    preloadVisibleImages();
    syncProductInputs();
    renderProductList();
    renderImageState();
    drawPoster();
    el.aiStatus.textContent = response.reused ? "Existing image reused." : "New image saved.";
    toast(response.reused ? "Image reused" : "Image generated");
  } catch (error) {
    el.aiStatus.textContent = error.message || "Image generation failed.";
    toast(error.message || "Image generation failed");
  } finally {
    disableControls([el.reuseImage, el.regenerateImage], false);
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
  product.sellingPrice = Number(el.sellingPrice.value || 0);
  product.mrp = el.mrp.value === "" ? null : Number(el.mrp.value || 0);
  product.imageUrl = el.imageUrl.value.trim();
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
  drawPoster();
}

function trimSelectionToTemplate() {
  const config = getConfig();
  const maxProducts = Number(config.maxProducts || config.columns * config.rows);
  state.selectedIds = state.selectedIds.slice(0, maxProducts);
  if (!state.activeProductId && state.selectedIds[0]) {
    state.activeProductId = state.selectedIds[0];
  }
}

function selectVisibleProducts() {
  const config = getConfig();
  const maxProducts = Number(config.maxProducts || config.columns * config.rows);
  state.selectedIds = filteredProducts().slice(0, maxProducts).map((product) => product.id);
  state.activeProductId = state.selectedIds[0] || state.activeProductId;
  preloadVisibleImages();
  renderAll();
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
  renderProductList();
  renderImageState();
  drawPoster();
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

function preloadVisibleImages() {
  selectedProducts().forEach((product) => {
    if (!product.imageUrl || imageCache.has(product.id) || imageLoading.has(product.id)) return;

    imageLoading.add(product.id);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageCache.set(product.id, img);
      imageLoading.delete(product.id);
      drawPoster();
    };
    img.onerror = () => {
      imageLoading.delete(product.id);
      drawPoster();
    };
    img.src = product.imageUrl;
  });
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
  drawProducts(ctx, config);
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

  ctx.fillStyle = "#e31318";
  fittedText(ctx, state.brand?.localName || "", 24, 54, 300, 30, 18, "900", '"Segoe UI", Arial, sans-serif');
  fittedText(ctx, state.brand?.storeName || "GrandPlus", 340, 58, 340, 38, 24, "950", "Arial, sans-serif");
  ctx.fillStyle = "#9e2a2a";
  spreadText(ctx, "HYPERMARKET", 420, 96, 200, 14);

  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgb(0 0 0 / 0.17)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  fittedText(ctx, String(state.brand?.headline || "GROCERY").toUpperCase(), 34, 176, 560, 88, 46, "950", "Arial Black, Arial, sans-serif");
  fittedText(ctx, String(state.brand?.subheadline || "DEALS").toUpperCase(), 36, 284, 520, 84, 44, "950", "Arial Black, Arial, sans-serif");
  ctx.shadowColor = "transparent";

  drawBasket(ctx, config.width * 0.58, Math.max(150, headerHeight * 0.42));
  drawDelivery(ctx, config.width - 184, 18, styles);
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

function drawContactStrip(ctx, config) {
  const styles = config.styles;
  const y = Math.max(154, config.headerHeight - 75);
  const h = 58;
  const x = 24;
  const w = config.width - 48;

  ctx.save();
  ctx.fillStyle = styles.strip || "#16843a";
  roundedRect(ctx, x, y, w, h, 30);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x + 34, y + h / 2, 23, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = styles.strip || "#16843a";
  ctx.font = "900 24px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("TEL", x + 34, y + h / 2 + 1);

  ctx.fillStyle = "#ffffff";
  fittedText(ctx, state.brand?.phone || "", x + 70, y + 41, 330, 34, 20, "950", "Arial, sans-serif");
  ctx.textAlign = "right";
  fittedText(ctx, `VALID : ${state.brand?.validUntil || ""}`, x + w - 14, y + 40, 310, 28, 16, "950", "Arial, sans-serif", "right");
  ctx.restore();
}

function drawProducts(ctx, config) {
  state.hitAreas = [];
  const products = selectedProducts().slice(0, config.maxProducts);
  const rows = Math.max(1, Number(config.rows));
  const columns = Math.max(1, Number(config.columns));
  const gap = Number(config.gridGap || 0);
  const grid = getGridRegion(config);
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

    if (selected) {
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
  const price = safePrice(product.sellingPrice);
  const mrp = Number(product.mrp);
  const discount = discountPercent(product);
  const saveAmount = Number.isFinite(mrp) ? Math.round(mrp - Number(product.sellingPrice || 0)) : 0;
  const showMrp = ["selling-mrp-off", "selling-mrp", "selling-mrp-save"].includes(mode) && Number.isFinite(mrp) && mrp > 0;
  const showOff = ["selling-mrp-off", "selling-off"].includes(mode) && discount > 0;
  const showSave = mode === "selling-mrp-save" && saveAmount > 0;
  const detailLines = [
    showMrp ? { text: `MRP ${safePrice(mrp)}`, strike: true, color: "rgb(255 255 255 / 0.86)" } : null,
    showOff ? { text: `${discount}% OFF`, color: "#fff36d" } : null,
    showSave ? { text: `SAVE ${saveAmount}`, color: "#fff36d" } : null
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
  const safeLeft = 8;
  const safeBottom = 8;
  const y = config.headerHeight + 4;
  return {
    x: safeLeft,
    y,
    w: config.width - safeLeft * 2,
    h: config.height - y - safeBottom
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

function filteredProducts() {
  if (!state.search) return state.products;
  return state.products.filter((product) => {
    const value = `${product.name} ${product.unit} ${product.category}`.toLowerCase();
    return value.includes(state.search);
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
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
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

function discountPercent(product) {
  const mrp = Number(product?.mrp);
  const sellingPrice = Number(product?.sellingPrice);
  if (!Number.isFinite(mrp) || !Number.isFinite(sellingPrice) || mrp <= 0 || sellingPrice <= 0 || sellingPrice >= mrp) {
    return 0;
  }
  return Math.max(1, Math.min(99, Math.round(((mrp - sellingPrice) / mrp) * 100)));
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
