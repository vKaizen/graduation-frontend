"use client";

import React, { useState } from "react";
import { Card } from "../Card/Card";


export const DashboardCardContainer: React.FC = () => {
  const [cards, setCards] = useState([
    { id: 1, title: "Tasks", content: "42 tasks pending" },
    { id: 2, title: "Projects", content: "8 active projects" },
    { id: 3, title: "Members", content: "25 workspace members" },
  ]);

  const removeCard = (id: number) => {
    setCards(cards.filter((card) => card.id !== id));
  };

  const addCard = () => {
    const newCard = { id: Date.now(), title: "New Card", content: "New content" };
    setCards([...cards, newCard]);
  };

  return (
    <div>
      <header className="mb-4 flex justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
        <button
          onClick={addCard}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Add Card
        </button>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Card
            key={card.id}
            title={card.title}
            actions={
              <button
                onClick={() => removeCard(card.id)}
                className="text-red-600 dark:text-red-400"
              >
                Remove
              </button>
            }
          >
            {card.content}
          </Card>
        ))}
      </div>
    </div>
  );
};
