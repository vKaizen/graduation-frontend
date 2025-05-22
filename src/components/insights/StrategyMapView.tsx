"use client";

import { useEffect, useState, useMemo } from "react";
import { Info } from "lucide-react";
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
  Position,
  getBezierPath,
} from "reactflow";
import "reactflow/dist/style.css";
import { useRouter } from "next/navigation";
import { StrategyMapNode } from "./StrategyMapNode";

// Custom edge component
const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
}) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <path
      id={id}
      style={{
        stroke: "red",
        strokeWidth: 5,
        strokeDasharray: "5,5",
        ...style,
      }}
      className="react-flow__edge-path"
      d={edgePath}
      markerEnd="url(#react-flow__arrowclosed)"
    />
  );
};

// Define node types with our custom node component
const nodeTypes: NodeTypes = {
  goalNode: StrategyMapNode, // Use your original StrategyMapNode
};

// Define edge types
const edgeTypes = {
  custom: CustomEdge,
};

// Configuration flags
const USE_TEST_MODE = false; // Set to true to use minimal test case
const USE_SVG_OVERLAY = false; // Set to false to disable SVG overlay

interface StrategyMapViewProps {
  initialRootGoal?: Goal;
  highlightGoalId?: string;
  onEditGoal?: (goal: Goal) => void;
  onCreateGoal?: () => void;
}

export const StrategyMapView = ({
  initialRootGoal,
  highlightGoalId,
  onEditGoal,
  onCreateGoal,
}: StrategyMapViewProps) => {
  const [loading, setLoading] = useState(true);
  const [rootGoal, setRootGoal] = useState<Goal | null>(
    initialRootGoal || null
  );
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [debugMode, setDebugMode] = useState(false);

  // Memoize nodeTypes to prevent render loops
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);
  const memoizedEdgeTypes = useMemo(() => edgeTypes, []);

  // Default edge options for all edges
  const defaultEdgeOptions = {
    type: "custom", // Use our custom edge type
    animated: true, // Make it animated for visibility
    style: {
      stroke: "red",
      strokeWidth: 5,
      strokeDasharray: "5,5", // Add dashed line for visibility
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "red",
      width: 20,
      height: 20,
    },
    zIndex: 9999,
  };

  // Test mode for minimal case
  useEffect(() => {
    if (USE_TEST_MODE) {
      const testNodes = [
        {
          id: "test-1",
          type: "goalNode", // Use our node type
          position: { x: 250, y: 100 },
          data: { label: "Test Node 1", title: "Test Node 1" },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        },
        {
          id: "test-2",
          type: "goalNode", // Use our node type
          position: { x: 250, y: 300 },
          data: { label: "Test Node 2", title: "Test Node 2" },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        },
      ];

      const testEdges = [
        {
          id: "test-edge-1-2",
          source: "test-1",
          target: "test-2",
          type: "custom",
          animated: true,
          style: { stroke: "red", strokeWidth: 5, strokeDasharray: "5,5" },
          zIndex: 9999,
        },
      ];

      setNodes(testNodes);
      setEdges(testEdges);
      setLoading(false);
      return;
    }
  }, [USE_TEST_MODE]);

  // Fetch goal hierarchy from API
  useEffect(() => {
    if (USE_TEST_MODE) return; // Skip if in test mode

    const getGoals = async () => {
      try {
        setLoading(true);
        if (!initialRootGoal) {
          console.log("Fetching goal hierarchy from API");
          // Only fetch non-private (workspace) goals for the strategy map
          // Include projects and tasks for the progress source layer
          const hierarchyData = await fetchGoalHierarchy({
            isPrivate: false,
            includeProjects: true,
            includeTasks: true,
          });

          // We want to use real data even if it doesn't have children
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
            setRootGoal({
              _id: "workspace-root",
              title: "Workspace",
              description: "",
              progress: 0,
              isPrivate: false,
              workspace: {
                _id: "workspace",
                name: "My Workspace",
              },
              children: [],
            });
          }
        } else {
          console.log("Using provided initialRootGoal");
          // Use initialRootGoal regardless of children
          const rootGoalCopy = JSON.parse(JSON.stringify(initialRootGoal));
          setRootGoal(rootGoalCopy);
        }
      } catch (error) {
        console.error("Error fetching goal hierarchy:", error);
        setRootGoal({
          _id: "workspace-root",
          title: "Workspace",
          description: "",
          progress: 0,
          isPrivate: false,
          workspace: {
            _id: "workspace",
            name: "My Workspace",
          },
          children: [],
        });
      } finally {
        setLoading(false);
      }
    };

    getGoals();
  }, [initialRootGoal, USE_TEST_MODE]);

  // Transform goals to nodes and edges whenever rootGoal or collapsed state changes
  useEffect(() => {
    if (USE_TEST_MODE) return; // Skip if in test mode

    if (rootGoal) {
      try {
        console.log("Transforming goal data to nodes and edges");
        console.log("Root goal:", rootGoal);
        console.log("Goals (children):", rootGoal.children);

        // Create nodes and edges
        const strategyNodes: Node[] = [];
        const strategyEdges: Edge[] = [];

        // Create workspace root node (centered at the top)
        const rootNode: Node = {
          id: "workspace-root",
          type: "goalNode",
          position: { x: 400, y: 50 },
          data: {
            isRoot: true,
            title: rootGoal.workspace?.name || "My workspace",
            description: "",
            progress: 0,
            _id: "workspace-root",
            onEdit: null,
          },
          targetPosition: Position.Top,
          sourcePosition: Position.Bottom,
        };

        strategyNodes.push(rootNode);

        // Get all goals (direct children of workspace)
        const goals = rootGoal.children || [];
        console.log(`Found ${goals.length} goals:`, goals);

        // Calculate horizontal layout for goals
        const GOALS_LEVEL_Y = 250;
        const GOALS_SPACING = 400;

        // Calculate the total width needed for all goals
        const totalWidth = goals.length * GOALS_SPACING;
        // Start position should center the goals array
        let startX = 400 - totalWidth / 2 + GOALS_SPACING / 2;

        if (goals.length === 1) {
          // If only one goal, center it below the root
          startX = 400;
        }

        // Create goal nodes
        goals.forEach((goal, index) => {
          const x = startX + index * GOALS_SPACING;
          const node: Node = {
            id: goal._id,
            type: "goalNode",
            position: { x, y: GOALS_LEVEL_Y },
            data: {
              ...goal,
              ownerName: goal.owner?.fullName || goal.ownerId,
              onEdit: () =>
                onEditGoal && onEditGoal({ ...goal, isPrivate: false }),
            },
            targetPosition: Position.Top,
            sourcePosition: Position.Bottom,
          };

          strategyNodes.push(node);

          // Create simple edge from workspace to this goal with explicit styling
          strategyEdges.push({
            id: `workspace-root-${goal._id}`,
            source: "workspace-root",
            target: goal._id,
            animated: true,
            type: "custom",
            style: {
              stroke: "red",
              strokeWidth: 5,
              strokeDasharray: "5,5",
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "red",
              width: 20,
              height: 20,
            },
            zIndex: 9999,
          });

          // Add progress source layer - show projects or tasks based on goal's progressResource
          const PROGRESS_SOURCE_LEVEL_Y = GOALS_LEVEL_Y + 300; // Position 300px below the goals

          if (
            goal.progressResource === "projects" &&
            goal.projects &&
            goal.projects.length > 0
          ) {
            // Create project nodes for this goal
            const projects = Array.isArray(goal.projects) ? goal.projects : [];

            // If we have projects to display
            if (projects.length > 0) {
              // Calculate spacing for projects under this goal
              const projectSpacing = 320; // Width of each project node + margin
              const totalProjectWidth = projects.length * projectSpacing;
              let projectStartX =
                x - totalProjectWidth / 2 + projectSpacing / 2;

              // If only one project, center it below the goal
              if (projects.length === 1) {
                projectStartX = x;
              }

              // Create project nodes
              projects.forEach((project, projectIndex) => {
                // Handle both string IDs and object references
                const projectId =
                  typeof project === "string" ? project : project._id;
                const projectData =
                  typeof project === "string"
                    ? {
                        _id: project,
                        title: `Project ${projectIndex + 1}`,
                        progress: 0,
                      }
                    : project;

                const projectX = projectStartX + projectIndex * projectSpacing;
                const projectNodeId = `project-${projectId}`;

                const projectNode: Node = {
                  id: projectNodeId,
                  type: "goalNode",
                  position: { x: projectX, y: PROGRESS_SOURCE_LEVEL_Y },
                  data: {
                    _id: projectNodeId,
                    title:
                      projectData.title ||
                      projectData.name ||
                      `Project ${projectIndex + 1}`,
                    description: projectData.description || "",
                    progress: projectData.progress || 0,
                    isProject: true,
                  },
                  targetPosition: Position.Top,
                  sourcePosition: Position.Bottom,
                };

                strategyNodes.push(projectNode);

                // Connect goal to this project
                strategyEdges.push({
                  id: `${goal._id}-${projectNodeId}`,
                  source: goal._id,
                  target: projectNodeId,
                  animated: true,
                  type: "custom",
                  style: {
                    stroke: "red",
                    strokeWidth: 5,
                    strokeDasharray: "5,5",
                  },
                  markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: "red",
                    width: 20,
                    height: 20,
                  },
                  zIndex: 9999,
                });
              });
            }
          } else if (
            goal.progressResource === "tasks" &&
            goal.linkedTasks &&
            goal.linkedTasks.length > 0
          ) {
            // Create task nodes for this goal
            const tasks = Array.isArray(goal.linkedTasks)
              ? goal.linkedTasks
              : [];

            // If we have tasks to display
            if (tasks.length > 0) {
              // Calculate spacing for tasks under this goal
              const taskSpacing = 320; // Width of each task node + margin
              const totalTaskWidth = tasks.length * taskSpacing;
              let taskStartX = x - totalTaskWidth / 2 + taskSpacing / 2;

              // If only one task, center it below the goal
              if (tasks.length === 1) {
                taskStartX = x;
              }

              // Create task nodes
              tasks.forEach((task, taskIndex) => {
                // Handle both string IDs and object references
                const taskId = typeof task === "string" ? task : task._id;
                const taskData =
                  typeof task === "string"
                    ? { _id: task, title: `Task ${taskIndex + 1}`, progress: 0 }
                    : task;

                const taskX = taskStartX + taskIndex * taskSpacing;
                const taskNodeId = `task-${taskId}`;

                const taskNode: Node = {
                  id: taskNodeId,
              type: "goalNode",
                  position: { x: taskX, y: PROGRESS_SOURCE_LEVEL_Y },
              data: {
                    _id: taskNodeId,
                    title: taskData.title || `Task ${taskIndex + 1}`,
                    description: taskData.description || "",
                    progress: taskData.completed ? 100 : 0,
                    isTask: true, // New property to indicate it's a task
                  },
                  targetPosition: Position.Top,
                  sourcePosition: Position.Bottom,
                };

                strategyNodes.push(taskNode);

                // Connect goal to this task
                strategyEdges.push({
                  id: `${goal._id}-${taskNodeId}`,
                  source: goal._id,
                  target: taskNodeId,
                  animated: true,
                  type: "custom",
                  style: {
                    stroke: "red",
                    strokeWidth: 5,
                    strokeDasharray: "5,5",
                  },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                    color: "red",
                    width: 20,
                    height: 20,
                  },
                  zIndex: 9999,
                });
              });
            }
          }
        });

        // If we have no goals, add a placeholder node
        if (goals.length === 0) {
          // Create a placeholder node showing that there are no goals yet
          const placeholderNode: Node = {
            id: "placeholder",
            type: "goalNode",
            position: { x: 400, y: GOALS_LEVEL_Y },
            data: {
              _id: "placeholder",
              title: "No workspace goals yet",
              description: "Create workspace goals to see them here",
              progress: 0,
              isPlaceholder: true, // custom flag for this type of node
            },
            targetPosition: Position.Top,
          };

          strategyNodes.push(placeholderNode);

          // Create edge from workspace to placeholder with explicit styling
          strategyEdges.push({
            id: "workspace-root-placeholder",
            source: "workspace-root",
            target: "placeholder",
            animated: true,
            type: "custom",
            style: {
              stroke: "red",
              strokeWidth: 5,
              strokeDasharray: "5,5",
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "red",
              width: 20,
              height: 20,
            },
            zIndex: 9999,
          });
        }

        console.log("Nodes:", strategyNodes);
        console.log("Edges:", strategyEdges);

        // Set nodes and edges
        setNodes(strategyNodes);
        setEdges(strategyEdges);
      } catch (error) {
        console.error("Error transforming goals to nodes:", error);
      }
    }
  }, [rootGoal, onEditGoal, USE_TEST_MODE]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#4573D2]"></div>
      </div>
    );
  }

  if (!rootGoal && !USE_TEST_MODE) {
    return (
      <div className="flex flex-col items-center justify-center h-64 px-6">
        <p className="text-gray-400 text-center">
          No workspace goals found. Create your first workspace goal to get
          started with your strategy map.
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
            This strategy map shows how all workspace goals align. Only
            workspace goals (visible to all members) are displayed here. Private
            goals are not shown.
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
            <p className="text-gray-400">
              Node Types: {nodes.map((n) => n.type).join(", ")}
            </p>
            <pre className="text-gray-500 mt-2">
              {JSON.stringify(nodes[0] || {}, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div className="h-[700px] w-full border border-[#353535] rounded-lg bg-[#121212] relative">
        <ReactFlow
          style={{
            background: "#121212",
            width: "100%",
            height: "700px",
          }}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={memoizedNodeTypes}
          edgeTypes={memoizedEdgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          edgesFocusable={true}
          edgesUpdatable={true}
          elementsSelectable={true}
          fitView
          fitViewOptions={{ padding: 0.5 }}
          minZoom={0.1}
          maxZoom={1.5}
          defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
          zoomOnScroll={true}
          panOnScroll={true}
          panOnDrag={true}
          nodesDraggable={false}
          nodesConnectable={false}
          proOptions={{ hideAttribution: true }}
          className="with-edge-lines"
        >
          <Controls showInteractive={false} position="bottom-right" />
          <MiniMap
            nodeStrokeWidth={3}
            nodeColor={(node) => {
              // Use different colors for different node types
              if (node.id === "workspace-root") return "#1E1E1E";
              if (node.data?.isProject) return "#212121";
              const progress = node.data?.progress || 0;
              if (progress >= 100) return "#4caf50";
              if (progress >= 70) return "#8bc34a";
              if (progress >= 30) return "#ff9800";
              return "#f44336";
            }}
            maskColor="rgba(0, 0, 0, 0.3)"
            position="bottom-left"
          />
          <Background color="#353535" gap={16} />
          <Panel
            position="top-left"
            className="bg-[#1E1E1E] p-3 rounded-md border border-[#353535]"
          >
            <div className="font-medium text-lg">Strategy Map</div>
          </Panel>
          <Panel
            position="top-right"
            className="bg-[#1E1E1E] p-2 rounded-md border border-[#353535]"
          >
            <div className="text-xs text-gray-300">
              {nodes.length} nodes | {edges.length} connections
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
};
