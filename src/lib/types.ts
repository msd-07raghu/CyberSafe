export type Verdict = 'SAFE' | 'REVIEW' | 'SUSPICIOUS';

export type EvidenceItem = {
  rule: string;
  trigger: string;
  detail: string;
  severity: 'high' | 'medium' | 'low';
};

export type ParsedUrl = {
  raw: string;
  scheme: string | null;
  hostname: string | null;
  path: string | null;
  query: string | null;
  userinfo: string | null;
  valid: boolean;
};

export type AnalysisResult = {
  url: string;
  parsed: ParsedUrl;
  verdict: Verdict;
  explanation: string;
  evidence: EvidenceItem[];
  riskScore: number;
};
