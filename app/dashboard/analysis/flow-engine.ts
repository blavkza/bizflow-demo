"use client";

import { Edge, Node } from "@xyflow/react";
import { datasets } from "./data";
import { NodeData } from "./flow-types";

// A simulated engine to process the flow

export function runFlow(nodes: Node<NodeData>[], edges: Edge[]) {
  // 1. Topological sort or simple traversal.
  // For this simplified version, we'll find input nodes and propagate.

  const nodeMap = new Map(nodes.map((n) => [n.id, { ...n } as Node<NodeData>]));
  const edgeMap = new Map<string, string[]>(); // source -> targets

  edges.forEach((e) => {
    if (!edgeMap.has(e.source)) edgeMap.set(e.source, []);
    edgeMap.get(e.source)?.push(e.target);
  });

  // Find Input Nodes
  const inputs = nodes.filter((n) => n.type === "input");

  // We will perform a BFS/propagation
  const queue = [...inputs];
  const processed = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || processed.has(current.id)) continue;

    processNode(current, nodeMap, edges);
    processed.add(current.id);

    // Add children
    const childrenIds = edgeMap.get(current.id) || [];
    childrenIds.forEach((id) => {
      const child = nodeMap.get(id);
      if (child) queue.push(child);
    });
  }

  return Array.from(nodeMap.values());
}

function processNode(
  node: Node<NodeData>,
  nodeMap: Map<string, Node<NodeData>>,
  edges: Edge[],
) {
  const data = node.data;

  switch (node.type) {
    case "input": {
      if (data.inputOptions?.source) {
        const dataset = datasets.find(
          (d) => d.id === data.inputOptions?.source,
        );
        data._result = dataset?.data || [];
      }
      break;
    }
    case "processing": {
      // Find parent data
      const parentEdge = edges.find((e) => e.target === node.id);
      const parent = parentEdge ? nodeMap.get(parentEdge.source) : null;
      const inputData = parent?.data?._result;

      if (Array.isArray(inputData)) {
        if (
          data.processingOptions?.operation === "sum" &&
          data.processingOptions.field
        ) {
          // Simple aggregation
          const sum = inputData.reduce(
            (acc, curr) =>
              acc + Number(curr[data.processingOptions!.field!] || 0),
            0,
          );
          data._result = sum;
        } else if (
          data.processingOptions?.operation === "average" &&
          data.processingOptions.field
        ) {
          const sum = inputData.reduce(
            (acc, curr) =>
              acc + Number(curr[data.processingOptions!.field!] || 0),
            0,
          );
          data._result = inputData.length ? sum / inputData.length : 0;
        }
        // Pass through for now if no op match
        else {
          data._result = inputData;
        }
      }
      break;
    }
    case "grading": {
      const parentEdge = edges.find((e) => e.target === node.id);
      const parent = parentEdge ? nodeMap.get(parentEdge.source) : null;
      const value = parent?.data?._result;

      if (typeof value === "number" && data.gradingOptions?.rules) {
        // Find matching rule
        for (const rule of data.gradingOptions.rules) {
          let match = false;
          if (rule.condition === "gt" && value > (rule.value as number))
            match = true;
          if (rule.condition === "lt" && value < (rule.value as number))
            match = true;

          if (match) {
            data._grade = rule.grade;
            data._gradeColor = rule.color;
            data._aiExplanation = rule.description;
            break;
          }
        }
      }
      // Pass result forward
      data._result = value;
      break;
    }
    case "output": {
      const parentEdge = edges.find((e) => e.target === node.id);
      const parent = parentEdge ? nodeMap.get(parentEdge.source) : null;
      data._result = parent?.data; // Store full parent data object to access grade etc.
      break;
    }
  }
}
