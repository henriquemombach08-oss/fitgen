import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { WorkoutFormData, Workout } from "@/types/workout";

// ─── Sports science knowledge base ────────────────────────────────────────────

const SYSTEM_PROMPT = `Você é um personal trainer certificado (CSCS) e fisiologista do exercício com 26 anos de experiência. Treinou atletas do nível iniciante absoluto até fisiculturistas e powerlifters profissionais.

Seu conhecimento inclui:
- Periodização linear, ondulada (DUP) e por blocos (acumulação/intensificação/realização)
- Volumes por grupo muscular baseados em Renaissance Periodization (MEV/MAV/MRV)
- Biomecânica e seleção de exercícios por tensão no alongamento (stretch-mediated hypertrophy)
- Técnicas avançadas: drop sets, rest-pause, cluster sets, myo-reps, giant sets, BFR, pre-exhaustion, supersets agonista-antagonista
- Prescrição baseada em RPE (Rate of Perceived Exertion) e RIR (Reps In Reserve)
- Especificidades de bodybuilding (separação muscular, pose, pump sets) e powerlifting (RPE-based, conjugado)

SEMPRE responda exclusivamente com JSON válido, sem markdown nem texto adicional.`;

function levelProfile(level: string): string {
  const profiles: Record<string, string> = {
    "Iniciante": `
NÍVEL INICIANTE (0-1 ano):
• Prioridade absoluta: aprendizado motor e padrões de movimento fundamentais
• Movimentos base: squat, hip hinge, press horizontal/vertical, pull horizontal/vertical, carry
• Volume: 2-3 séries por exercício, 10-15 repetições, carga moderada
• Descanso: 90-120 segundos (sistema neuromuscular em adaptação)
• Exercícios preferidos: máquinas guiadas, halteres, movimentos bilaterais
• PROIBIDO: técnicas avançadas, falha muscular, alta complexidade técnica
• Progressão: linear simples — adicionar peso a cada 1-2 sessões é possível e necessário
• Exemplos corretos: leg press, supino na máquina, lat pulldown, remada baixa no cabo, desenvolvimento com halteres`,

    "Intermediário": `
NÍVEL INTERMEDIÁRIO (1-3 anos):
• Progressão linear começa a estagnar — iniciar periodização simples (volume x intensidade)
• Volume: 3-4 séries, faixas de 8-12 reps (hipertrofia) ou 4-6 (força)
• Começar exercícios unilaterais para corrigir desequilíbrios: lunges, single-leg RDL, dumbbell row
• Supersets agonista-antagonista são seguros e eficientes (peito+costas, bíceps+tríceps)
• Pode introduzir drop sets simples (1 drop) e pré-esgotamento isolado→composto
• Frequência mínima: 2x/semana por grupo muscular
• Exercícios avançados com boa técnica: agachamento com barra, levantamento terra, supino com barra, overhead press`,

    "Avançado": `
NÍVEL AVANÇADO (3-5+ anos):
• Periodização por blocos obrigatória — o músculo já se adaptou ao estresse básico
• Volume no MAV (Maximum Adaptive Volume): 16-22 séries/músculo/semana mínimo
• Todas as técnicas de intensificação são bem-vindas e necessárias para continuar progredindo:
  Drop sets, rest-pause, cluster sets, myo-reps, giant sets, supersets de pré-esgotamento
• Alta frequência: 2-3x/semana por grupo muscular para músculos lagging
• Exercícios unilaterais pesados, variações com tempo (eccentric 4-6s), isometria
• BFR (Blood Flow Restriction) para finalizar séries com menor fadiga sistêmica
• Deloads planejados a cada 4-6 semanas para evitar overreaching`,

    "Atleta / Competidor": `
NÍVEL ATLETA / COMPETIDOR (5+ anos, nível competitivo):
• Volume no MRV (Maximum Recoverable Volume): 20-30+ séries/músculo/semana em fases de acumulação
• BODYBUILDING/FISICULTURISMO:
  - Foco em isolamento, ângulos variados, separação muscular e definição
  - Divisões: Bro Split clássico, PPL x2, especialização ultra-específica
  - Técnicas obrigatórias: pré-esgotamento, myo-reps, giant sets finalizadores, BFR
  - Fase offseason: volume máximo, cargas progressivas, exercícios compostos pesados
  - Fase contest prep: densidade alta, 45-60s descanso, pump sets, cardio HIIT integrado
  - Exercícios de "posing muscles": lat spread, vacuum, rear double bicep specifics
• POWERLIFTING:
  - Squat, Bench Press e Deadlift são os exercícios base obrigatórios
  - Periodização RPE-based (trabalhar a 8-9 RPE em compostos) ou método conjugado
  - Acessórios específicos: good morning, box squat, board press, deficit deadlift, pause squat
  - Fases de pico: reduzir volume, aumentar intensidade até 95-100% 1RM
• Deloads estratégicos a cada 3-5 semanas
• Pode trabalhar cabeças musculares específicas: deltóide anterior/lateral/posterior, cabeça longa/curta do bíceps`,
  };
  return profiles[level] ?? profiles["Intermediário"];
}

function goalProfile(goals: string[]): string {
  const profiles: Record<string, string> = {
    "Hipertrofia": "65-80% 1RM | 6-20 reps (ótimo 8-15) | 1-3 RIR | 60-120s descanso | Tensão mecânica + estresse metabólico + dano muscular | Priorizar exercícios em alongamento",
    "Força": "75-97% 1RM | 1-5 reps | 3-5 min descanso | Movimentos compostos multi-articulares | Progressão de carga prioritária | Squat, Deadlift, Bench, OHP como base",
    "Powerlifting": "Squat + Bench + Deadlift obrigatórios | 75-97% 1RM | RPE 7-9 nos compostos | Acessórios específicos de força | 3-5 min descanso | Periodização de pico nas últimas semanas",
    "Potência": "30-70% 1RM | 1-5 reps EXPLOSIVAS | 3-5 min descanso | Movimentos olímpicos (limpo, snatch), pliométricos, saltos | Velocidade de barra máxima na fase concêntrica",
    "Resistência": "50-65% 1RM | 15-30 reps | 30-60s descanso | Circuitos metabólicos | Alta densidade de treino | Pode incorporar EMOM e AMRAP",
    "Emagrecimento": "Circuit training + compostos multiarticulares | 12-15 reps | 45-60s descanso | Maior gasto calórico por sessão | Supersets para aumentar EPOC | Déficit calórico implícito no contexto",
    "Recomposição Corporal": "70-80% 1RM | 8-15 reps | 60-90s descanso | Mix de compostos (força) + isolados (hipertrofia) | Preservar massa muscular em déficit calórico moderado | Alta proteína implícita",
    "Contest Prep / Definição": "Alta densidade de treino | 10-20 reps | 45-75s descanso | Ênfase em pump e separação muscular | Supersets e giant sets para maximizar queima calórica | BFR para manter volume com menor fadiga | Cardio integrado implícito",
  };
  return goals.map(g => profiles[g] ? `• ${g}: ${profiles[g]}` : `• ${g}: volume moderado, 8-12 reps`).join("\n");
}

function exerciseCountAndVolume(data: WorkoutFormData): string {
  const isAdvanced = data.advancedMode || ["Avançado", "Atleta / Competidor"].includes(data.level);
  const isCompetitor = data.level === "Atleta / Competidor";

  if (isCompetitor) return "10-14 exercícios (atleta competidor: volume e densidade máximos)";
  if (isAdvanced) return "8-12 exercícios com técnicas de intensificação";
  if (data.level === "Intermediário") return "6-9 exercícios";
  return "5-7 exercícios básicos (iniciante: qualidade antes de quantidade)";
}

function advancedTechniques(data: WorkoutFormData): string {
  if (!data.advancedMode && !["Avançado", "Atleta / Competidor"].includes(data.level)) return "";

  const isCompetitor = data.level === "Atleta / Competidor";

  return `
TÉCNICAS DE INTENSIFICAÇÃO A USAR (obrigatório para este nível):
• Drop Sets: ao atingir falha/RIR 0, reduzir 20-30% do peso e continuar imediatamente (2-3 drops)
  → Ideal para: isolados no final do treino (curls, extensões, laterais, leg extension)
• Rest-Pause: ao atingir falha → descansar 15-20 segundos → continuar por mais 3-5 reps → repetir 1x
  → Ideal para: qualquer exercício de isolamento ou máquina
• Myo-Reps: 12-15 reps de ativação → 5 respirações profundas → 3-5 reps → repetir 4-5x (total ~30 reps)
  → Ideal para: exercícios de isolamento com carga leve (altíssimo estresse metabólico)
• Supersets Agonista-Antagonista: dois músculos opostos em sequência sem descanso entre eles
  → Ex: supino + remada, extensão de tríceps + curl de bíceps (não compromete força, economiza tempo)
• Pré-Esgotamento: exercício isolado ANTES do composto para forçar o músculo alvo ao limite
  → Ex: pec deck → supino; lateral raise → desenvolvimento; leg extension → agachamento
${isCompetitor ? `• Giant Sets: 3-4 exercícios para o mesmo músculo em sequência, 15-20s entre eles (máximo pump)
• BFR (Blood Flow Restriction): 20-30% 1RM, 15-30 reps, torniquete parcial — para finalizar séries
• Cluster Sets: série pesada dividida em mini-séries de 2-3 reps com 15-20s pausa (ideal para força)
• Eccentric Overload: fase excêntrica 4-6 segundos controlados (máximo dano muscular)` : ""}

Indique a técnica usada diretamente no campo "dica" do exercício.`;
}

function buildPrompt(data: WorkoutFormData): string {
  return `${SYSTEM_PROMPT}

═══════════════════════════════════════════════
PRESCRIÇÃO DE TREINO PERSONALIZADO
═══════════════════════════════════════════════

PERFIL DO ATLETA:
• Grupos musculares: ${data.muscleGroups.join(", ")}
• Equipamento: ${data.equipment}
• Tempo disponível: ${data.duration}
• Nível: ${data.level}
• Objetivos: ${data.goals.join(", ")}
• Modo Avançado: ${data.advancedMode ? "SIM" : "NÃO"}

${levelProfile(data.level)}

PARAMETROS DE INTENSIDADE POR OBJETIVO:
${goalProfile(data.goals)}
${advancedTechniques(data)}

REGRAS DE PRESCRIÇÃO:
• Quantidade de exercícios: ${exerciseCountAndVolume(data)}
• Ordem correta: AQUECIMENTO ESPECÍFICO (implícito) → COMPOSTOS (maior carga neural) → ISOLADOS → FINALIZADORES
• Priorize exercícios com maior tensão no ALONGAMENTO do músculo (stretch-mediated hypertrophy)
• Para ${data.equipment}: use apenas exercícios possíveis com este equipamento
• Descanso: compostos pesados (2-5min) | isolados (60-90s) | técnicas avançadas/supersets (45-60s)
• Séries: Iniciante (2-3) | Intermediário (3-4) | Avançado (4-5) | Competidor (4-6+)
• O campo "dica" deve ser ESPECÍFICO e TÉCNICO: mencionar ativação muscular, ponto de contração, amplitude, respiração, ou técnica avançada aplicada
• O campo "en_name" deve ser o nome oficial em inglês para busca de animações

IMPORTANTE: Gere um treino que um fisiculturista profissional consideraria correto e completo.

Retorne APENAS JSON válido neste formato:
{
  "nome": "nome criativo e técnico do treino",
  "descricao": "descrição técnica em 1-2 frases",
  "duracao_estimada": "${data.duration}",
  "exercicios": [
    {
      "nome": "nome do exercício em português",
      "en_name": "exercise official name in English",
      "series": 4,
      "repeticoes": "8-12",
      "descanso": "90s",
      "dica": "dica técnica específica de execução"
    }
  ],
  "observacao_final": "observação técnica sobre periodização, recuperação ou foco desta sessão"
}`;
}

export async function POST(request: NextRequest) {
  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });

  try {
    const body: WorkoutFormData = await request.json();
    const { muscleGroups, equipment, duration, level, goals } = body;

    if (!muscleGroups?.length || !equipment || !duration || !level || !goals?.length) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios." }, { status: 400 });
    }

    const prompt = buildPrompt(body);

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "Responda exclusivamente com JSON válido, sem markdown nem texto adicional." },
        { role: "user", content: prompt },
      ],
      temperature: 0.65,
      max_tokens: 3000,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Resposta da IA sem JSON válido:", raw);
      return NextResponse.json({ error: "A IA retornou uma resposta inesperada. Tente novamente." }, { status: 500 });
    }

    const workout: Workout = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ workout });
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Não foi possível processar a resposta da IA. Tente novamente." }, { status: 500 });
    }
    const message = error instanceof Error ? error.message : "Erro interno do servidor.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
