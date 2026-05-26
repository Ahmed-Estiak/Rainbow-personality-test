export type Dimension = "A" | "B" | "C" | "D";

export type Question = {
  id: number;
  text: string;
  dimension: Dimension;
};

const statements = [
  "I always try to complete what I am working on before taking up a new task.",
  "I feel most comfortable when the situation demands action and quick decisions.",
  "It is important for me to find out how my surroundings react before I make a decision.",
  "I do not like to take on a large task if I do not feel certain that I can cope.",
  "I get annoyed if people talk too much and have difficulties concentrating on the matter.",
  "I do not mind attracting attention.",
  "People often come to me if they want to talk about personal problems.",
  "I get annoyed if I have unexpected visitors just as I was planning an evening by myself.",
  "I do not like doing things which in my opinion are not right, just to avoid trouble.",
  "I seldom miss an occasion to make a joke - also with more serious issues.",
  "I put great emphasis on my intuition when I am to take a standpoint in a difficult matter.",
  "I often find it difficult to let go and enjoy myself when I am out for fun.",
  "I do not like to discuss a delicate matter without having all facts on the table.",
  "I am often the one to take the initiative to get things moving.",
  "I willingly search for the new and untraditional rather than the old and well known.",
  "If I have a problem I can go for ages and speculate.",
  "I get annoyed if my things are messy - even if I am the one responsible for the mess.",
  "I enjoy being a host or hostess and seeing happy people around me.",
  "I often use pictures and illustrations when explaining something.",
  "I often need to be alone in order to concentrate on my thoughts.",
  "It is very important for me that my work is done thoroughly and carefully.",
  "It is important for me to work with something that will bring me in contact with many people.",
  "Even if I often base my judgment on a first impression, I am seldom mistaken with respect to people.",
  "I tend to become insecure if I am plunged into something which I have not tried before.",
  "I like to make a plan that I can follow when solving a difficult task.",
  "I often get involved in working groups when something, such as a party, is to be arranged.",
  "I often find it difficult to hide my deeper emotions.",
  "When something really bothers me I tend to keep it to myself.",
  "I find it difficult to watch someone making a mess of a task that I could do better.",
  "I tend to become restless if I have to wait for my turn.",
  "It means a lot to me what others think about me and about what I say and do.",
  "I tend to become insecure if I cannot overlook the consequences of what happens around me.",
  "I like to be the person in control of things and to create order.",
  "I would like to be known for my ability to make things happen.",
  "I tend to take in a situation rather quickly without an initial careful analysis.",
  "I often find it difficult to take on a task if I cannot see the deeper meaning of it.",
  "I find it difficult to accept the good advice of others when I know quite well myself how a task should be handled.",
  "I find it difficult not to interfere when something is happening which I find exciting.",
  "I tend to follow my immediate impulse because I know that most often I am right.",
  "I do not like to take an important decision without sleeping on it first.",
] as const;

const dimensions: Dimension[] = ["A", "B", "C", "D"];

export const questions: Question[] = statements.map((text, index) => ({
  id: index + 1,
  text,
  dimension: dimensions[index % dimensions.length],
}));

