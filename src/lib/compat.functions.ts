import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const Input = z.object({ conversationId: z.string().uuid() });

export const generateCompatibilityReport = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => Input.parse(raw))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // check if report already exists
    const { data: existing } = await supabaseAdmin.from("compatibility_reports").select("id").eq("conversation_id", data.conversationId).maybeSingle();
    if (existing) return { ok: true, cached: true };

    const { data: convo } = await supabaseAdmin.from("conversations").select("founder_a_id, founder_b_id").eq("id", data.conversationId).maybeSingle();
    if (!convo) throw new Error("Conversation not found");

    const [a, b] = await Promise.all([convo.founder_a_id, convo.founder_b_id].map(async (id) => {
      const { data: f } = await supabaseAdmin.from("founders").select("seed_name, headline, background, skills, commitment, equity_offer, exit_vision, user_id").eq("id", id).maybeSingle();
      const { data: p } = f?.user_id ? await supabaseAdmin.from("profiles").select("full_name").eq("id", f.user_id).maybeSingle() : { data: null };
      const { data: assess } = await supabaseAdmin.from("assessments").select("raw_answers, openness_score, conscientiousness_score, extraversion_score, agreeableness_score, neuroticism_score, risk_score, decision_velocity_score, equity_philosophy_score, vision_score").eq("founder_id", id).maybeSingle();
      return { name: p?.full_name ?? f?.seed_name ?? "Founder", founder: f, assessment: assess };
    }));

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const system = `You are a co-founder compatibility analyst for an Indian startup platform. Return ONLY valid minified JSON (no markdown fences). Shape:
{"compatibility_score": <int 0-100>, "rationale_summary": "<2-3 sentences>", "alignment_points": ["...","...","..."], "divergence_points": ["...","..."], "risk_flags": ["..."], "conversation_starters": ["...","...","..."]}

Rules: Score reflects complementarity, not similarity. Never say "guaranteed", "perfect match", or "incompatible". All strings under 120 chars. Indian startup context.`;

    const user = `Founder A: ${a.name}, ${a.founder?.background}, Skills: ${a.founder?.skills?.join(", ")}, Commitment: ${a.founder?.commitment}, Equity: ${a.founder?.equity_offer}, Exit: ${a.founder?.exit_vision}. Assessment: ${JSON.stringify(a.assessment)}

Founder B: ${b.name}, ${b.founder?.background}, Skills: ${b.founder?.skills?.join(", ")}, Commitment: ${b.founder?.commitment}, Equity: ${b.founder?.equity_offer}, Exit: ${b.founder?.exit_vision}. Assessment: ${JSON.stringify(b.assessment)}

Generate the compatibility report.`;

    let parsed: {
      compatibility_score: number;
      rationale_summary: string;
      alignment_points: string[];
      divergence_points: string[];
      risk_flags: string[];
      conversation_starters: string[];
    } | null = null;

    try {
      const { text } = await generateText({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });
      const cleaned = text.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("AI report failed", e);
      parsed = null;
    }

    if (!parsed) {
      await supabaseAdmin.from("compatibility_reports").insert({
        conversation_id: data.conversationId,
        compatibility_score: null,
        rationale_summary: "Report is still generating. Please refresh in a moment.",
        alignment_points: [], divergence_points: [], risk_flags: [], conversation_starters: [],
      });
      return { ok: false };
    }

    await supabaseAdmin.from("compatibility_reports").insert({
      conversation_id: data.conversationId,
      compatibility_score: parsed.compatibility_score,
      rationale_summary: parsed.rationale_summary,
      alignment_points: parsed.alignment_points,
      divergence_points: parsed.divergence_points,
      risk_flags: parsed.risk_flags,
      conversation_starters: parsed.conversation_starters,
    });
    return { ok: true, cached: false };
  });
