import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ImageAnalysisResult {
  description: string;
  extractedText: string;
  keywords: string[];
  sentiment: "positive" | "negative" | "neutral";
  sentimentScore: number;
  keyTopics: string[];
}

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { documentId, imageBase64, fileName } = body;

    // Validate documentId
    if (!documentId || typeof documentId !== 'string' || !UUID_REGEX.test(documentId)) {
      return new Response(JSON.stringify({ error: "Invalid documentId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return new Response(JSON.stringify({ error: "Missing image data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sanitizedFileName = (fileName || "image")
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
      .replace(/[<>"'&]/g, '')
      .slice(0, 255);

    console.log(`Analyzing image: ${sanitizedFileName}`);

    // Call Lovable AI for image analysis with vision capability
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
            content: `You are an image analysis expert. Analyze the provided image and extract:
1. A detailed description of the image content (2-3 paragraphs)
2. Any visible text in the image (OCR)
3. 5-10 relevant keywords
4. Overall sentiment/mood (positive, negative, or neutral)
5. Sentiment score (-1 to 1)
6. 3-5 key topics or themes

Respond ONLY with valid JSON in this exact format:
{
  "description": "...",
  "extractedText": "any text visible in the image, or empty string if none",
  "keywords": ["keyword1", "keyword2", ...],
  "sentiment": "positive" | "negative" | "neutral",
  "sentimentScore": 0.5,
  "keyTopics": ["topic1", "topic2", ...]
}`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this image named "${sanitizedFileName}" and provide detailed analysis including any text visible (OCR).`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`
                }
              }
            ]
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
    let analysis: ImageAnalysisResult;
    try {
      let jsonStr = aiContent;
      const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      const parsed = JSON.parse(jsonStr.trim());
      analysis = {
        description: parsed.description || "No description available",
        extractedText: parsed.extractedText || "",
        keywords: parsed.keywords || [],
        sentiment: parsed.sentiment || "neutral",
        sentimentScore: typeof parsed.sentimentScore === "number" ? parsed.sentimentScore : 0,
        keyTopics: parsed.keyTopics || [],
      };
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError, aiContent);
      analysis = {
        description: aiContent.substring(0, 500),
        extractedText: "",
        keywords: [],
        sentiment: "neutral",
        sentimentScore: 0,
        keyTopics: [],
      };
    }

    // Calculate word count from extracted text + description
    const combinedText = `${analysis.description} ${analysis.extractedText}`;
    const wordCount = combinedText.trim().split(/\s+/).filter((w: string) => w.length > 0).length;
    const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

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

    // Insert analysis - use description as summary for images
    const { data: analysisData, error: insertError } = await supabase
      .from("document_analyses")
      .insert({
        document_id: documentId,
        organization_id: doc.organization_id,
        summary: `${analysis.description}\n\n${analysis.extractedText ? `**Extracted Text:**\n${analysis.extractedText}` : ''}`,
        keywords: analysis.keywords,
        sentiment: analysis.sentiment,
        sentiment_score: analysis.sentimentScore,
        word_count: wordCount,
        reading_time_minutes: readingTimeMinutes,
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

    // Update documents_used count
    await supabase.rpc("increment_documents_used", { org_id: doc.organization_id });

    console.log("Image analysis completed successfully:", analysisData?.id);

    return new Response(JSON.stringify({ 
      success: true, 
      analysis: analysisData,
      ...analysis 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in analyze-image:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});