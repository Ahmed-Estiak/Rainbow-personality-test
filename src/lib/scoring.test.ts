import { describe, expect, it } from "vitest";
import { questions } from "../data/questions";
import { calculateScores, type Answers, type Rating } from "./scoring";

function answersByDimension(values: Record<string, Rating>): Answers {
  return Object.fromEntries(
    questions.map((question) => [question.id, values[question.dimension]]),
  );
}

describe("calculateScores", () => {
  it("maps the four statement columns to their triangle colour areas", () => {
    const result = calculateScores(
      answersByDimension({ A: 5, B: 4, C: 3, D: 2 }),
    );

    expect(result.dimensions).toEqual({ A: 50, B: 40, C: 30, D: 20 });
    expect(result.colours).toEqual({
      Red: 500,
      Yellow: 1000,
      Blue: 600,
      Green: 300,
    });
    expect(result.dominant).toEqual(["Yellow"]);
  });

  it("returns a tied profile when areas share the highest score", () => {
    const result = calculateScores(
      answersByDimension({ A: 1, B: 1, C: 1, D: 1 }),
    );

    expect(result.colours).toEqual({
      Red: 50,
      Yellow: 50,
      Blue: 50,
      Green: 50,
    });
    expect(result.dominant).toEqual(["Red", "Yellow", "Blue", "Green"]);
  });

  it("does not calculate incomplete attempts", () => {
    expect(() => calculateScores({ 1: 5 })).toThrow(/All 40 statements/);
  });
});
