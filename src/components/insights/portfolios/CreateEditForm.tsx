import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Briefcase } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { createPortfolio, updatePortfolio } from "@/api-service";
import { ProjectSelector } from "./ProjectSelector";
import { Portfolio, CreatePortfolioDto, UpdatePortfolioDto } from "@/types";

interface CreateEditFormProps {
  isEditing?: boolean;
  portfolio?: Portfolio;
  workspaceId: string;
}

export const CreateEditForm = ({
  isEditing = false,
  portfolio,
  workspaceId,
}: CreateEditFormProps) => {
  const router = useRouter();
  const { toast } = useToast();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

  // Load portfolio data if editing
  useEffect(() => {
    if (isEditing && portfolio) {
      setName(portfolio.name || "");
      setDescription(portfolio.description || "");

      // Set selected projects from portfolio.projects
      if (portfolio.projects) {
        const projectIds = Array.isArray(portfolio.projects)
          ? portfolio.projects.map((p) => (typeof p === "string" ? p : p._id))
          : [];
        setSelectedProjects(projectIds);
      }
    }
  }, [isEditing, portfolio]);

  // Validation function
  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!name.trim()) {
      errors.name = "Portfolio name is required";
    }

    if (selectedProjects.length === 0) {
      errors.projects = "Select at least one project";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && portfolio) {
        // Update existing portfolio
        const updateData: UpdatePortfolioDto = {
          name,
          description,
          projects: selectedProjects,
        };

        await updatePortfolio(portfolio._id, updateData);

        toast({
          title: "Portfolio updated",
          description: "Your portfolio has been updated successfully",
        });
      } else {
        // Create new portfolio
        const createData: CreatePortfolioDto = {
          name,
          description,
          projects: selectedProjects,
          workspaceId,
        };

        await createPortfolio(createData);

        toast({
          title: "Portfolio created",
          description: "Your portfolio has been created successfully",
        });
      }

      // Redirect to portfolios list
      router.push("/insights/portfolios");
    } catch (error) {
      console.error("Error saving portfolio:", error);
      toast({
        title: "Error",
        description: `Failed to ${
          isEditing ? "update" : "create"
        } portfolio. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#1a1a1a] border border-[#353535] rounded-lg p-6">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-[#252525] rounded-md flex items-center justify-center mr-3">
          <Briefcase className="h-5 w-5 text-[#4573D2]" />
        </div>
        <h2 className="text-xl font-bold text-white">
          {isEditing ? "Edit Portfolio" : "Create New Portfolio"}
        </h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Portfolio Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Portfolio Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`
                w-full bg-[#252525] border rounded-md py-2 px-3 text-white 
                focus:outline-none focus:ring-1 focus:ring-[#4573D2] focus:border-[#4573D2]
                ${validationErrors.name ? "border-red-500" : "border-[#353535]"}
              `}
              placeholder="Enter portfolio name"
            />
            {validationErrors.name && (
              <p className="mt-1 text-sm text-red-500">
                {validationErrors.name}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Description (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="
                w-full bg-[#252525] border border-[#353535] rounded-md py-2 px-3 text-white 
                focus:outline-none focus:ring-1 focus:ring-[#4573D2] focus:border-[#4573D2]
                min-h-[80px]
              "
              placeholder="Enter portfolio description"
            />
          </div>

          {/* Project Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Select Projects *
            </label>
            <ProjectSelector
              workspaceId={workspaceId}
              selectedProjectIds={selectedProjects}
              onSelectionChange={setSelectedProjects}
            />
            {validationErrors.projects && (
              <p className="mt-1 text-sm text-red-500">
                {validationErrors.projects}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end pt-4">
            <button
              type="button"
              onClick={() => router.push("/insights/portfolios")}
              className="mr-4 px-4 py-2 text-gray-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="
                bg-[#4573D2] text-white px-6 py-2 rounded-md hover:bg-[#3a63b8]
                transition-colors disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full" />
                  {isEditing ? "Updating..." : "Creating..."}
                </span>
              ) : (
                <span>
                  {isEditing ? "Update Portfolio" : "Create Portfolio"}
                </span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
