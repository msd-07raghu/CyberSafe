import type { AnalysisResult, EvidenceItem, ParsedUrl, Verdict } from './types';

const URL_SHORTENERS = new Set([
  'bit.ly',
  'tinyurl.com',
  'goo.gl',
  't.co',
  'ow.ly',
  'is.gd',
  'buff.ly',
  'adf.ly',
  'shorte.st',
  'cutt.ly',
  'rebrand.ly',
  'rb.gy',
  'bl.ink',
  'lnkd.in',
  'tiny.cc',
  'soo.gd',
  'qr.ae',
  'v.gd',
  'x.co',
  'shorturl.at',
]);

const LOOKALIKE_PAIRS: { original: string; pattern: string; detail: string }[] = [
  { original: 'google', pattern: 'g00gle', detail: 'Uses zeros (0) instead of the letter "o" — a common lookalike trick.' },
  { original: 'google', pattern: 'googIe', detail: 'Uses uppercase "I" instead of lowercase "l" — visually similar in many fonts.' },
  { original: 'microsoft', pattern: 'micros0ft', detail: 'Uses a zero (0) instead of the letter "o".' },
  { original: 'microsoft', pattern: 'rnicrosoft', detail: 'Uses "rn" instead of "m" — visually similar in some fonts.' },
  { original: 'github', pattern: 'githuh', detail: 'Close spelling variation that may impersonate the real domain.' },
  { original: 'apple', pattern: 'app1e', detail: 'Uses the digit "1" instead of the letter "l".' },
  { original: 'amazon', pattern: 'amaz0n', detail: 'Uses a zero (0) instead of the letter "o".' },
  { original: 'paypal', pattern: 'paypa1', detail: 'Uses the digit "1" instead of the letter "l".' },
];

const SUSPICIOUS_PATH_KEYWORDS = ['login', 'signin', 'sign-in', 'account', 'password', 'verify', 'secure', 'auth', 'credential', 'wallet', 'confirm'];
const SUSPICIOUS_QUERY_KEYWORDS = ['token', 'password', 'passwd', 'credential', 'secret', 'api_key', 'apikey', 'sessionid'];

function severityToVerdict(items: EvidenceItem[]): Verdict {
  if (items.some((i) => i.severity === 'high')) return 'SUSPICIOUS';
  if (items.some((i) => i.severity === 'medium')) return 'REVIEW';
  return 'SAFE';
}

function calculateRiskScore(items: EvidenceItem[]): number {
  let score = 0;
  for (const item of items) {
    if (item.severity === 'high') score += 35;
    else if (item.severity === 'medium') score += 18;
    else score += 8;
  }
  return Math.min(score, 100);
}

function isIPAddress(hostname: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.startsWith('[') || /^[0-9a-fA-F:]+$/.test(hostname);
}

function countSubdomains(hostname: string): number {
  if (!hostname) return 0;
  const parts = hostname.split('.');
  return parts.length > 2 ? parts.length - 2 : 0;
}

function parseUrl(raw: string): ParsedUrl {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { raw, scheme: null, hostname: null, path: null, query: null, userinfo: null, valid: false };
  }

  try {
    const parsed = new URL(trimmed);
    return {
      raw: trimmed,
      scheme: parsed.protocol.replace(':', ''),
      hostname: parsed.hostname,
      path: parsed.pathname || null,
      query: parsed.search ? parsed.search.slice(1) : null,
      userinfo: parsed.username || null,
      valid: true,
    };
  } catch {
    try {
      const withProto = 'http://' + trimmed;
      const parsed = new URL(withProto);
      return {
        raw: trimmed,
        scheme: parsed.protocol.replace(':', ''),
        hostname: parsed.hostname,
        path: parsed.pathname || null,
        query: parsed.search ? parsed.search.slice(1) : null,
        userinfo: parsed.username || null,
        valid: true,
      };
    } catch {
      const schemeMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
      return {
        raw: trimmed,
        scheme: schemeMatch ? schemeMatch[1] : null,
        hostname: null,
        path: null,
        query: null,
        userinfo: null,
        valid: false,
      };
    }
  }
}

export function analyzeUrl(input: string): AnalysisResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return {
      url: input,
      parsed: parseUrl(input),
      verdict: 'SAFE',
      explanation: 'Please enter a URL to analyze.',
      evidence: [],
      riskScore: 0,
    };
  }

  const parsed = parseUrl(trimmed);
  const evidence: EvidenceItem[] = [];

  if (!parsed.valid) {
    evidence.push({
      rule: 'Invalid URL',
      trigger: trimmed,
      detail: 'The input could not be parsed as a valid URL. Check for typos or missing components.',
      severity: 'medium',
    });
    return {
      url: trimmed,
      parsed,
      verdict: 'REVIEW',
      explanation: 'This URL could not be parsed. It may be incomplete or malformed — review it carefully before opening.',
      evidence,
      riskScore: calculateRiskScore(evidence),
    };
  }

  const scheme = parsed.scheme?.toLowerCase() ?? '';

  if (scheme !== 'http' && scheme !== 'https') {
    if (scheme === 'javascript') {
      evidence.push({
        rule: 'Non-web scheme: javascript:',
        trigger: `${scheme}:`,
        detail: 'The javascript: scheme can execute arbitrary code in the browser. This is a common vector for XSS attacks.',
        severity: 'high',
      });
    } else if (scheme === 'data') {
      evidence.push({
        rule: 'Non-web scheme: data:',
        trigger: `${scheme}:`,
        detail: 'The data: scheme can embed content inline, including potentially malicious scripts. Treat with caution.',
        severity: 'high',
      });
    } else if (scheme) {
      evidence.push({
        rule: `Non-web scheme: ${scheme}:`,
        trigger: `${scheme}:`,
        detail: `This URL uses a non-HTTP(S) scheme ("${scheme}:"). Only http: and https: are standard web protocols. Other schemes may trigger unexpected behavior.`,
        severity: 'medium',
      });
    }
  }

  if (parsed.userinfo) {
    const isAtPattern = parsed.raw.includes('@');
    if (isAtPattern) {
      const beforeAt = parsed.raw.split('@')[0];
      const looksLikeDomain = /\.[a-z]{2,}/i.test(beforeAt);
      evidence.push({
        rule: 'Deceptive @ pattern',
        trigger: `${parsed.userinfo}@${parsed.hostname}`,
        detail: looksLikeDomain
          ? `The text before the "@" (${parsed.userinfo}) looks like a domain, but the actual destination is "${parsed.hostname}". The "@" embeds user-info credentials, not a hostname — the real destination is hidden.`
          : `This URL contains user-info before the "@" sign. The actual hostname is "${parsed.hostname}", not "${parsed.userinfo}". Attackers use this to disguise the real destination.`,
        severity: 'high',
      });
    }
  }

  const hostname = parsed.hostname?.toLowerCase() ?? '';

  if (hostname && isIPAddress(hostname)) {
    const pathLower = parsed.path?.toLowerCase() ?? '';
    const isLoginRelated = SUSPICIOUS_PATH_KEYWORDS.some((kw) => pathLower.includes(kw));
    evidence.push({
      rule: 'IP-address hostname',
      trigger: hostname,
      detail: isLoginRelated
        ? `This link uses a raw IP address (${hostname}) as the hostname, and the path appears to be login-related. Legitimate services almost always use named domains. This combination is a strong phishing indicator.`
        : `This link uses a raw IP address (${hostname}) instead of a domain name. Legitimate websites rarely ask users to visit an IP address directly. Review carefully.`,
      severity: isLoginRelated ? 'high' : 'medium',
    });
  }

  if (hostname) {
    for (const pair of LOOKALIKE_PAIRS) {
      if (hostname.includes(pair.pattern.toLowerCase())) {
        evidence.push({
          rule: 'Lookalike hostname',
          trigger: hostname,
          detail: `The hostname contains "${pair.pattern}" which closely resembles "${pair.original}". ${pair.detail} This is a common phishing technique called typosquatting.`,
          severity: 'high',
        });
      }
    }
  }

  if (hostname && URL_SHORTENERS.has(hostname)) {
    evidence.push({
      rule: 'Shortened URL',
      trigger: hostname,
      detail: `"${hostname}" is a known URL shortener. The destination is hidden behind a redirect — you cannot tell where this link actually goes without opening it. Review the source and context before clicking.`,
      severity: 'medium',
    });
  }

  const subdomainCount = countSubdomains(hostname);
  if (subdomainCount >= 4) {
    evidence.push({
      rule: 'Excessive subdomains',
      trigger: hostname,
      detail: `This hostname has ${subdomainCount} subdomain levels. Legitimate services typically use 1-2 subdomains. Excessive nesting can be used to disguise the real domain or bury it in a long string.`,
      severity: 'medium',
    });
  }

  if (hostname) {
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      const keywordInDomain = parts.some((part) =>
        SUSPICIOUS_PATH_KEYWORDS.some((kw) => part.toLowerCase().includes(kw))
      );
      const pathLower = parsed.path?.toLowerCase() ?? '';
      const hasLoginPath = SUSPICIOUS_PATH_KEYWORDS.some((kw) => pathLower.includes(kw));
      if (keywordInDomain && hasLoginPath) {
        evidence.push({
          rule: 'Login-related pattern in hostname and path',
          trigger: `${hostname}${parsed.path}`,
          detail: 'Both the hostname and the path contain login-related keywords. This combination is common in phishing pages that mimic sign-in forms.',
          severity: 'medium',
        });
      }
    }
  }

  if (parsed.query) {
    const queryLower = parsed.query.toLowerCase();
    for (const kw of SUSPICIOUS_QUERY_KEYWORDS) {
      if (queryLower.includes(kw)) {
        evidence.push({
          rule: 'Sensitive keyword in query string',
          trigger: kw,
          detail: `The query string contains "${kw}", which may indicate sensitive data being passed in the URL. Legitimate services rarely put passwords or tokens in a visible URL.`,
          severity: 'medium',
        });
        break;
      }
    }
  }

  if (hostname && hostname.length > 50) {
    evidence.push({
      rule: 'Unusually long hostname',
      trigger: hostname,
      detail: `The hostname is ${hostname.length} characters long. Unusually long hostnames can be used to hide the real domain or confuse users.`,
      severity: 'low',
    });
  }

  if (parsed.scheme && hostname) {
    const usesHttps = parsed.scheme === 'https';
    if (!usesHttps && scheme === 'http') {
      const pathLower = parsed.path?.toLowerCase() ?? '';
      if (SUSPICIOUS_PATH_KEYWORDS.some((kw) => pathLower.includes(kw))) {
        evidence.push({
          rule: 'HTTP (not HTTPS) with login path',
          trigger: `http://${hostname}`,
          detail: 'This login-related URL uses plain HTTP instead of HTTPS. Data sent over HTTP is not encrypted and can be intercepted. Legitimate login pages use HTTPS.',
          severity: 'medium',
        });
      }
    }
  }

  const verdict = severityToVerdict(evidence);

  let explanation: string;
  if (verdict === 'SUSPICIOUS') {
    explanation = 'One or more high-risk patterns were detected in this URL. Do not open it without verifying the source through a trusted channel.';
  } else if (verdict === 'REVIEW') {
    explanation = 'This URL has unusual or ambiguous characteristics. Verify the source and context before opening it.';
  } else {
    explanation = 'No significant risk indicator was detected. This does not guarantee the link is safe — it means none of the screening rules were triggered.';
  }

  return {
    url: trimmed,
    parsed,
    verdict,
    explanation,
    evidence,
    riskScore: calculateRiskScore(evidence),
  };
}

export const SAMPLE_URLS: { label: string; url: string; description: string }[] = [
  {
    label: 'Ordinary safe link',
    url: 'https://www.reserved.example/about-us',
    description: 'A normal HTTPS link with a standard hostname.',
  },
  {
    label: 'Deceptive @ pattern',
    url: 'https://campus.example@other.reserved.example/login',
    description: 'Looks like it goes to campus.example, but the real destination is other.reserved.example.',
  },
  {
    label: 'Shortened URL',
    url: 'https://bit.ly/3xYz123',
    description: 'A shortened link — the real destination is hidden.',
  },
  {
    label: 'IP address login',
    url: 'http://192.168.1.50/login/account',
    description: 'Uses a raw IP address with a login path.',
  },
  {
    label: 'Lookalike hostname',
    url: 'https://g00gle.reserved.example/verify',
    description: 'Uses zeros instead of the letter "o" to impersonate Google.',
  },
  {
    label: 'Non-web scheme',
    url: 'javascript:alert(document.cookie)',
    description: 'A javascript: URL that could execute code in the browser.',
  },
  {
    label: 'Benign unusual link',
    url: 'https://very-long-subdomain.name.reserved.example/page?ref=campaign2024',
    description: 'Unusual structure but no high-risk indicator — should be SAFE or REVIEW.',
  },
  {
    label: 'Invalid input',
    url: 'not a url at all',
    description: 'Malformed input that cannot be parsed.',
  },
];
