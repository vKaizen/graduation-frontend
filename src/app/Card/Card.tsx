import React from "react";

type CardProps = {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
};

export const Card: React.FC<CardProps> = ({ title, children, actions }) => {
  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-md">
      <header className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">{title}</h2>
        {actions}
      </header>
      <div className="mt-4 text-gray-600 dark:text-gray-300">{children}</div>
    </div>
  );
};
