const OPENROUTER_IMAGE_URL = "https://openrouter.ai/api/v1/images";

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
    category: product.category
  });

  const response = await fetch(OPENROUTER_IMAGE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.openRouterApiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": config.publicBaseUrl,
      "X-Title": "Store Poster Maker"
    },
    body: JSON.stringify({
      model,
      prompt: finalPrompt,
      n: 1,
      size: sanitizeSize(size),
      quality: sanitizeQuality(quality),
      output_format: sanitizeOutputFormat(outputFormat),
      background: sanitizeBackground(background)
    })
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

function buildProductPrompt({ productName, unit, category }) {
  const productContext = [productName, unit, category].filter(Boolean).join(", ");

  return [
    `Create a photorealistic supermarket product cutout for the exact product name: ${productName}.`,
    `Product context: ${productContext}.`,
    `The generated image must visually match "${productName}" and not a different grocery item.`,
    "Use true-to-life fresh grocery photography with natural color, visible texture, realistic shape, and soft studio lighting.",
    "Center the product as a clean isolated cutout on a transparent or pure white background.",
    "Show only the product itself, fully visible, with a little margin around it.",
    "Do not include text, numbers, price labels, brand logos, watermarks, hands, people, shelves, baskets, plates, props, or packaging unless the product is normally sold packaged."
  ]
    .filter(Boolean)
    .join(" ");
}

function sanitizeSize(value) {
  return ["1024x1024", "1024x1536", "1536x1024", "auto"].includes(value) ? value : "1024x1024";
}

function sanitizeQuality(value) {
  return ["auto", "low", "medium", "high"].includes(value) ? value : "high";
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
