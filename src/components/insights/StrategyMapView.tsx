"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { Info, Edit, ChevronDown, ChevronUp } from "lucide-react";
import { fetchGoalHierarchy } from "@/api-service";
import { Goal } from "@/types";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MiniMap,
  Panel,
  MarkerType,
  NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";
import { Avatar } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

// Custom node component for goals
const GoalNode = ({ data }: { data: any }) => {
  const router = useRouter();

  const handleNodeClick = () => {
    router.push(`/insights/goals/${data._id}`);
  };

  return (
    <div
      className="bg-[#1a1a1a] border border-[#353535] rounded-lg p-4 w-[250px] text-center flex flex-col items-center relative cursor-pointer"
      onClick={handleNodeClick}
    >
      <div className="absolute top-2 right-2 text-xs text-gray-400">
        {data.progress}%
      </div>

      <div className="w-full h-1 bg-[#353535] rounded-full mb-4">
        <div
          className="h-1 rounded-full bg-[#4573D2]"
          style={{ width: `${data.progress}%` }}
        ></div>
      </div>

      <div className="text-lg font-medium mb-2">{data.title}</div>

      {data.description && (
        <div className="text-xs text-gray-400 mb-2 line-clamp-2">
          {data.description}
        </div>
      )}

      <Avatar className="h-8 w-8 bg-[#4573D2] mb-2">
        <span className="text-xs font-medium text-white">
          {data.ownerName ? data.ownerName.charAt(0) : "U"}
        </span>
      </Avatar>
      <div className="text-xs text-gray-400">{data.ownerName || "Unknown"}</div>

      <div className="flex mt-3 space-x-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onEdit();
          }}
          className="p-1 hover:bg-[#252525] rounded"
        >
          <Edit className="h-4 w-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
};

// Define node types
const nodeTypes: NodeTypes = {
  goalNode: GoalNode,
};

interface StrategyMapViewProps {
  initialRootGoal?: Goal;
  highlightGoalId?: string;
  onEditGoal?: (goal: Goal) => void;
}

export const StrategyMapView = ({
  initialRootGoal,
  highlightGoalId,
  onEditGoal,
}: StrategyMapViewProps) => {
  const [loading, setLoading] = useState(true);
  const [rootGoal, setRootGoal] = useState<Goal | null>(
    initialRootGoal || null
  );
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [collapsed, setCollapsed] = useState<{ [key: string]: boolean }>({});
  const [debugMode, setDebugMode] = useState(false);

  // Memoize nodeTypes to prevent render loops
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);

  // Fetch goal hierarchy from API
  useEffect(() => {
    const getGoals = async () => {
      try {
        setLoading(true);
        if (!initialRootGoal) {
          console.log("Fetching goal hierarchy from API");
          const hierarchyData = await fetchGoalHierarchy({ isPrivate: false });

          if (Array.isArray(hierarchyData) && hierarchyData.length > 0) {
            console.log(
              "Retrieved goal hierarchy with root goal:",
              hierarchyData[0]._id
            );
            // Perform a deep clone to avoid reference issues
            const rootGoalCopy = JSON.parse(JSON.stringify(hierarchyData[0]));
            setRootGoal(rootGoalCopy);
          } else {
            console.log("No goals found in hierarchy response");
            setRootGoal(null);
          }
        } else {
          console.log("Using provided initialRootGoal");
          // Perform a deep clone of the provided root goal
          const rootGoalCopy = JSON.parse(JSON.stringify(initialRootGoal));
          setRootGoal(rootGoalCopy);
        }
      } catch (error) {
        console.error("Error fetching goal hierarchy:", error);
        setRootGoal(null);
      } finally {
        setLoading(false);
      }
    };

    getGoals();
  }, [initialRootGoal]);

  // Transform goals to nodes and edges whenever rootGoal or collapsed state changes
  useEffect(() => {
    if (rootGoal) {
      try {
        console.log("Transforming goal hierarchy to nodes and edges");

        // Create simplified nodes and edges
        const simpleNodes: Node[] = [];
        const simpleEdges: Edge[] = [];

        // Add root node
        const rootNode: Node = {
          id: rootGoal._id,
          type: "goalNode",
          position: { x: 400, y: 100 },
          data: {
            ...rootGoal,
            ownerName: rootGoal.owner?.fullName || rootGoal.ownerId,
            onEdit: () => onEditGoal && onEditGoal(rootGoal),
          },
          width: 250,
          height: 150,
        };

        simpleNodes.push(rootNode);

        // Add child nodes if any
        if (rootGoal.children && rootGoal.children.length > 0) {
          rootGoal.children.forEach((child, index) => {
            const childNode: Node = {
              id: child._id,
              type: "goalNode",
              position: { x: 200 + index * 300, y: 300 },
              data: {
                ...child,
                ownerName: child.owner?.fullName || child.ownerId,
                onEdit: () => onEditGoal && onEditGoal(child),
              },
              width: 250,
              height: 150,
            };

            simpleNodes.push(childNode);

            // Add edge from root to child
            const edge: Edge = {
              id: `${rootGoal._id}-${child._id}`,
              source: rootGoal._id,
              target: child._id,
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 10,
                height: 10,
                color: "#4573D2",
              },
              style: { stroke: "#4573D2", strokeWidth: 1 },
            };

            simpleEdges.push(edge);
          });
        }

        // Set nodes and edges
        setNodes(simpleNodes);
        setEdges(simpleEdges);
      } catch (error) {
        console.error("Error transforming goals to nodes:", error);
      }
    }
  }, [rootGoal, onEditGoal]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#4573D2]"></div>
      </div>
    );
  }

  if (!rootGoal) {
    return (
      <div className="flex flex-col items-center justify-center h-64 px-6">
        <p className="text-gray-400 text-center">
          No goals found. Create your first goal to get started with your
          strategy map.
        </p>
      </div>
    );
  }

  return (
    <div className="px-6">
      <div className="bg-[#252525] p-4 mb-6 rounded-lg border border-[#353535]">
        <div className="flex items-center space-x-2">
          <Info className="h-5 w-5 text-[#4573D2]" />
          <p className="text-sm text-gray-300">
            This strategy map shows how all goals in your workspace align. Click
            on a goal to expand or collapse its sub-goals.
          </p>
          <button
            onClick={() => setDebugMode(!debugMode)}
            className="ml-auto py-1 px-2 bg-gray-700 text-xs rounded hover:bg-gray-600"
          >
            {debugMode ? "Hide Debug" : "Debug"}
          </button>
        </div>
      </div>

      {debugMode && (
        <div className="bg-gray-900 p-4 mb-6 rounded-lg border border-gray-700 text-xs overflow-auto max-h-[200px]">
          <h3 className="text-white mb-2 font-bold">Debug Info:</h3>
          <div>
            <p className="text-gray-400">
              Root Goal: {rootGoal?._id || "None"}
            </p>
            <p className="text-gray-400">
              Children: {rootGoal?.children?.length || 0}
            </p>
            <p className="text-gray-400">
              Nodes: {nodes.length}, Edges: {edges.length}
            </p>
            <pre className="text-gray-500 mt-2">
              {JSON.stringify(rootGoal?.children?.[0] || {}, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div className="h-[700px] w-full border border-[#353535] rounded-lg bg-[#121212]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={memoizedNodeTypes}
          fitView
          minZoom={0.1}
          maxZoom={1.5}
          zoomOnScroll={true}
          panOnScroll={true}
          panOnDrag={true}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
        >
          <Controls showInteractive={false} position="bottom-right" />
          <MiniMap
            nodeStrokeWidth={3}
            nodeColor={(node) => "#4573D2"}
            maskColor="rgba(0, 0, 0, 0.3)"
            position="bottom-left"
          />
          <Background color="#353535" gap={16} />
          <Panel
            position="top-left"
            className="bg-[#1a1a1a] p-2 rounded-md border border-[#353535]"
          >
            <div className="font-medium text-lg">
              {rootGoal?.title || "Strategy Map"}
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
};
