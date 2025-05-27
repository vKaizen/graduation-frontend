"use client";

import { useEffect, useState, useMemo } from "react";
import { Info } from "lucide-react";
import {
  fetchGoalHierarchy,
  fetchProjects,
  fetchTasks,
  fetchTasksByProject,
} from "@/api-service";
import { Goal, GoalStatus, GoalTimeframe, Project, Task } from "@/types";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Panel,
  MarkerType,
  NodeTypes,
  Position,
  getBezierPath,
  EdgeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import { StrategyMapNode } from "./StrategyMapNode";

// Enhanced spacing calculation specifically for goal nodes (middle layer)
const calculateGoalSpacing = (itemCount: number, minSpacing: number = 600) => {
  if (itemCount <= 1) return minSpacing;
  if (itemCount <= 2) return Math.max(minSpacing, 800);
  if (itemCount <= 3) return Math.max(minSpacing, 900);
  if (itemCount <= 4) return Math.max(minSpacing, 1000);
  if (itemCount <= 5) return Math.max(minSpacing, 1100);
  return Math.max(minSpacing, 1200);
};

// Dynamic spacing calculation function
const calculateSpacing = (itemCount: number, minSpacing: number = 400) => {
  if (itemCount <= 1) return minSpacing;
  if (itemCount <= 3) return Math.max(minSpacing, 500);
  if (itemCount <= 5) return Math.max(minSpacing, 600);
  return Math.max(minSpacing, 700);
};

// Calculate adaptive vertical spacing based on bottom layer width
const calculateAdaptiveSpacing = (
  bottomLayerWidth: number,
  goalLayerWidth: number
) => {
  const baseSpacing = 300;
  const widthRatio = bottomLayerWidth / Math.max(goalLayerWidth, 1000);

  if (widthRatio > 2) {
    return baseSpacing + (widthRatio - 2) * 100;
  }

  return baseSpacing;
};

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
}: EdgeProps) => {
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
        stroke: "#4573D2",
        strokeWidth: 2,
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
  goalNode: StrategyMapNode,
};

// Define edge types
const edgeTypes = {
  custom: CustomEdge,
};

// Configuration flags
const USE_TEST_MODE = false;

interface StrategyMapViewProps {
  initialRootGoal?: Goal;
  highlightGoalId?: string;
  onEditGoal?: (goal: Goal) => void;
  onCreateGoal?: () => void;
}

export const StrategyMapView = ({
  initialRootGoal,
  onEditGoal,
}: StrategyMapViewProps) => {
  const [loading, setLoading] = useState(true);
  const [rootGoal, setRootGoal] = useState<Goal | null>(
    initialRootGoal || null
  );
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [debugMode, setDebugMode] = useState(false);
  const [projectsMap, setProjectsMap] = useState<Record<string, Project>>({});
  const [tasksMap, setTasksMap] = useState<Record<string, Task>>({});

  // Memoize nodeTypes to prevent render loops
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);
  const memoizedEdgeTypes = useMemo(() => edgeTypes, []);

  // Function to toggle expand/collapse state
  const handleToggleExpand = (nodeId: string) => {
    // This function is now a no-op since we're showing all nodes
    console.log(
      `Toggle expand called for node ${nodeId} but ignored as all nodes are shown`
    );
  };

  // Default edge options for all edges
  const defaultEdgeOptions = {
    type: "custom",
    animated: true,
    style: {
      stroke: "#4573D2",
      strokeWidth: 2,
      strokeDasharray: "5,5",
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "#4573D2",
      width: 20,
      height: 20,
    },
    zIndex: 9999,
  };

  // Fetch projects and tasks data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all projects
        console.log("Fetching projects...");
        const projects = await fetchProjects();
        console.log(`Fetched ${projects.length} projects:`, projects);

        // Create a map of project ID to project data
        const projectsMapData = projects.reduce((map, project) => {
          map[project._id] = project;
          return map;
        }, {} as Record<string, Project>);

        setProjectsMap(projectsMapData);
        console.log(
          "Projects map created with",
          Object.keys(projectsMapData).length,
          "entries"
        );

        // Determine which workspace ID to use for fetching tasks
        let workspaceId: string | undefined;

        // If we have a rootGoal with a workspace, use that workspace ID
        if (rootGoal && rootGoal.workspace && rootGoal.workspace._id) {
          workspaceId = rootGoal.workspace._id;
          console.log(`Using workspace ID from rootGoal: ${workspaceId}`);
        }
        // Otherwise, use the first project's workspace ID if available
        else if (projects.length > 0 && projects[0].workspaceId) {
          workspaceId = projects[0].workspaceId;
          console.log(`Using workspace ID from first project: ${workspaceId}`);
        }

        // Fetch all tasks with error handling
        console.log("Fetching tasks...");
        try {
          const tasks = await fetchTasks(workspaceId);
          console.log(`Fetched ${tasks.length} tasks:`, tasks);

          // Create a map of task ID to task data
          const tasksMapData = tasks.reduce((map, task) => {
            map[task._id] = task;
            return map;
          }, {} as Record<string, Task>);

          setTasksMap(tasksMapData);
          console.log(
            "Tasks map created with",
            Object.keys(tasksMapData).length,
            "entries"
          );
        } catch (taskError) {
          console.error("Error fetching tasks:", taskError);
          console.log("Continuing with empty tasks map");
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };

    fetchData();
  }, [rootGoal]);

  // Test mode for minimal case
  useEffect(() => {
    if (USE_TEST_MODE) {
      const testNodes = [
        {
          id: "test-1",
          type: "goalNode",
          position: { x: 250, y: 100 },
          data: { label: "Test Node 1", title: "Test Node 1" },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        },
        {
          id: "test-2",
          type: "goalNode",
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
    if (USE_TEST_MODE) return;

    const getGoals = async () => {
      try {
        setLoading(true);
        if (!initialRootGoal) {
          console.log("Fetching goal hierarchy from API");
          const hierarchyData = await fetchGoalHierarchy({
            isPrivate: false,
            includeProjects: true,
            includeTasks: true,
          });

          if (Array.isArray(hierarchyData) && hierarchyData.length > 0) {
            console.log(
              "Retrieved goal hierarchy with root goal:",
              hierarchyData[0]._id
            );
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
              ownerId: "system",
              status: "no-status" as GoalStatus,
              timeframe: "custom" as GoalTimeframe,
              workspace: {
                _id: "workspace",
                name: "My Workspace",
                owner: "system",
                members: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              children: [],
            });
          }
        } else {
          console.log("Using provided initialRootGoal");
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
          ownerId: "system",
          status: "no-status" as GoalStatus,
          timeframe: "custom" as GoalTimeframe,
          workspace: {
            _id: "workspace",
            name: "My Workspace",
            owner: "system",
            members: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          children: [],
        });
      } finally {
        setLoading(false);
      }
    };

    getGoals();
  }, [initialRootGoal, USE_TEST_MODE]);

  // Replace the useEffect that transforms goals to nodes and edges with a version that handles async operations
  useEffect(() => {
    if (USE_TEST_MODE) return;

    const transformGoalsToNodes = async () => {
      if (rootGoal) {
        try {
          console.log("Transforming goal data to nodes and edges");
          console.log("Root goal:", rootGoal);
          console.log("Goals (children):", rootGoal.children);
          console.log("Projects map:", projectsMap);
          console.log("Tasks map:", tasksMap);

          const strategyNodes: Node[] = [];
          const strategyEdges: Edge[] = [];

          const goals = rootGoal.children || [];
          console.log(`Found ${goals.length} goals:`, goals);

          const GOALS_LEVEL_Y = 250;
          const GOALS_SPACING = calculateGoalSpacing(goals.length);

          const totalGoalWidth = goals.length * GOALS_SPACING;
          let startX = 400 - totalGoalWidth / 2 + GOALS_SPACING / 2;

          if (goals.length === 1) {
            startX = 400;
          }

          // Calculate total bottom layer nodes (only count nodes that are actually connected to goals)
          let totalBottomNodes = 0;
          goals.forEach((goal) => {
            // Only count projects or tasks if the goal has them configured AND there are actual items
            if (
              goal.progressResource === "projects" &&
              goal.projects &&
              goal.projects.length > 0
            ) {
              totalBottomNodes += goal.projects.length;
              console.log(
                `Goal ${goal._id}: Adding ${goal.projects.length} projects to bottom node count`
              );
            } else if (
              goal.progressResource === "tasks" &&
              goal.linkedTasks &&
              goal.linkedTasks.length > 0
            ) {
              totalBottomNodes += goal.linkedTasks.length;
              console.log(
                `Goal ${goal._id}: Adding ${goal.linkedTasks.length} tasks to bottom node count`
              );
            } else {
              console.log(
                `Goal ${goal._id}: No bottom nodes to add. Progress source: ${
                  goal.progressResource
                }, Projects: ${goal.projects?.length || 0}, Tasks: ${
                  goal.linkedTasks?.length || 0
                }`
              );
            }
          });

          console.log(`Total bottom nodes calculated: ${totalBottomNodes}`);

          const bottomSpacing = calculateSpacing(totalBottomNodes, 450);
          const totalBottomWidth = totalBottomNodes * bottomSpacing;
          const adaptiveVerticalSpacing = calculateAdaptiveSpacing(
            totalBottomWidth,
            totalGoalWidth
          );
          const PROGRESS_SOURCE_LEVEL_Y =
            GOALS_LEVEL_Y + adaptiveVerticalSpacing;

          console.log(
            `Goal layer: ${goals.length} nodes, spacing: ${GOALS_SPACING}px, total width: ${totalGoalWidth}px`
          );
          console.log(
            `Bottom layer: ${totalBottomNodes} visible nodes, width: ${totalBottomWidth}px`
          );
          console.log(
            `Adaptive vertical spacing: ${adaptiveVerticalSpacing}px`
          );

          const rootX =
            goals.length > 0
              ? startX + ((goals.length - 1) * GOALS_SPACING) / 2
              : 400;

          // Create workspace root node
          const rootNode: Node = {
            id: "workspace-root",
            type: "goalNode",
            position: { x: rootX, y: 50 },
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

          // Create goal nodes
          for (const goal of goals) {
            const index = goals.indexOf(goal);
            const x = startX + index * GOALS_SPACING;

            // Check if this goal has children
            const hasChildren =
              (goal.progressResource === "projects" &&
                goal.projects &&
                goal.projects.length > 0) ||
              (goal.progressResource === "tasks" &&
                goal.linkedTasks &&
                goal.linkedTasks.length > 0);

            console.log(
              `Goal ${goal._id}: hasChildren=${hasChildren}, progressResource=${
                goal.progressResource
              }, projectsCount=${goal.projects?.length || 0}, tasksCount=${
                goal.linkedTasks?.length || 0
              }`
            );

            // Always treat as expanded
            const isExpanded = true;

            const goalNode: Node = {
              id: goal._id,
              type: "goalNode",
              position: { x, y: GOALS_LEVEL_Y },
              data: {
                ...goal,
                ownerName: goal.owner?.fullName || goal.ownerId,
                onEdit: () =>
                  onEditGoal && onEditGoal({ ...goal, isPrivate: false }),
                hasChildren,
                isExpanded,
                onToggleExpand: handleToggleExpand,
              },
              targetPosition: Position.Top,
              sourcePosition: Position.Bottom,
            };

            strategyNodes.push(goalNode);

            // Create edge from workspace to this goal
            strategyEdges.push({
              id: `workspace-root-${goal._id}`,
              source: "workspace-root",
              target: goal._id,
              animated: true,
              type: "custom",
              style: {
                stroke: "#4573D2",
                strokeWidth: 2,
                strokeDasharray: "5,5",
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: "#4573D2",
                width: 20,
                height: 20,
              },
              zIndex: 9999,
            });

            // Only create child nodes if the goal has a progress resource and connected items
            console.log(`Goal ${goal._id} checking for projects and tasks`);
            console.log(`Goal progress resource: ${goal.progressResource}`);
            console.log(
              `Projects: ${goal.projects ? goal.projects.length : 0}, Tasks: ${
                goal.linkedTasks ? goal.linkedTasks.length : 0
              }`
            );

            // Only process projects if the goal is set to track progress from projects AND has projects
            if (
              goal.progressResource === "projects" &&
              goal.projects &&
              goal.projects.length > 0
            ) {
              const projectIds = goal.projects;
              console.log(
                `Processing ${projectIds.length} projects for goal ${goal._id}`
              );
              console.log("Project IDs:", projectIds);

              if (projectIds.length > 0) {
                const projectSpacing = calculateSpacing(projectIds.length, 450);
                const totalProjectWidth = projectIds.length * projectSpacing;
                let projectStartX =
                  x - totalProjectWidth / 2 + projectSpacing / 2;

                if (projectIds.length === 1) {
                  projectStartX = x;
                }

                projectIds.forEach((projectId, projectIndex) => {
                  // Get the project data from the map
                  const projectData = projectsMap[projectId] || {
                    _id: projectId,
                    name: `Project ${projectIndex + 1}`,
                    description: "",
                    color: "#4573D2",
                    status: "on-track",
                    progress: 0,
                  };

                  console.log(`Project ${projectIndex} data:`, projectData);

                  const projectX =
                    projectStartX + projectIndex * projectSpacing;
                  const projectNodeId = `project-${projectId}`;

                  const projectNode: Node = {
                    id: projectNodeId,
                    type: "goalNode",
                    position: { x: projectX, y: PROGRESS_SOURCE_LEVEL_Y },
                    data: {
                      _id: projectNodeId,
                      title: projectData.name || `Project ${projectIndex + 1}`,
                      description: projectData.description || "",
                      status: projectData.status || "on-track",
                      isProject: true,
                    },
                    targetPosition: Position.Top,
                    sourcePosition: Position.Bottom,
                  };

                  strategyNodes.push(projectNode);

                  strategyEdges.push({
                    id: `${goal._id}-${projectNodeId}`,
                    source: goal._id,
                    target: projectNodeId,
                    animated: true,
                    type: "custom",
                    style: {
                      stroke: "#4573D2",
                      strokeWidth: 2,
                      strokeDasharray: "5,5",
                    },
                    markerEnd: {
                      type: MarkerType.ArrowClosed,
                      color: "#4573D2",
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
              const taskIds = goal.linkedTasks;
              console.log(
                `Processing ${taskIds.length} tasks for goal ${goal._id}`
              );
              console.log("Task IDs:", taskIds);

              if (taskIds.length > 0) {
                const taskSpacing = calculateSpacing(taskIds.length, 450);
                const totalTaskWidth = taskIds.length * taskSpacing;
                let taskStartX = x - totalTaskWidth / 2 + taskSpacing / 2;

                if (taskIds.length === 1) {
                  taskStartX = x;
                }

                // First try to get tasks from the map
                const tasksFromMap = taskIds
                  .map((id) => tasksMap[id])
                  .filter(Boolean);

                let tasksToUse: Task[];

                if (tasksFromMap.length === taskIds.length) {
                  // We have all tasks in the map, use those
                  console.log("All tasks found in map, using cached data");
                  tasksToUse = tasksFromMap;
                } else {
                  // We're missing some tasks, try to fetch them
                  console.log("Some tasks not in map, fetching from projects");

                  // Fetch all projects to look for tasks
                  const projects = await fetchProjects();

                  if (projects.length === 0) {
                    console.log("No projects found to fetch tasks from");
                    tasksToUse = tasksFromMap;
                  } else {
                    // Create a set of task IDs we need to find
                    const remainingTaskIds = new Set(
                      taskIds.filter((id) => !tasksMap[id])
                    );

                    console.log(
                      `Looking for ${remainingTaskIds.size} missing tasks in ${projects.length} projects`
                    );

                    // For each project, try to fetch its tasks
                    const foundTasks: Task[] = [...tasksFromMap];

                    for (const project of projects) {
                      if (remainingTaskIds.size === 0) break;

                      console.log(`Fetching tasks for project ${project._id}`);
                      const projectTasks = await fetchTasksByProject(
                        project._id
                      );

                      for (const task of projectTasks) {
                        if (remainingTaskIds.has(task._id)) {
                          console.log(
                            `Found missing task ${task._id} in project ${project._id}`
                          );
                          foundTasks.push(task);
                          remainingTaskIds.delete(task._id);
                        }
                      }
                    }

                    console.log(
                      `Found ${foundTasks.length} out of ${taskIds.length} tasks`
                    );
                    tasksToUse = foundTasks;
                  }
                }

                // Create a map for quick lookup
                const tasksById = tasksToUse.reduce((map, task) => {
                  map[task._id] = task;
                  return map;
                }, {} as Record<string, Task>);

                // For each task ID, create a node
                taskIds.forEach((taskId, taskIndex) => {
                  // Get the task data if we have it
                  const taskData = tasksById[taskId];

                  // If we don't have the task data, use default
                  const displayTaskData = taskData || {
                    _id: taskId,
                    title: `Task ${taskIndex + 1}`,
                    description: "",
                    status: "not started",
                    completed: false,
                  };

                  console.log(`Task ${taskIndex} data:`, displayTaskData);
                  console.log(
                    `Task ${taskIndex} title:`,
                    displayTaskData.title
                  );
                  console.log(
                    `Task ${taskIndex} title type:`,
                    typeof displayTaskData.title
                  );

                  const taskX = taskStartX + taskIndex * taskSpacing;
                  const taskNodeId = `task-${taskId}`;

                  // Determine the task status
                  let taskStatus = "not started";
                  if (displayTaskData.status) {
                    taskStatus = displayTaskData.status;
                  } else if (displayTaskData.completed) {
                    taskStatus = "completed";
                  }

                  // Get the task title in a simpler way
                  let taskTitle = `Task ${taskIndex + 1}`;

                  // Use displayTaskData.title if it exists, otherwise use default
                  if (displayTaskData.title) {
                    // Convert to string if needed
                    taskTitle = String(displayTaskData.title);
                  }

                  // Create the node data
                  const nodeData = {
                    _id: taskNodeId,
                    title: taskTitle,
                    description: displayTaskData.description || "",
                    status: taskStatus,
                    isTask: true,
                    priority: displayTaskData.priority,
                    dueDate: displayTaskData.dueDate,
                    progress: 0, // Add progress property which might be required
                  };

                  console.log(`Task ${taskIndex} node data:`, nodeData);
                  console.log(`Task ${taskIndex} node title:`, nodeData.title);

                  const taskNode: Node = {
                    id: taskNodeId,
                    type: "goalNode",
                    position: { x: taskX, y: PROGRESS_SOURCE_LEVEL_Y },
                    data: nodeData,
                    targetPosition: Position.Top,
                    sourcePosition: Position.Bottom,
                  };

                  console.log(`Final task node:`, taskNode);
                  console.log(`Final task node data:`, taskNode.data);
                  console.log(`Final task node title:`, taskNode.data.title);

                  strategyNodes.push(taskNode);

                  strategyEdges.push({
                    id: `${goal._id}-${taskNodeId}`,
                    source: goal._id,
                    target: taskNodeId,
                    animated: true,
                    type: "custom",
                    style: {
                      stroke: "#4573D2",
                      strokeWidth: 2,
                      strokeDasharray: "5,5",
                    },
                    markerEnd: {
                      type: MarkerType.ArrowClosed,
                      color: "#4573D2",
                      width: 20,
                      height: 20,
                    },
                    zIndex: 9999,
                  });
                });
              }
            }
          }

          // If we have no goals, add a placeholder node
          if (goals.length === 0) {
            const placeholderNode: Node = {
              id: "placeholder",
              type: "goalNode",
              position: { x: 400, y: GOALS_LEVEL_Y },
              data: {
                _id: "placeholder",
                title: "No workspace goals yet",
                description: "Create workspace goals to see them here",
                progress: 0,
                isPlaceholder: true,
              },
              targetPosition: Position.Top,
            };

            strategyNodes.push(placeholderNode);

            strategyEdges.push({
              id: "workspace-root-placeholder",
              source: "workspace-root",
              target: "placeholder",
              animated: true,
              type: "custom",
              style: {
                stroke: "#4573D2",
                strokeWidth: 2,
                strokeDasharray: "5,5",
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: "#4573D2",
                width: 20,
                height: 20,
              },
              zIndex: 9999,
            });
          }

          console.log("Final nodes:", strategyNodes);
          console.log("Final edges:", strategyEdges);

          setNodes(strategyNodes);
          setEdges(strategyEdges);
        } catch (error) {
          console.error("Error transforming goals to nodes:", error);
        }
      }
    };

    transformGoalsToNodes();
  }, [rootGoal, onEditGoal, USE_TEST_MODE, projectsMap, tasksMap]);

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

          {/* Debug button only */}
          <div className="ml-auto">
            <button
              onClick={() => setDebugMode(!debugMode)}
              className="py-1 px-2 bg-gray-700 text-xs rounded hover:bg-gray-600"
            >
              {debugMode ? "Hide Debug" : "Debug"}
            </button>
          </div>
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
