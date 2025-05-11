"use client";

interface MissionSectionProps {
  mission?: string;
}

export const MissionSection = ({ mission }: MissionSectionProps) => {
  return (
    <div className="mb-12 bg-[#1a1a1a] p-6 rounded-lg border border-[#353535]">
      <h2 className="text-xl font-semibold mb-4 text-white">Mission</h2>

      {mission ? (
        <p className="text-gray-300">{mission}</p>
      ) : (
        <p className="text-gray-400 italic">
          Add your company mission to align your work and stay inspired. Only
          members with full access can edit.
        </p>
      )}
    </div>
  );
};
