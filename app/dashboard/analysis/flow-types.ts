export interface DataInputOptions {
  source: string; // e.g., "sales", "attendance"
  period?: string; // e.g., "last_30_days", "custom"
  filters?: Record<string, any>;
}

export interface ProcessingOptions {
  operation: "sum" | "average" | "compare" | "filter_rows";
  field?: string;
  groupBy?: string;
  target?: number; // for comparisons
}

export interface GradingOptions {
  rules: {
    condition: "gt" | "lt" | "eq" | "between";
    value: number | [number, number];
    grade: "Good" | "Warning" | "Critical";
    color: string;
    description: string;
  }[];
}

export interface OutputOptions {
  type: "metric_card" | "chart" | "alert" | "table";
  chartType?: "bar" | "line" | "area" | "pie";
  title: string;
}

export interface NodeData {
  label: string;
  type: "input" | "processing" | "grading" | "output" | "ai";
  // One of the following will be set based on type
  inputOptions?: DataInputOptions;
  processingOptions?: ProcessingOptions;
  gradingOptions?: GradingOptions;
  outputOptions?: OutputOptions;

  // Runtime values (for visualization when running)
  _result?: any;
  _grade?: string;
  _gradeColor?: string;
  _aiExplanation?: string;
}
