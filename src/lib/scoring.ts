import type { Dimension } from "../data/questions";
import { questions } from "../data/questions";

export type Rating = 1 | 2 | 3 | 4 | 5;
export type Answers = Partial<Record<number, Rating>>;
export type Colour = "Red" | "Yellow" | "Blue" | "Green";

export type Scores = {
  dimensions: Record<Dimension, number>;
  colours: Record<Colour, number>;
  dominant: Colour[];
};

export const colourDetails: Record<
  Colour,
  { formula: string; description: string; cssClass: string }
> = {
  Red: {
    formula: "(D * A) / 2",
    description:
      "Effective, optimistic, goal-oriented and energetic. You want to succeed and can take the lead decisively.",
    cssClass: "red",
  },
  Yellow: {
    formula: "(A * B) / 2",
    description:
      "Idea-driven, flexible and spontaneous. You value freedom and are comfortable exploring alternatives.",
    cssClass: "yellow",
  },
  Blue: {
    formula: "(B * C) / 2",
    description:
      "Persistent, thoughtful and conscientious. You value stability, safety and time to consider decisions.",
    cssClass: "blue",
  },
  Green: {
    formula: "(C * D) / 2",
    description:
      "Organised and coordinating. You value quality, order and dependable ways of turning ideas into action.",
    cssClass: "green",
  },
};

export function calculateScores(answers: Answers): Scores {
  if (questions.some(({ id }) => answers[id] === undefined)) {
    throw new Error("All 40 statements must be answered before calculating a result.");
  }

  const dimensions: Record<Dimension, number> = { A: 0, B: 0, C: 0, D: 0 };

  questions.forEach(({ id, dimension }) => {
    dimensions[dimension] += answers[id] as Rating;
  });

  const colours: Record<Colour, number> = {
    Red: (dimensions.D * dimensions.A) / 2,
    Yellow: (dimensions.A * dimensions.B) / 2,
    Blue: (dimensions.B * dimensions.C) / 2,
    Green: (dimensions.C * dimensions.D) / 2,
  };

  const highest = Math.max(...Object.values(colours));
  const dominant = (Object.keys(colours) as Colour[]).filter(
    (colour) => colours[colour] === highest,
  );

  return { dimensions, colours, dominant };
}
