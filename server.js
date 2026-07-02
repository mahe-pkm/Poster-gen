import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config, publicConfig } from "./lib/config.js";
import { generateProductImage } from "./lib/openrouter.js";
import { createStore } from "./lib/store.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const store = await createStore({ config });
const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "8mb" }));

app.use("/assets", express.static(path.join(__dirname, "assets"), { dotfiles: "ignore" }));
app.use("/sample-products", express.static(path.join(__dirname, "public", "sample-products"), { dotfiles: "ignore" }));
app.use("/generated-products", express.static(path.join(__dirname, "public", "generated-products"), { dotfiles: "ignore" }));

app.get("/styles.css", (_request, response) => {
  response.sendFile(path.join(__dirname, "styles.css"));
});

app.get("/app.js", (_request, response) => {
  response.sendFile(path.join(__dirname, "app.js"));
});

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    ...publicConfig(),
    ...store.getCapabilities()
  });
});

app.get("/api/brand", asyncHandler(async (_request, response) => {
  response.json({ brand: await store.getBrand() });
}));

app.put("/api/brand", asyncHandler(async (request, response) => {
  response.json({ brand: await store.updateBrand(request.body || {}) });
}));

app.get("/api/products", asyncHandler(async (_request, response) => {
  response.json({ products: await store.listProducts() });
}));

app.post("/api/products", asyncHandler(async (request, response) => {
  const product = await store.createProduct(request.body || {});
  response.status(201).json({ product });
}));

app.put("/api/products/:id", asyncHandler(async (request, response) => {
  const product = await store.updateProduct(request.params.id, request.body || {});
  if (!product) {
    response.status(404).json({ error: "Product not found." });
    return;
  }
  response.json({ product });
}));

app.post("/api/products/:id/generate-image", asyncHandler(async (request, response) => {
  const product = await store.getProduct(request.params.id);
  if (!product) {
    response.status(404).json({ error: "Product not found." });
    return;
  }

  const body = request.body || {};
  if (product.imageUrl && !body.regenerate) {
    response.json({
      reused: true,
      imageUrl: product.imageUrl,
      product
    });
    return;
  }

  const imageResult = await generateProductImage({
    config,
    product,
    size: body.size,
    quality: body.quality,
    outputFormat: body.outputFormat,
    background: body.background
  });

  const savedImage = await store.saveProductImage(product, imageResult);
  const updatedProduct = await store.updateProduct(product.id, {
    imageUrl: savedImage.publicUrl
  });

  const generation = await store.logAiGeneration({
    productId: product.id,
    prompt: imageResult.prompt,
    model: imageResult.model,
    quality: imageResult.quality,
    outputUrl: savedImage.publicUrl,
    estimatedCost: imageResult.estimatedCost,
    providerResponse: imageResult.providerResponse
  });

  response.json({
    reused: false,
    imageUrl: savedImage.publicUrl,
    product: updatedProduct,
    generation: {
      id: generation.id,
      model: imageResult.model,
      estimatedCost: imageResult.estimatedCost
    }
  });
}));

app.get("/api/templates", asyncHandler(async (_request, response) => {
  response.json({ templates: await store.listTemplates() });
}));

app.post("/api/templates", asyncHandler(async (request, response) => {
  const id = request.body?.id || `template_${Date.now()}`;
  const template = await store.updateTemplate(id, request.body || {});
  response.status(201).json({ template });
}));

app.put("/api/templates/:id", asyncHandler(async (request, response) => {
  const template = await store.updateTemplate(request.params.id, request.body || {});
  response.json({ template });
}));

app.post("/api/posters/export-log", asyncHandler(async (request, response) => {
  const exportLog = await store.logPosterExport(request.body || {});
  response.status(201).json({ exportLog });
}));

app.use("/api", (_request, response) => {
  response.status(404).json({ error: "API route not found." });
});

app.get(["/", "/products", "/templates", "/poster-builder"], (_request, response) => {
  response.sendFile(path.join(__dirname, "index.html"));
});

app.use((_request, response) => {
  response.status(404).sendFile(path.join(__dirname, "index.html"));
});

app.use((error, _request, response, _next) => {
  const status = Number(error.status || 500);
  const message = status >= 500 ? error.message || "Server error." : error.message;
  response.status(status).json({ error: message });
});

if (!config.isVercel) {
  app.listen(config.port, () => {
    console.log(`Store Poster Maker running at http://localhost:${config.port}`);
    console.log(`Data mode: ${store.getCapabilities().database}`);
  });
}

export default app;

function asyncHandler(handler) {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}
