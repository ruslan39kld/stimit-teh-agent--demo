export type FinalAgentType = 'Диагност' | 'Навигатор' | 'Консультант' | 'Финализатор';

export interface ClientProfile {
  problem_type: string;
  client_emotion: string;
  already_tried: string;
  current_hypothesis: string;
  next_step: string;
  resolution_status: string;
  negative_risk: string;
}

export interface RouterReasoning {
  selected_agent: FinalAgentType;
  reason: string;
}

export interface FinalAgentReasoning {
  agent_name: string;
  goal: string;
  response_logic: string;
}

export interface SupportReasoning {
  profile: ClientProfile;
  router: RouterReasoning;
  final_agent: FinalAgentReasoning;
}

export interface ClientReplyOption {
  id: string;
  text: string;
  is_main: boolean;
  /** Follow-up label shown after user explored an alternative branch on this step */
  after_branch_text?: string;
  /** Pre-authored response if user selects an alternative (non-main) branch */
  branch?: {
    support_reply: string;
    profile_patch: Partial<ClientProfile>;
    router_reason?: string;
    final_agent_goal?: string;
  };
}

export interface DialogueStep {
  step: number;
  support: {
    reasoning: SupportReasoning;
    answer: string;
  };
  client_response: string;
  client_options: ClientReplyOption[];
}

export interface CriterionScore {
  score: number;
  comment: string;
}

export interface EvaluationCriteria {
  diagnostics_quality: CriterionScore;
  routing_logic: CriterionScore;
  problem_resolution: CriterionScore;
  communication_quality: CriterionScore;
  emotion_management: CriterionScore;
  prompt_compliance: CriterionScore;
  dialogue_realism: CriterionScore;
}

export interface EvaluationFinalResult {
  overall_score: number;
  overall_comment: string;
  main_strengths: [string, string, string];
  main_weaknesses: [string, string, string];
  final_verdict: string;
}

export interface ScenarioEvaluation {
  criteria: EvaluationCriteria;
  final_result: EvaluationFinalResult;
}

export interface Scenario {
  id: string;
  title: string;
  industry: string;
  clientType: string;
  shortContext: string;
  steps: DialogueStep[];
  evaluation: ScenarioEvaluation;
}
