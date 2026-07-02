import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const IMAGE_STYLES = new Set(["auto", "whole", "bunch", "cut", "prepared"]);

export async function createStore({ config }) {
  const localStore = new LocalStore(config);

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    await localStore.init();
    return localStore;
  }

  const supabaseStore = new SupabaseStore(config);
  try {
    await supabaseStore.init();
    return supabaseStore;
  } catch (error) {
    console.warn(`Supabase unavailable, using local data: ${error.message}`);
    await localStore.init();
    return localStore;
  }
}

class LocalStore {
  constructor(config) {
    this.config = config;
    this.mode = "local";
    this.rootDir = config.rootDir;
    this.dataFile = config.isVercel ? path.join("/tmp", "store.local.json") : path.resolve(this.rootDir, config.localDataFile);
    this.seedFile = path.resolve(this.rootDir, "data", "seed.json");
    this.publicDir = path.resolve(this.rootDir, "public");
    this.generatedDir = path.resolve(this.publicDir, "generated-products");
    this.data = null;
  }

  async init() {
    await fs.mkdir(path.dirname(this.dataFile), { recursive: true });
    if (!this.config.isVercel) {
      await fs.mkdir(this.generatedDir, { recursive: true });
    }

    try {
      this.data = await readJson(this.dataFile);
    } catch {
      this.data = await readJson(this.seedFile);
    }
    this.data.products = this.data.products.map((product, index) => sanitizeProduct({
      ...product,
      sortOrder: product.sortOrder ?? index
    }));
    await this.save();
  }

  getCapabilities() {
    return {
      storage: this.mode,
      database: this.mode,
      imageUploads: this.config.isVercel ? "data-url-demo" : "local",
      reusableImages: !this.config.isVercel
    };
  }

  async getBrand() {
    return this.data.brand;
  }

  async updateBrand(input) {
    this.data.brand = {
      ...this.data.brand,
      ...pick(input, ["storeName", "localName", "headline", "subheadline", "phone", "validUntil", "deliveryText", "priceMode", "showDiscount"])
    };
    await this.save();
    return this.data.brand;
  }

  async listProducts() {
    return this.data.products;
  }

  async getProduct(id) {
    return this.data.products.find((product) => product.id === id) || null;
  }

  async createProduct(input) {
    const product = sanitizeProduct({
      id: input.id || createId("p"),
      name: input.name || "New Product",
      unit: input.unit || "1 KG",
      category: input.category || "Grocery",
      imageStyle: input.imageStyle || "auto",
      imageUrl: input.imageUrl || "",
      mrp: input.mrp ?? null,
      sellingPrice: input.sellingPrice ?? input.price ?? 0,
      archivedImageUrls: [],
      sortOrder: this.data.products.length
    });

    this.data.products.push(product);
    await this.save();
    return product;
  }

  async updateProduct(id, input) {
    const index = this.data.products.findIndex((product) => product.id === id);
    if (index === -1) {
      return null;
    }

    const current = this.data.products[index];
    const next = sanitizeProduct({
      ...current,
      ...pick(input, ["name", "unit", "category", "imageStyle", "imageUrl", "mrp", "sellingPrice", "price", "sortOrder"])
    });

    if (next.imageUrl && current.imageUrl && next.imageUrl !== current.imageUrl) {
      next.archivedImageUrls = unique([...(current.archivedImageUrls || []), current.imageUrl]);
    } else {
      next.archivedImageUrls = current.archivedImageUrls || [];
    }

    this.data.products[index] = next;
    await this.save();
    return next;
  }

  async listTemplates() {
    return this.data.templates;
  }

  async updateTemplate(id, input) {
    const index = this.data.templates.findIndex((template) => template.id === id);
    const template = sanitizeTemplate({
      id,
      name: input.name || "Custom Template",
      type: input.type || "grocery-grid",
      config: input.config || {}
    });

    if (index === -1) {
      this.data.templates.push(template);
    } else {
      this.data.templates[index] = {
        ...this.data.templates[index],
        ...template
      };
    }

    await this.save();
    return index === -1 ? template : this.data.templates[index];
  }

  async saveProductImage(product, imageResult) {
    if (this.config.isVercel) {
      return {
        publicUrl: `data:${imageResult.mediaType};base64,${imageResult.buffer.toString("base64")}`,
        storagePath: "data-url-demo"
      };
    }

    const safeProductId = slug(product.id || product.name || "product");
    const filename = `${safeProductId}-${Date.now()}.${imageResult.extension}`;
    const filePath = path.join(this.generatedDir, filename);
    await fs.writeFile(filePath, imageResult.buffer);
    return {
      publicUrl: `/generated-products/${filename}`,
      storagePath: filePath
    };
  }

  async logAiGeneration(input) {
    const entry = {
      id: createId("gen"),
      productId: input.productId,
      prompt: input.prompt,
      model: input.model,
      quality: input.quality,
      outputUrl: input.outputUrl,
      estimatedCost: input.estimatedCost ?? null,
      providerResponse: input.providerResponse || null,
      createdAt: new Date().toISOString()
    };
    this.data.aiGenerations.unshift(entry);
    await this.save();
    return entry;
  }

  async logPosterExport(input) {
    const entry = {
      id: createId("export"),
      templateId: input.templateId,
      title: input.title || "",
      selectedProductIds: Array.isArray(input.selectedProductIds) ? input.selectedProductIds : [],
      config: input.config || {},
      createdAt: new Date().toISOString()
    };
    this.data.exportLogs.unshift(entry);
    await this.save();
    return entry;
  }

  async save() {
    await fs.writeFile(this.dataFile, `${JSON.stringify(this.data, null, 2)}\n`);
  }
}

class SupabaseStore {
  constructor(config) {
    this.config = config;
    this.mode = "supabase";
    this.seedFile = path.resolve(config.rootDir, "data", "seed.json");
    this.supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }

  async init() {
    const { error } = await this.supabase.from("products").select("id").limit(1);
    if (error) throw error;
    await this.ensureStorageBucket();
    await this.seedIfEmpty();
  }

  getCapabilities() {
    return {
      storage: "supabase",
      database: "supabase",
      imageUploads: "supabase-storage",
      reusableImages: true
    };
  }

  async ensureStorageBucket() {
    const bucket = this.config.supabaseStorageBucket;
    const { error } = await this.supabase.storage.getBucket(bucket);
    if (!error) return;

    const { error: createError } = await this.supabase.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: "10MB",
      allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"]
    });

    if (createError) {
      console.warn(`Supabase bucket check failed: ${createError.message}`);
    }
  }

  async seedIfEmpty() {
    const seed = await readJson(this.seedFile);

    const { count: productCount, error: productCountError } = await this.supabase
      .from("products")
      .select("id", { count: "exact", head: true });
    if (productCountError) throw productCountError;

    if (!productCount) {
      const rows = seed.products.map((product, index) => productToRow({ ...product, sortOrder: index }));
      const { error } = await this.supabase.from("products").insert(rows);
      if (error) throw error;
    }

    const { count: templateCount, error: templateCountError } = await this.supabase
      .from("poster_templates")
      .select("id", { count: "exact", head: true });
    if (templateCountError) throw templateCountError;

    if (!templateCount) {
      const rows = seed.templates.map(templateToRow);
      const { error } = await this.supabase.from("poster_templates").insert(rows);
      if (error) throw error;
    }

    const { count: brandCount, error: brandCountError } = await this.supabase
      .from("brand_settings")
      .select("id", { count: "exact", head: true });
    if (brandCountError) throw brandCountError;

    if (!brandCount) {
      const { error } = await this.supabase.from("brand_settings").insert({
        id: "default",
        config_json: seed.brand
      });
      if (error) throw error;
    }
  }

  async getBrand() {
    const { data, error } = await this.supabase
      .from("brand_settings")
      .select("config_json")
      .eq("id", "default")
      .single();
    if (error) throw error;
    return data.config_json;
  }

  async updateBrand(input) {
    const current = await this.getBrand();
    const next = {
      ...current,
      ...pick(input, ["storeName", "localName", "headline", "subheadline", "phone", "validUntil", "deliveryText", "priceMode", "showDiscount"])
    };
    const { data, error } = await this.supabase
      .from("brand_settings")
      .upsert({ id: "default", config_json: next }, { onConflict: "id" })
      .select("config_json")
      .single();
    if (error) throw error;
    return data.config_json;
  }

  async listProducts() {
    const { data, error } = await this.supabase
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw error;
    return data.map(productFromRow);
  }

  async getProduct(id) {
    const { data, error } = await this.supabase.from("products").select("*").eq("id", id).single();
    if (error?.code === "PGRST116") return null;
    if (error) throw error;
    return productFromRow(data);
  }

  async createProduct(input) {
    const existing = await this.listProducts();
    const product = sanitizeProduct({
      id: input.id || createId("p"),
      name: input.name || "New Product",
      unit: input.unit || "1 KG",
      category: input.category || "Grocery",
      imageStyle: input.imageStyle || "auto",
      imageUrl: input.imageUrl || "",
      mrp: input.mrp ?? null,
      sellingPrice: input.sellingPrice ?? input.price ?? 0,
      archivedImageUrls: [],
      sortOrder: existing.length
    });

    const { data, error } = await this.supabase.from("products").insert(productToRow(product)).select("*").single();
    if (error) throw error;
    return productFromRow(data);
  }

  async updateProduct(id, input) {
    const current = await this.getProduct(id);
    if (!current) return null;

    const next = sanitizeProduct({
      ...current,
      ...pick(input, ["name", "unit", "category", "imageStyle", "imageUrl", "mrp", "sellingPrice", "price", "sortOrder"])
    });

    if (next.imageUrl && current.imageUrl && next.imageUrl !== current.imageUrl) {
      next.archivedImageUrls = unique([...(current.archivedImageUrls || []), current.imageUrl]);
    } else {
      next.archivedImageUrls = current.archivedImageUrls || [];
    }

    const { data, error } = await this.supabase
      .from("products")
      .update(productToRow(next))
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return productFromRow(data);
  }

  async listTemplates() {
    const { data, error } = await this.supabase
      .from("poster_templates")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data.map(templateFromRow);
  }

  async updateTemplate(id, input) {
    const template = sanitizeTemplate({
      id,
      name: input.name || "Custom Template",
      type: input.type || "grocery-grid",
      config: input.config || {}
    });
    const { data, error } = await this.supabase
      .from("poster_templates")
      .upsert(templateToRow(template), { onConflict: "id" })
      .select("*")
      .single();
    if (error) throw error;
    return templateFromRow(data);
  }

  async saveProductImage(product, imageResult) {
    const safeProductId = slug(product.id || product.name || "product");
    const filename = `${safeProductId}-${Date.now()}.${imageResult.extension}`;
    const storagePath = `products/${safeProductId}/${filename}`;

    const { error } = await this.supabase.storage
      .from(this.config.supabaseStorageBucket)
      .upload(storagePath, imageResult.buffer, {
        contentType: imageResult.mediaType,
        cacheControl: "31536000",
        upsert: false
      });

    if (error) throw error;

    const { data } = this.supabase.storage.from(this.config.supabaseStorageBucket).getPublicUrl(storagePath);
    return {
      publicUrl: data.publicUrl,
      storagePath
    };
  }

  async logAiGeneration(input) {
    const { data, error } = await this.supabase
      .from("ai_generations")
      .insert({
        product_id: input.productId,
        prompt: input.prompt,
        model: input.model,
        quality: input.quality,
        output_url: input.outputUrl,
        estimated_cost: input.estimatedCost ?? null,
        provider_response: input.providerResponse || null
      })
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  async logPosterExport(input) {
    const { data, error } = await this.supabase
      .from("poster_export_logs")
      .insert({
        template_id: input.templateId,
        title: input.title || "",
        selected_product_ids: input.selectedProductIds || [],
        config_json: input.config || {}
      })
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

function productFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    unit: row.unit || "",
    category: row.category || "",
    imageStyle: sanitizeImageStyle(row.image_style),
    imageUrl: row.image_url || "",
    mrp: row.mrp === null ? null : Number(row.mrp),
    sellingPrice: Number(row.selling_price || 0),
    archivedImageUrls: Array.isArray(row.archived_image_urls) ? row.archived_image_urls : [],
    sortOrder: Number(row.sort_order || 0)
  };
}

function productToRow(product) {
  return {
    id: product.id,
    name: product.name,
    unit: product.unit || "",
    category: product.category || "",
    image_style: sanitizeImageStyle(product.imageStyle),
    image_url: product.imageUrl || "",
    mrp: product.mrp ?? null,
    selling_price: Number(product.sellingPrice || 0),
    archived_image_urls: product.archivedImageUrls || [],
    sort_order: Number(product.sortOrder || 0)
  };
}

function templateFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.type || "grocery-grid",
    config: row.config_json || {}
  };
}

function templateToRow(template) {
  return {
    id: template.id,
    name: template.name,
    type: template.type || "grocery-grid",
    config_json: template.config || {}
  };
}

function sanitizeProduct(input) {
  const sellingPrice = Number(input.sellingPrice ?? input.price ?? 0);
  const mrp = input.mrp === "" || input.mrp === undefined || input.mrp === null ? null : Number(input.mrp);

  return {
    id: String(input.id || createId("p")),
    name: String(input.name || "New Product").trim() || "New Product",
    unit: String(input.unit || "").trim(),
    category: String(input.category || "").trim(),
    imageStyle: sanitizeImageStyle(input.imageStyle),
    imageUrl: String(input.imageUrl || "").trim(),
    mrp: Number.isFinite(mrp) ? mrp : null,
    sellingPrice: Number.isFinite(sellingPrice) ? sellingPrice : 0,
    archivedImageUrls: Array.isArray(input.archivedImageUrls) ? input.archivedImageUrls : [],
    sortOrder: Number.isFinite(Number(input.sortOrder)) ? Number(input.sortOrder) : 0
  };
}

function sanitizeImageStyle(value) {
  return IMAGE_STYLES.has(value) ? value : "auto";
}

function sanitizeTemplate(input) {
  return {
    id: String(input.id || createId("template")),
    name: String(input.name || "Custom Template").trim() || "Custom Template",
    type: String(input.type || "grocery-grid"),
    config: input.config && typeof input.config === "object" ? input.config : {}
  };
}

function pick(input, keys) {
  const output = {};
  keys.forEach((key) => {
    if (Object.hasOwn(input || {}, key)) {
      output[key === "price" ? "sellingPrice" : key] = input[key];
    }
  });
  return output;
}

function createId(prefix) {
  return `${prefix}_${randomUUID()}`;
}

function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "item";
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}
