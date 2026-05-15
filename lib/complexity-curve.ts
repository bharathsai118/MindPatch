export const COMPLEXITY_SAMPLE_SIZES = [1, 2, 4, 8, 16, 32, 64, 128] as const;

export type ComplexityCurvePoint = {
  inputSize: number;
  operations: number;
  normalizedValue: number;
};

export type ComplexityCurveSeries = {
  label: string;
  normalizedLabel: string;
  family: string;
  points: ComplexityCurvePoint[];
};

export type ComplexityComparison = {
  current: ComplexityCurveSeries;
  suggested: ComplexityCurveSeries;
  maxOperations: number;
};

type CurveDefinition = {
  family: string;
  estimate: (inputSize: number) => number;
};

export function formatComplexityLabel(value: string) {
  return value
    .replace(/log10\s*n/gi, "log N")
    .replace(/log2\s*n/gi, "log N")
    .replace(/\bn\b/g, "N");
}

export function formatOperationCount(value: number) {
  if (!Number.isFinite(value)) return "0";

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}k`;
  }

  if (value % 1 === 0) return value.toString();

  return value.toFixed(value < 10 ? 2 : 1);
}

function sanitizeComplexityLabel(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/log10/g, "log")
    .replace(/log2/g, "log")
    .replace(/lg/g, "log")
    .replace(/sqrt/g, "sqrt");
}

function log2(inputSize: number) {
  return Math.log2(Math.max(inputSize, 2));
}

function parseComplexity(value: string): CurveDefinition {
  const normalized = sanitizeComplexityLabel(value);

  if (/o\((1|constant)\)/.test(normalized)) {
    return {
      family: "constant",
      estimate: () => 1
    };
  }

  if (/min\((n|d),?(charset|alphabet|sigma|k|[a-z]+)\)/.test(normalized)) {
    return {
      family: "bounded-linear",
      estimate: (inputSize) => Math.min(inputSize, 64)
    };
  }

  if (/max\((n|d),?(m|k|[a-z]+)\)/.test(normalized)) {
    return {
      family: "max-linear",
      estimate: (inputSize) => inputSize
    };
  }

  if (/2\^n|exp\(n\)|o\([^)]*\^n\)/.test(normalized)) {
    return {
      family: "exponential",
      estimate: (inputSize) => 2 ** Math.min(inputSize, 24)
    };
  }

  if (/n!|factorial/.test(normalized)) {
    return {
      family: "factorial",
      estimate: (inputSize) => {
        const capped = Math.min(inputSize, 12);
        let value = 1;
        for (let factor = 2; factor <= capped; factor += 1) value *= factor;
        return value;
      }
    };
  }

  if (/n\^3|n\*\*3|n3/.test(normalized)) {
    return {
      family: "cubic",
      estimate: (inputSize) => inputSize ** 3
    };
  }

  if (/n\^2|n\*\*2|n2|n\*n/.test(normalized)) {
    return {
      family: "quadratic",
      estimate: (inputSize) => inputSize ** 2
    };
  }

  if (
    /nlogn|n\*logn|nlog\(n\)|logn\*n/.test(normalized) ||
    /o\([^)]*n[^)]*log/.test(normalized)
  ) {
    return {
      family: "linearithmic",
      estimate: (inputSize) => inputSize * log2(inputSize)
    };
  }

  if (/sqrt\(n\)|sqrtn/.test(normalized)) {
    return {
      family: "sqrt",
      estimate: (inputSize) => Math.sqrt(inputSize)
    };
  }

  if (/logn|log\(n\)|logd|log\(d\)/.test(normalized)) {
    return {
      family: "logarithmic",
      estimate: (inputSize) => log2(inputSize)
    };
  }

  if (/[a-z]\+[a-z]|n\+m|m\+n/.test(normalized)) {
    return {
      family: "multi-input-linear",
      estimate: (inputSize) => inputSize * 2
    };
  }

  if (/o\([^)]*n/.test(normalized)) {
    return {
      family: "linear",
      estimate: (inputSize) => inputSize
    };
  }

  return {
    family: "fallback-linear",
    estimate: (inputSize) => inputSize
  };
}

function buildSeries(label: string, maxOperations: number): ComplexityCurveSeries {
  const definition = parseComplexity(label);
  const safeMax = Math.max(maxOperations, 1);

  return {
    label,
    normalizedLabel: formatComplexityLabel(label),
    family: definition.family,
    points: COMPLEXITY_SAMPLE_SIZES.map((inputSize) => {
      const operations = Math.max(definition.estimate(inputSize), 0);

      return {
        inputSize,
        operations,
        normalizedValue: operations / safeMax
      };
    })
  };
}

export function buildComplexityComparison(
  currentLabel: string,
  suggestedLabel: string
): ComplexityComparison {
  const currentDefinition = parseComplexity(currentLabel);
  const suggestedDefinition = parseComplexity(suggestedLabel);
  const maxOperations = Math.max(
    ...COMPLEXITY_SAMPLE_SIZES.flatMap((inputSize) => [
      currentDefinition.estimate(inputSize),
      suggestedDefinition.estimate(inputSize)
    ]),
    1
  );

  return {
    current: buildSeries(currentLabel, maxOperations),
    suggested: buildSeries(suggestedLabel, maxOperations),
    maxOperations
  };
}
