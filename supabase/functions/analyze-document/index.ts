import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnalysisResult {
  summary: string;
  keywords: string[];
  sentiment: "positive" | "negative" | "neutral";
  sentimentScore: number;
  wordCount: number;
  readingTimeMinutes: number;
  keyTopics: string[];
}

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Input validation function
function validateInput(body: unknown): { documentId: string; content: string; fileName: string } | { error: string } {
  if (!body || typeof body !== 'object') {
    return { error: "Invalid request body" };
  }

  const { documentId, content, fileName } = body as Record<string, unknown>;

  // Validate documentId - must be a valid UUID
  if (!documentId || typeof documentId !== 'string') {
    return { error: "Missing documentId" };
  }
  if (!UUID_REGEX.test(documentId)) {
    return { error: "Invalid documentId format - must be a valid UUID" };
  }

  // Validate content - must be a non-empty string with size limits
  if (!content || typeof content !== 'string') {
    return { error: "Missing content" };
  }
  if (content.length === 0) {
    return { error: "Content cannot be empty" };
  }
  if (content.length > 1000000) { // 1MB limit
    return { error: "Content too large (max 1MB)" };
  }

  // Validate fileName - sanitize for log safety
  let sanitizedFileName = "unknown";
  if (fileName && typeof fileName === 'string') {
    // Remove any control characters and limit length for safe logging
    sanitizedFileName = fileName
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
      .replace(/[<>"'&]/g, '') // Remove potential injection chars
      .slice(0, 255); // Limit length
  }

  // Sanitize content - remove null bytes and control characters
  const sanitizedContent = content
    .replace(/\x00/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ''); // Keep newlines and tabs

  return {
    documentId,
    content: sanitizedContent,
    fileName: sanitizedFileName
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const validationResult = validateInput(body);
    if ('error' in validationResult) {
      return new Response(JSON.stringify({ error: validationResult.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { documentId, content, fileName } = validationResult;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate basic stats
    const words = content.trim().split(/\s+/).filter((w: string) => w.length > 0);
    const wordCount = words.length;
    const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

    console.log(`Analyzing document: ${fileName}, ${wordCount} words`);

    // Call Lovable AI for analysis
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
            content: `You are a document analysis expert. Analyze the provided document and extract:
1. A concise summary (2-3 paragraphs)
2. 5-10 important keywords
3. Overall sentiment (positive, negative, or neutral)
4. Sentiment score (-1 to 1, where -1 is very negative, 0 is neutral, 1 is very positive)
5. 3-5 key topics discussed

Respond ONLY with valid JSON in this exact format:
{
  "summary": "...",
  "keywords": ["keyword1", "keyword2", ...],
  "sentiment": "positive" | "negative" | "neutral",
  "sentimentScore": 0.5,
  "keyTopics": ["topic1", "topic2", ...]
}`
          },
          {
            role: "user",
            content: `Analyze this document titled "${fileName}":\n\n${content.substring(0, 15000)}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;

    if (!aiContent) {
      console.error("No content in AI response");
      return new Response(JSON.stringify({ error: "AI returned empty response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse AI response
    let analysis: AnalysisResult;
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = aiContent;
      const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      const parsed = JSON.parse(jsonStr.trim());
      analysis = {
        summary: parsed.summary || "No summary available",
        keywords: parsed.keywords || [],
        sentiment: parsed.sentiment || "neutral",
        sentimentScore: typeof parsed.sentimentScore === "number" ? parsed.sentimentScore : 0,
        keyTopics: parsed.keyTopics || [],
        wordCount,
        readingTimeMinutes,
      };
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError, aiContent);
      // Fallback analysis
      analysis = {
        summary: aiContent.substring(0, 500),
        keywords: [],
        sentiment: "neutral",
        sentimentScore: 0,
        keyTopics: [],
        wordCount,
        readingTimeMinutes,
      };
    }

    // Store analysis in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get document to find org_id
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("organization_id")
      .eq("id", documentId)
      .single();

    if (docError || !doc) {
      console.error("Document not found:", docError);
      return new Response(JSON.stringify({ error: "Document not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get current version count
    const { count } = await supabase
      .from("document_analyses")
      .select("*", { count: "exact", head: true })
      .eq("document_id", documentId);

    const version = (count || 0) + 1;

    // Insert analysis
    const { data: analysisData, error: insertError } = await supabase
      .from("document_analyses")
      .insert({
        document_id: documentId,
        organization_id: doc.organization_id,
        summary: analysis.summary,
        keywords: analysis.keywords,
        sentiment: analysis.sentiment,
        sentiment_score: analysis.sentimentScore,
        word_count: analysis.wordCount,
        reading_time_minutes: analysis.readingTimeMinutes,
        key_topics: analysis.keyTopics,
        version,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to save analysis:", insertError);
      return new Response(JSON.stringify({ error: "Failed to save analysis" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update documents_used count in subscription
    await supabase.rpc("increment_documents_used", { org_id: doc.organization_id });

    console.log("Analysis completed successfully:", analysisData?.id);

    return new Response(JSON.stringify({ 
      success: true, 
      analysis: analysisData,
      ...analysis 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in analyze-document:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
