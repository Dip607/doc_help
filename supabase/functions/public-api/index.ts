import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Validate analyze request input
function validateAnalyzeInput(body: unknown): { content: string; title: string } | { error: string } {
  if (!body || typeof body !== 'object') {
    return { error: "Invalid request body" };
  }

  const { content, title } = body as Record<string, unknown>;

  // Validate content
  if (!content || typeof content !== 'string') {
    return { error: "Missing content field" };
  }
  if (content.length === 0) {
    return { error: "Content cannot be empty" };
  }
  if (content.length > 100000) { // 100KB limit
    return { error: "Content too large (max 100KB)" };
  }

  // Count words and enforce limit
  const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount > 10000) {
    return { error: `Content too long (max 10000 words, received ${wordCount})` };
  }

  // Validate title - optional but must be string if provided
  let sanitizedTitle = "Untitled";
  if (title !== undefined) {
    if (typeof title !== 'string') {
      return { error: "Title must be a string" };
    }
    if (title.length > 255) {
      return { error: "Title too long (max 255 characters)" };
    }
    // Sanitize title
    sanitizedTitle = title
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
      .replace(/[<>"'&]/g, '')
      .slice(0, 255);
  }

  // Sanitize content
  const sanitizedContent = content
    .replace(/\x00/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

  return {
    content: sanitizedContent,
    title: sanitizedTitle
  };
}

// Validate API key format (basic check for SQL injection prevention)
function isValidApiKeyFormat(key: string): boolean {
  // API keys should be alphanumeric with possible dashes/underscores
  // Reject anything that looks like SQL injection
  if (key.length > 256) return false;
  if (/['";]/.test(key) || key.includes('--')) return false;
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get API key from header
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return new Response(JSON.stringify({ 
        error: "Missing API key", 
        message: "Include your API key in the x-api-key header" 
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate API key format
    if (!isValidApiKeyFormat(apiKey)) {
      return new Response(JSON.stringify({ error: "Invalid API key format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Hash the key to compare with stored hash
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    // Validate API key
    const { data: apiKeyData, error: keyError } = await supabase
      .from("api_keys")
      .select("*, organizations!inner(id, name), subscriptions!inner(plan, api_calls_used, api_calls_limit)")
      .eq("key_hash", keyHash)
      .eq("is_active", true)
      .single();

    if (keyError || !apiKeyData) {
      return new Response(JSON.stringify({ error: "Invalid API key" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if Pro plan
    if (apiKeyData.subscriptions.plan !== "pro") {
      return new Response(JSON.stringify({ 
        error: "API access requires Pro plan",
        upgrade_url: "/settings/subscription"
      }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check rate limit
    if (apiKeyData.subscriptions.api_calls_used >= apiKeyData.subscriptions.api_calls_limit) {
      return new Response(JSON.stringify({ 
        error: "API rate limit exceeded",
        used: apiKeyData.subscriptions.api_calls_used,
        limit: apiKeyData.subscriptions.api_calls_limit
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update API key usage
    await supabase
      .from("api_keys")
      .update({ 
        last_used_at: new Date().toISOString(),
        calls_count: apiKeyData.calls_count + 1
      })
      .eq("id", apiKeyData.id);

    // Increment API calls used
    await supabase
      .from("subscriptions")
      .update({ api_calls_used: apiKeyData.subscriptions.api_calls_used + 1 })
      .eq("organization_id", apiKeyData.organization_id);

    // Parse URL for endpoint
    const url = new URL(req.url);
    const endpoint = url.pathname.replace("/public-api", "");

    // Route to appropriate handler
    if (req.method === "POST" && endpoint === "/analyze") {
      return handleAnalyze(req, apiKeyData.organization_id, supabase);
    }

    if (req.method === "GET" && endpoint === "/documents") {
      return handleListDocuments(apiKeyData.organization_id, supabase);
    }

    if (req.method === "GET" && endpoint.startsWith("/documents/")) {
      const docId = endpoint.replace("/documents/", "");
      // Validate document ID format
      if (!UUID_REGEX.test(docId)) {
        return new Response(JSON.stringify({ error: "Invalid document ID format" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return handleGetDocument(docId, apiKeyData.organization_id, supabase);
    }

    return new Response(JSON.stringify({ 
      error: "Not found",
      available_endpoints: [
        "POST /analyze - Analyze text content",
        "GET /documents - List all documents",
        "GET /documents/:id - Get document with analysis"
      ]
    }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("API error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleAnalyze(req: Request, orgId: string, supabase: any) {
  // Parse and validate input
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const validationResult = validateAnalyzeInput(body);
  if ('error' in validationResult) {
    return new Response(JSON.stringify({ error: validationResult.error }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { content, title } = validationResult;

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "AI service not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Calculate basic stats
  const words = content.trim().split(/\s+/).filter((w: string) => w.length > 0);
  const wordCount = words.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Call Lovable AI
  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `Analyze the document and return JSON with: summary, keywords (array), sentiment (positive/negative/neutral), sentimentScore (-1 to 1), keyTopics (array). Only return valid JSON.`
        },
        {
          role: "user",
          content: `Analyze: ${content.substring(0, 10000)}`
        }
      ],
    }),
  });

  if (!aiResponse.ok) {
    return new Response(JSON.stringify({ error: "AI analysis failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const aiData = await aiResponse.json();
  const aiContent = aiData.choices?.[0]?.message?.content;

  let analysis;
  try {
    let jsonStr = aiContent;
    const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1];
    analysis = JSON.parse(jsonStr.trim());
  } catch {
    analysis = { summary: aiContent, keywords: [], sentiment: "neutral", sentimentScore: 0, keyTopics: [] };
  }

  return new Response(JSON.stringify({
    title,
    wordCount,
    readingTimeMinutes,
    ...analysis
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleListDocuments(orgId: string, supabase: any) {
  const { data, error } = await supabase
    .from("documents")
    .select("id, name, file_type, created_at")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch documents" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ documents: data }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleGetDocument(docId: string, orgId: string, supabase: any) {
  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("*")
    .eq("id", docId)
    .eq("organization_id", orgId)
    .single();

  if (docError || !doc) {
    return new Response(JSON.stringify({ error: "Document not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: analyses } = await supabase
    .from("document_analyses")
    .select("*")
    .eq("document_id", docId)
    .order("version", { ascending: false });

  return new Response(JSON.stringify({ 
    document: doc,
    analyses: analyses || []
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
