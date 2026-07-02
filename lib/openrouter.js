const OPENROUTER_IMAGE_URL = "https://openrouter.ai/api/v1/images";
const IMAGE_STYLES = new Set(["auto", "whole", "bunch", "cut", "prepared"]);

export async function generateProductImage({ config, product, size, quality, outputFormat, background }) {
  if (!config.openRouterApiKey) {
    const error = new Error("OPENROUTER_API_KEY is missing. Add it to .env.local and restart the server.");
    error.status = 503;
    throw error;
  }

  const model = config.openRouterImageModel;
  const finalPrompt = buildProductPrompt({
    productName: product.name,
    unit: product.unit,
    category: product.category,
    imageStyle: product.imageStyle
  });

  const response = await fetch(OPENROUTER_IMAGE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.openRouterApiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": config.publicBaseUrl,
      "X-Title": "Store Poster Maker"
    },
    body: JSON.stringify(buildImageRequestBody({
      model,
      prompt: finalPrompt,
      size,
      quality,
      outputFormat,
      background
    }))
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(result?.error?.message || `OpenRouter image generation failed with status ${response.status}.`);
    error.status = response.status;
    error.providerResponse = result;
    throw error;
  }

  const image = result?.data?.find((item) => item?.b64_json);
  if (!image?.b64_json) {
    const error = new Error("OpenRouter did not return an image.");
    error.status = 502;
    error.providerResponse = result;
    throw error;
  }

  const mediaType = image.media_type || mediaTypeFromFormat(sanitizeOutputFormat(outputFormat));

  return {
    buffer: Buffer.from(image.b64_json, "base64"),
    mediaType,
    extension: extensionFromMediaType(mediaType),
    prompt: finalPrompt,
    model,
    quality: sanitizeQuality(quality),
    providerResponse: {
      usage: result.usage || null,
      id: result.id || null
    },
    estimatedCost: Number(result?.usage?.cost || 0) || null
  };
}

function buildImageRequestBody({ model, prompt, size, quality, outputFormat, background }) {
  const body = {
    model,
    prompt,
    n: 1
  };

  if (isGeminiImageModel(model)) {
    body.resolution = "1K";
    body.aspect_ratio = "1:1";
    return body;
  }

  body.size = sanitizeSize(size);
  body.quality = sanitizeQuality(quality);
  body.output_format = sanitizeOutputFormat(outputFormat);
  body.background = sanitizeBackground(background);
  return body;
}

function isGeminiImageModel(model) {
  return String(model || "").startsWith("google/gemini-") && String(model || "").includes("image");
}

function buildProductPrompt({ productName, unit, category, imageStyle }) {
  const productContext = [productName, unit, category].filter(Boolean).join(", ");
  const resolvedStyle = resolveProductImageStyle({ productName, unit, category, imageStyle });

  return [
    `Create a photorealistic supermarket product cutout for the exact product name: ${productName}.`,
    `Product context: ${productContext}.`,
    `The generated image must visually match "${productName}" and not a different grocery item.`,
    `Presentation style: ${styleLabel(resolvedStyle)}.`,
    styleInstruction(resolvedStyle, productName),
    "Use true-to-life fresh grocery photography with natural color, visible texture, realistic shape, and soft studio lighting.",
    "Center the product as a clean isolated cutout on a transparent or pure white background.",
    "Show only the product itself, fully visible, with a little margin around it.",
    "Do not include text, numbers, price labels, brand logos, watermarks, hands, people, shelves, baskets, plates, props, or packaging unless the product is normally sold packaged."
  ]
    .filter(Boolean)
    .join(" ");
}

function resolveProductImageStyle({ productName, unit, category, imageStyle }) {
  const selectedStyle = sanitizeImageStyle(imageStyle);
  if (selectedStyle !== "auto") return selectedStyle;

  const text = normalizeStyleText([productName, unit, category].filter(Boolean).join(" "));

  if (/\b(peeled|cut|sliced|slice|stem|box|pkt|packet|pack)\b/.test(text) || /\b\d+\s*pc\s*box\b/.test(text)) {
    return "prepared";
  }

  if (/\b(pumpkin|red dragon|dragon fruit|pineapple)\b/.test(text)) {
    return "cut";
  }

  if (/\b(tomato|chilli|chili|baby potato|arbi|garlic|mushroom|brinjal gundu|brinjal long|long beans|beans|kovakka|raw banana|apple ber|kiwi|citrus|mosambi|lemon)\b/.test(text)) {
    return "bunch";
  }

  return "whole";
}

function styleInstruction(style, productName) {
  if (style === "bunch") {
    return `Show a natural bunch or small group of multiple ${productName} pieces, arranged compactly for a grocery poster; for citrus, lemon, or mosambi, one cut half may be included if it improves recognition.`;
  }
  if (style === "cut") {
    return `Show a clean cut or half view of ${productName} that reveals the inside texture, with one whole piece only if it helps identification.`;
  }
  if (style === "prepared") {
    return `Show ${productName} in the normal prepared retail form, such as peeled cloves, a trimmed stem piece, a simple packet, or a small box only when the unit or name implies it; keep any packaging plain and unbranded.`;
  }
  return `Show one full whole ${productName}, not cut or sliced, as a clean realistic supermarket produce item.`;
}

function styleLabel(style) {
  const labels = {
    whole: "whole single item",
    bunch: "bunch or grouped items",
    cut: "cut or half view",
    prepared: "prepared or packaged retail item"
  };
  return labels[style] || labels.whole;
}

function sanitizeImageStyle(value) {
  return IMAGE_STYLES.has(value) ? value : "auto";
}

function normalizeStyleText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeSize(value) {
  return ["1024x1024", "1024x1536", "1536x1024", "auto"].includes(value) ? value : "1024x1024";
}

function sanitizeQuality(value) {
  return ["auto", "low", "medium", "high"].includes(value) ? value : "low";
}

function sanitizeOutputFormat(value) {
  return ["png", "jpeg", "webp"].includes(value) ? value : "png";
}

function sanitizeBackground(value) {
  return ["auto", "transparent", "opaque"].includes(value) ? value : "transparent";
}

function mediaTypeFromFormat(format) {
  if (format === "jpeg") return "image/jpeg";
  if (format === "webp") return "image/webp";
  return "image/png";
}

function extensionFromMediaType(mediaType) {
  if (mediaType.includes("jpeg") || mediaType.includes("jpg")) return "jpg";
  if (mediaType.includes("webp")) return "webp";
  return "png";
}
