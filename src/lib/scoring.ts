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
    formula: "(A * B) / 2",
    description:
      "Bold, decisive and results-focused. Brings energy and direction as a driver and leader.",
    cssClass: "red",
  },
  Yellow: {
    formula: "(B * C) / 2",
    description:
      "Expressive, flexible and idea-driven. Connects people as an influencer and communicator.",
    cssClass: "yellow",
  },
  Blue: {
    formula: "(C * D) / 2",
    description:
      "Thoughtful, structured and conscientious. Creates clarity as an analyst and planner.",
    cssClass: "blue",
  },
  Green: {
    formula: "(D * A) / 2",
    description:
      "Patient, dependable and cooperative. Supports the group as a steady team player.",
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
    Red: (dimensions.A * dimensions.B) / 2,
    Yellow: (dimensions.B * dimensions.C) / 2,
    Blue: (dimensions.C * dimensions.D) / 2,
    Green: (dimensions.D * dimensions.A) / 2,
  };

  const highest = Math.max(...Object.values(colours));
  const dominant = (Object.keys(colours) as Colour[]).filter(
    (colour) => colours[colour] === highest,
  );

  return { dimensions, colours, dominant };
}
