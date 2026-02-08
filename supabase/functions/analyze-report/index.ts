import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { reportId, fileBase64, fileName, fileType } = await req.json();
    if (!reportId || !fileBase64) throw new Error("Missing reportId or file data");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const isImage = fileType?.startsWith("image/");

    const systemPrompt = `You are a medical report interpreter AI. Your job is to analyze medical reports and prescriptions and explain them in simple, easy-to-understand language for patients.

IMPORTANT RULES:
- NEVER provide medical diagnosis or treatment advice
- Always recommend consulting a doctor
- Use simple, non-technical language
- Be empathetic and reassuring in tone
- Highlight abnormal values clearly

You MUST respond using the suggest_analysis tool.`;

    const userContent: any[] = [
      {
        type: "text",
        text: `Please analyze this medical document (${fileName}). Extract all test results, medicines, and provide a complete analysis.`
      }
    ];

    if (isImage) {
      const mimeType = fileType || "image/jpeg";
      userContent.push({
        type: "image_url",
        image_url: { url: `data:${mimeType};base64,${fileBase64}` }
      });
    } else {
      // For PDFs, send as text instruction with base64
      userContent.push({
        type: "text",
        text: `[This is a PDF document encoded in base64. Please extract and analyze the medical content.]\n\nBase64 content (first 50000 chars): ${fileBase64.substring(0, 50000)}`
      });
    }

    console.log("Calling AI gateway for report analysis...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_analysis",
              description: "Return the structured medical report analysis",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string", description: "A one-paragraph simplified summary of the report in plain language" },
                  keyFindings: { type: "array", items: { type: "string" }, description: "3-6 bullet point key findings" },
                  riskLevel: { type: "string", enum: ["low", "medium", "high"], description: "Overall risk classification" },
                  riskExplanation: { type: "string", description: "Brief explanation of the risk level" },
                  testResults: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        value: { type: "string" },
                        unit: { type: "string" },
                        referenceRange: { type: "string" },
                        abnormal: { type: "boolean" },
                        explanation: { type: "string", description: "Simple explanation of what this test means" }
                      },
                      required: ["name", "value", "abnormal", "explanation"]
                    }
                  },
                  medicines: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        purpose: { type: "string" },
                        usage: { type: "string" },
                        sideEffects: { type: "string" },
                        warning: { type: "string" }
                      },
                      required: ["name", "purpose", "usage"]
                    }
                  },
                  doctorQuestions: { type: "array", items: { type: "string" }, description: "4-5 questions patient should ask their doctor" }
                },
                required: ["summary", "keyFindings", "riskLevel", "riskExplanation", "testResults", "medicines", "doctorQuestions"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_analysis" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) throw new Error("Rate limit exceeded. Please try again in a moment.");
      if (aiResponse.status === 402) throw new Error("AI credits exhausted. Please add credits.");
      throw new Error("AI analysis failed");
    }

    const aiData = await aiResponse.json();
    console.log("AI response received");

    let analysis;
    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        analysis = JSON.parse(toolCall.function.arguments);
      } else {
        throw new Error("No tool call in response");
      }
    } catch (parseErr) {
      console.error("Parse error:", parseErr);
      throw new Error("Failed to parse AI response");
    }

    // Update report with analysis
    const { error: updateError } = await supabase.from("reports").update({
      analysis,
      status: "completed"
    }).eq("id", reportId).eq("user_id", user.id);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error("Failed to save analysis");
    }

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
