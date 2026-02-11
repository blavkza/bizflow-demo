"use client";

import { useEffect, useState } from "react";
import { Node } from "@xyflow/react";
import { NodeData } from "./flow-types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, X } from "lucide-react";
import { datasets } from "./data";

interface PropertiesPanelProps {
  selectedNode: Node<NodeData> | null;
  onUpdate: (id: string, data: NodeData) => void;
  onDelete: (id: string) => void;
}

export function PropertiesPanel({
  selectedNode,
  onUpdate,
  onDelete,
}: PropertiesPanelProps) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.data.label);
    }
  }, [selectedNode]);

  if (!selectedNode) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        Select a node to configure properties.
      </div>
    );
  }

  const handleUpdate = (key: string, value: any) => {
    onUpdate(selectedNode.id, { ...selectedNode.data, [key]: value });
  };

  const handleOptionUpdate = (category: string, key: string, value: any) => {
    onUpdate(selectedNode.id, {
      ...selectedNode.data,
      [category]: {
        ...(selectedNode.data[category as keyof NodeData] as any),
        [key]: value,
      },
    });
  };

  const handleRuleAdd = () => {
    const currentRules = selectedNode.data.gradingOptions?.rules || [];
    handleUpdate("gradingOptions", {
      ...selectedNode.data.gradingOptions,
      rules: [
        ...currentRules,
        {
          condition: "gt",
          value: 0,
          grade: "Good",
          color: "green",
          description: "",
        },
      ],
    });
  };

  const handleRuleChange = (index: number, field: string, value: any) => {
    const currentRules = [...(selectedNode.data.gradingOptions?.rules || [])];
    currentRules[index] = { ...currentRules[index], [field]: value };
    handleUpdate("gradingOptions", {
      ...selectedNode.data.gradingOptions,
      rules: currentRules,
    });
  };

  const handleRuleRemove = (index: number) => {
    const currentRules = [...(selectedNode.data.gradingOptions?.rules || [])];
    currentRules.splice(index, 1);
    handleUpdate("gradingOptions", {
      ...selectedNode.data.gradingOptions,
      rules: currentRules,
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg flex items-center justify-between">
          Configuration
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(selectedNode.id)}
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="space-y-2">
          <Label>Node Label</Label>
          <Input
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              handleUpdate("label", e.target.value);
            }}
          />
        </div>

        <Separator />

        {selectedNode.type === "input" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Data Source</Label>
              <Select
                value={selectedNode.data.inputOptions?.source}
                onValueChange={(val) =>
                  handleOptionUpdate("inputOptions", "source", val)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Source" />
                </SelectTrigger>
                <SelectContent>
                  {datasets.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Period</Label>
              <Select
                value={selectedNode.data.inputOptions?.period}
                onValueChange={(val) =>
                  handleOptionUpdate("inputOptions", "period", val)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Last 7 Days">Last 7 Days</SelectItem>
                  <SelectItem value="Last 30 Days">Last 30 Days</SelectItem>
                  <SelectItem value="This Quarter">This Quarter</SelectItem>
                  <SelectItem value="This Year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {selectedNode.type === "processing" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Operation</Label>
              <Select
                value={selectedNode.data.processingOptions?.operation}
                onValueChange={(val) =>
                  handleOptionUpdate("processingOptions", "operation", val)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Function" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sum">Sum (Total)</SelectItem>
                  <SelectItem value="average">Average</SelectItem>
                  <SelectItem value="count">Count</SelectItem>
                  <SelectItem value="min">Minimum</SelectItem>
                  <SelectItem value="max">Maximum</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Target Field</Label>
              <Select
                value={selectedNode.data.processingOptions?.field}
                onValueChange={(val) =>
                  handleOptionUpdate("processingOptions", "field", val)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="profit">Profit</SelectItem>
                  <SelectItem value="cost">Cost</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The field to apply the operation on.
              </p>
            </div>

            {/*  More complex filters could go here */}
          </div>
        )}

        {selectedNode.type === "grading" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Rules</Label>
              <Button variant="outline" size="sm" onClick={handleRuleAdd}>
                <Plus className="h-3 w-3 mr-1" /> Add Rule
              </Button>
            </div>

            <div className="space-y-3">
              {selectedNode.data.gradingOptions?.rules?.map((rule, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-muted rounded-md space-y-2 relative group"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRuleRemove(idx)}
                  >
                    <X className="h-3 w-3" />
                  </Button>

                  <div className="flex gap-2">
                    <Select
                      value={rule.condition}
                      onValueChange={(v) =>
                        handleRuleChange(idx, "condition", v)
                      }
                    >
                      <SelectTrigger className="w-[80px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gt">&gt;</SelectItem>
                        <SelectItem value="lt">&lt;</SelectItem>
                        <SelectItem value="eq">=</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      className="flex-1"
                      value={rule.value as number}
                      onChange={(e) =>
                        handleRuleChange(idx, "value", Number(e.target.value))
                      }
                    />
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Result Label (e.g. Good)"
                      value={rule.grade}
                      onChange={(e) =>
                        handleRuleChange(idx, "grade", e.target.value)
                      }
                    />
                    <Select
                      value={rule.color}
                      onValueChange={(v) => handleRuleChange(idx, "color", v)}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="green">Green</SelectItem>
                        <SelectItem value="orange">Orange</SelectItem>
                        <SelectItem value="red">Red</SelectItem>
                        <SelectItem value="blue">Blue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    placeholder="Explanation Message"
                    value={rule.description}
                    onChange={(e) =>
                      handleRuleChange(idx, "description", e.target.value)
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedNode.type === "output" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={selectedNode.data.outputOptions?.title}
                onChange={(e) =>
                  handleOptionUpdate("outputOptions", "title", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Visualization Type</Label>
              <Select
                value={selectedNode.data.outputOptions?.type}
                onValueChange={(val) =>
                  handleOptionUpdate("outputOptions", "type", val)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="metric_card">Kpi Card</SelectItem>
                  <SelectItem value="chart">Chart</SelectItem>
                  <SelectItem value="alert">Alert</SelectItem>
                  <SelectItem value="table">Table</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Chart Type</Label>
              <Select
                value={selectedNode.data.outputOptions?.chartType || "bar"}
                disabled={selectedNode.data.outputOptions?.type !== "chart"}
                onValueChange={(val) =>
                  handleOptionUpdate("outputOptions", "chartType", val)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
