"use client";

import { useCallback, useState } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// Custom Nodes and Types
import { flowNodeTypes } from "./custom-nodes";
import { NodeData } from "./flow-types";
import { runFlow } from "./flow-engine";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Filter, Activity, TrendingUp, Play } from "lucide-react";
import { toast } from "sonner";
import { PropertiesPanel } from "./properties-panel";

// Initial Graph State
const initialNodes = [
  {
    id: "1",
    type: "input",
    position: { x: 50, y: 100 },
    data: {
      label: "Sales Data",
      inputOptions: { source: "sales", period: "Last 30 Days" },
    },
  },
  {
    id: "2",
    type: "processing",
    position: { x: 350, y: 100 },
    data: {
      label: "Sum Revenue",
      processingOptions: { operation: "sum", field: "revenue" },
    },
  },
  {
    id: "3",
    type: "grading",
    position: { x: 650, y: 100 },
    data: {
      label: "Revenue Check",
      gradingOptions: {
        rules: [
          {
            condition: "gt",
            value: 500000,
            grade: "Good",
            color: "green",
            description: "Revenue is above target.",
          },
          {
            condition: "lt",
            value: 500000,
            grade: "Warning",
            color: "orange",
            description: "Revenue is below target.",
          },
        ],
      },
    },
  },
  {
    id: "4",
    type: "output",
    position: { x: 950, y: 100 },
    data: {
      label: "Revenue Grade",
      outputOptions: { title: "Revenue Status", type: "metric_card" },
    },
  },
];

const initialEdges = [
  { id: "e1-2", source: "1", target: "2", animated: true },
  { id: "e2-3", source: "2", target: "3", animated: true },
  { id: "e3-4", source: "3", target: "4", animated: true },
];

export default function BizflowEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node as Node<NodeData>);
  };

  const addNode = (type: "input" | "processing" | "grading" | "output") => {
    const id = Math.random().toString(36).substr(2, 9);
    const position = {
      x: 100 + Math.random() * 50,
      y: 100 + Math.random() * 50,
    };

    let data: NodeData = { label: "New Node", type };
    if (type === "input") data.inputOptions = { source: "sales" };
    if (type === "processing") data.processingOptions = { operation: "sum" };
    if (type === "grading") data.gradingOptions = { rules: [] };
    if (type === "output")
      data.outputOptions = { type: "metric_card", title: "New Output" };

    const newNode = { id, type, position, data };
    setNodes((nds) => nds.concat(newNode));
    setSelectedNode(newNode);
  };

  const handleUpdateNode = (id: string, data: NodeData) => {
    setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data } : n)));
    // Update selected node reference as well
    if (selectedNode?.id === id) {
      setSelectedNode((prev) => (prev ? { ...prev, data } : null));
    }
  };

  const handleDeleteNode = (id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setSelectedNode(null);
  };

  const handleRun = () => {
    // Execute the flow
    const processedNodes = runFlow([...nodes], [...edges]);

    // Update visual state with results
    setNodes((nds) =>
      nds.map((n) => {
        const processed = processedNodes.find((pn) => pn.id === n.id);
        return processed ? { ...n, data: { ...n.data, ...processed.data } } : n;
      }),
    );

    toast.success("Analysis complete!");
  };

  return (
    <div className="flex h-[90vh] flex-col">
      <div className="flex items-center justify-between border-b bg-background px-6 py-3">
        <div>
          <h1 className="text-xl font-bold">Bizflow Studio</h1>
          <p className="text-sm text-muted-foreground">
            Design your business logic visually.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => addNode("input")}>
            <Database className="mr-2 h-4 w-4 text-blue-500" /> Input
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addNode("processing")}
          >
            <Filter className="mr-2 h-4 w-4 text-purple-500" /> Process
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addNode("grading")}
          >
            <Activity className="mr-2 h-4 w-4 text-orange-500" /> Grade
          </Button>
          <Button variant="outline" size="sm" onClick={() => addNode("output")}>
            <TrendingUp className="mr-2 h-4 w-4 text-green-500" /> Output
          </Button>
          <div className="w-px h-6 bg-border mx-2" />
          <Button onClick={handleRun}>
            <Play className="mr-2 h-4 w-4" /> Run Analysis
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={flowNodeTypes}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>

          {/* Results Overlay (Simulation of "Output" display) */}
          <div className="absolute top-4 right-4 w-80 space-y-4 pointer-events-none z-10">
            {nodes
              .filter((n) => n.type === "output" && n.data._result)
              .map((n) => (
                <Card
                  key={n.id}
                  className="pointer-events-auto shadow-xl border-l-4"
                  style={{
                    borderLeftColor: n.data._result?._gradeColor || "gray",
                  }}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex justify-between items-center">
                      {n.data.outputOptions?.title}
                      {n.data._result?._grade && (
                        <Badge
                          style={{
                            backgroundColor: n.data._result?._gradeColor,
                          }}
                          className="text-white hover:bg-opacity-90"
                        >
                          {n.data._result._grade}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Result:{" "}
                      <span className="font-mono text-foreground font-bold">
                        {n.data._result?._result?.toLocaleString()}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  {n.data._result?._aiExplanation && (
                    <CardContent className="text-xs bg-muted/50 p-3 pt-2">
                      <strong>AI Insight:</strong>{" "}
                      {n.data._result._aiExplanation}
                    </CardContent>
                  )}
                </Card>
              ))}
          </div>
        </div>

        {/* Properties Panel (Right Sidebar) */}
        <div className="w-80 border-l bg-background overflow-hidden flex flex-col">
          <PropertiesPanel
            selectedNode={selectedNode}
            onUpdate={handleUpdateNode}
            onDelete={handleDeleteNode}
          />
        </div>
      </div>
    </div>
  );
}
