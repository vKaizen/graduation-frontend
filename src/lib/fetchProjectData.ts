export async function fetchProjectData(projectId: string) {
  const projects: Record<string, { id: string; name: string; color: string }> =
    {
      AboRas: { id: "AboRas", name: "AboRas", color: "bg-purple-500" },
      "Cross-functional": {
        id: "Cross-functional",
        name: "Cross-functional",
        color: "bg-teal-500",
      },
    };
  return projects[projectId] || null;
}
