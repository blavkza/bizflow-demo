"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Card, CardContent } from "@/components/ui/card";
import { Database, Filter, Activity, TrendingUp } from "lucide-react";

export function InputNode({ data }: { data: any }) {
  return (
    <Card className="w-64 border-l-4 border-l-blue-500 shadow-md">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Database className="w-4 h-4 text-blue-500" />
          <span className="font-semibold text-sm">Data Input</span>
        </div>
        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
          {data.inputOptions?.source || "Select Source"}
          {data.inputOptions?.period && (
            <div className="mt-1 font-mono text-[10px]">
              {data.inputOptions.period}
            </div>
          )}
        </div>
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-blue-500"
        />
      </CardContent>
    </Card>
  );
}

export function ProcessingNode({ data }: { data: any }) {
  return (
    <Card className="w-64 border-l-4 border-l-purple-500 shadow-md">
      <CardContent className="p-3">
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-purple-500"
        />
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-purple-500" />
          <span className="font-semibold text-sm">Processing</span>
        </div>
        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
          {data.processingOptions?.operation || "Select Operation"}
          {data.processingOptions?.field && (
            <div className="mt-1 font-mono text-[10px]">
              Field: {data.processingOptions.field}
            </div>
          )}
        </div>
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-purple-500"
        />
      </CardContent>
    </Card>
  );
}

export function GradingNode({ data }: { data: any }) {
  return (
    <Card className="w-64 border-l-4 border-l-yellow-500 shadow-md relative">
      <div className="absolute top-2 right-2 flex gap-1">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <div className="w-2 h-2 rounded-full bg-yellow-500" />
        <div className="w-2 h-2 rounded-full bg-red-500" />
      </div>
      <CardContent className="p-3">
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-yellow-500"
        />
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-yellow-500" />
          <span className="font-semibold text-sm">Evaluation Rule</span>
        </div>
        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
          {data.gradingOptions?.rules?.length
            ? `${data.gradingOptions.rules.length} Grading Rule(s)`
            : "No rules set"}
        </div>
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-yellow-500"
        />
      </CardContent>
    </Card>
  );
}

export function OutputNode({ data }: { data: any }) {
  return (
    <Card className="w-64 border-l-4 border-l-green-500 shadow-md">
      <CardContent className="p-3">
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-green-500"
        />
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <span className="font-semibold text-sm">Visual Output</span>
        </div>
        <div className="text-xs text-muted-foreground bg-muted p-2 rounded min-h-[60px] flex items-center justify-center border-dashed border-2 border-muted-foreground/20">
          {data.outputOptions?.type === "chart" ? (
            <div className="text-center">
              Chart: {data.outputOptions.chartType}
              <div className="text-[10px] mt-1">{data.outputOptions.title}</div>
            </div>
          ) : (
            "Configure Output"
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export const flowNodeTypes = {
  input: memo(InputNode),
  processing: memo(ProcessingNode),
  grading: memo(GradingNode),
  output: memo(OutputNode),
};
