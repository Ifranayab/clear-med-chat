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

    const systemPrompt = `You are a medical report interpreter AI. Analyze medical documents and explain them in simple, patient-friendly language.

STEP 1 - DETECT REPORT TYPE using these rules:
- Blood Report: keywords like Hemoglobin, WBC, Platelet, SGPT, SGOT, RBC, CBC, LFT, KFT, Normal Range, Reference Range
- Prescription: patterns like Tab, Cap, Syr, OD, BD, TDS, mg, ml, Rx
- Ultrasound/X-Ray: keywords like USG, Ultrasound, X-ray, Findings, Impression, Grade, Sonography
- Otherwise: Clinical/Discharge report

STEP 2 - ANALYZE based on detected type and return structured data via the tool.

RULES:
- NEVER provide medical diagnosis or treatment advice
- Always recommend consulting a doctor
- Use simple, non-technical language
- Be empathetic and reassuring
- Highlight abnormal values clearly
- For prescriptions, explain how to take each medicine (morning/night, before/after food)
- For imaging, explain findings in plain language

You MUST respond using the suggest_analysis tool.`;

    const userContent: any[] = [
      {
        type: "text",
        text: `Analyze this medical document (${fileName}). First detect the report type, then provide a complete analysis.`
      }
    ];

    if (isImage) {
      const mimeType = fileType || "image/jpeg";
      userContent.push({
        type: "image_url",
        image_url: { url: `data:${mimeType};base64,${fileBase64}` }
      });
    } else {
      userContent.push({
        type: "text",
        text: `[PDF document base64 - first 50000 chars]: ${fileBase64.substring(0, 50000)}`
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
                  detectedType: {
                    type: "string",
                    enum: ["blood", "prescription", "imaging", "general"],
                    description: "The detected report type"
                  },
                  summary: { type: "string", description: "One-paragraph simplified summary in plain language" },
                  keyFindings: { type: "array", items: { type: "string" }, description: "3-6 bullet point key findings" },
                  keyTakeaways: { type: "array", items: { type: "string" }, description: "Key takeaways for clinical/discharge reports" },
                  riskLevel: { type: "string", enum: ["low", "medium", "high"], description: "Risk level for blood reports" },
                  riskExplanation: { type: "string", description: "Brief explanation of the risk level" },
                  severityLevel: { type: "string", enum: ["mild", "moderate", "severe"], description: "Severity for imaging reports" },
                  severityExplanation: { type: "string", description: "Brief explanation of severity" },
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
                        explanation: { type: "string" }
                      },
                      required: ["name", "value", "abnormal", "explanation"]
                    },
                    description: "For blood reports"
                  },
                  findings: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        finding: { type: "string" },
                        explanation: { type: "string" },
                        abnormal: { type: "boolean" }
                      },
                      required: ["finding", "explanation", "abnormal"]
                    },
                    description: "For imaging reports"
                  },
                  diagnosisTerms: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        term: { type: "string" },
                        explanation: { type: "string" }
                      },
                      required: ["term", "explanation"]
                    },
                    description: "For clinical/discharge reports"
                  },
                  medicines: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        purpose: { type: "string" },
                        usage: { type: "string", description: "How to take: morning/night, before/after food, dosage" },
                        sideEffects: { type: "string" },
                        warning: { type: "string" }
                      },
                      required: ["name", "purpose", "usage"]
                    }
                  },
                  doctorQuestions: { type: "array", items: { type: "string" }, description: "4-5 questions to ask doctor" },
                  emergencyWarning: { type: "string", description: "Emergency warning for critical values, if any" }
                },
                required: ["detectedType", "summary", "keyFindings", "medicines", "doctorQuestions"]
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

    const detectedType = analysis.detectedType || "general";

    // Update report with analysis and detected type
    const { error: updateError } = await supabase.from("reports").update({
      analysis,
      status: "completed",
      report_type: detectedType,
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
