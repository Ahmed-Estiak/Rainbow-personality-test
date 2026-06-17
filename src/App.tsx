import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
  type WheelEvent,
} from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { questions, type Dimension, type Question } from "./data/questions";
import {
  calculateScores,
  colourDetails,
  type Answers,
  type Colour,
  type Rating,
  type Scores,
} from "./lib/scoring";

const PAGE_SIZE = 5;
const TOTAL_PAGES = questions.length / PAGE_SIZE;
const STORAGE_KEY = "rainbow-test-answers";
const SPI_STORAGE_KEY = "rainbow-test-spi-points";
const SPI_RESULT_STORAGE_KEY = "rainbow-test-spi-result-visible";
const VARK_STORAGE_KEY = "rainbow-test-vark-answers";
const ratings: { value: Rating; label: string }[] = [
  { value: 1, label: "Hardly ever / never true" },
  { value: 2, label: "Sometimes true" },
  { value: 3, label: "True approximately half the time" },
  { value: 4, label: "Often true" },
  { value: 5, label: "Almost always true" },
];
const personalityProfiles: {
  colour: Colour;
  name: string;
  title: string;
  description: string;
  image: string;
  detailImage: string;
  interpretation: string;
}[] = [
  {
    colour: "Red",
    name: "Fiery Red",
    title: "The Driver / Leader",
    description:
      "Bold, decisive and results-focused. Brings energy and direction to a team.",
    image: "avatars/red.jpg",
    detailImage: "avatars/red-detail.jpg",
    interpretation:
      "Effective, optimistic, goal-oriented and energetic. A decisive leader who wants the team to succeed, but can become dominating or hotheaded.",
  },
  {
    colour: "Yellow",
    name: "Sunshine Yellow",
    title: "The Influencer / Communicator",
    description:
      "Expressive, flexible and idea-driven. Connects people through enthusiasm.",
    image: "avatars/yellow.jpg",
    detailImage: "avatars/yellow-detail.jpg",
    interpretation:
      "Full of ideas, flexible and spontaneous. A natural communicator who energises others, values freedom and is not fond of rigid procedures.",
  },
  {
    colour: "Green",
    name: "Earth Green",
    title: "The Supporter / Team Player",
    description:
      "Patient, dependable and cooperative. Helps a team stay supported and coordinated.",
    image: "avatars/green.jpg",
    detailImage: "avatars/green-detail.jpg",
    interpretation:
      "Supportive and dependable in a team, with a talent for sorting ideas and coordinating activities. Values order and may be critical of quality.",
  },
  {
    colour: "Blue",
    name: "Cool Blue",
    title: "The Analyst / Planner",
    description:
      "Thoughtful, structured and careful. Turns complexity into clear plans and decisions.",
    image: "avatars/blue.jpg",
    detailImage: "avatars/blue-detail.jpg",
    interpretation:
      "Persistent, stable and conscientious. An analytical planner who values quality, safety and well-considered decisions, and may be sensitive to criticism.",
  },
];

type VarkMode = "V" | "A" | "R" | "K";
type SpiRole = "IMP" | "CO" | "SH" | "PL" | "RI" | "ME" | "TW" | "CF" | "SP";
type SpiSection = "I" | "II" | "III" | "IV" | "V" | "VI" | "VII";
type SpiLetter = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i";

const varkLabels: Record<VarkMode, string> = {
  V: "Visual",
  A: "Aural",
  R: "Read/Write",
  K: "Kinesthetic",
};

const varkQuestions: {
  id: number;
  text: string;
  options: Record<"a" | "b" | "c" | "d", string>;
}[] = [
  {
    id: 1,
    text: "You are helping someone who wants to go to your airport, the centre of town or railway station. You would:",
    options: {
      a: "Go with her.",
      b: "Tell her the directions.",
      c: "Write down the directions.",
      d: "Draw, show, or give her a map.",
    },
  },
  {
    id: 2,
    text: "A website has a video showing how to make a special graph. You would learn most from:",
    options: {
      a: "Seeing the diagrams.",
      b: "Listening.",
      c: "Reading the words.",
      d: "Watching the actions.",
    },
  },
  {
    id: 3,
    text: "You are planning a vacation for a group and want feedback about the plan. You would:",
    options: {
      a: "Describe some of the highlights they will experience.",
      b: "Use a map to show them the places.",
      c: "Give them a copy of the printed itinerary.",
      d: "Phone, text or email them.",
    },
  },
  {
    id: 4,
    text: "You are going to cook something as a special treat. You would:",
    options: {
      a: "Cook something you know without instructions.",
      b: "Ask friends for suggestions.",
      c: "Look online or in cookbooks for ideas from pictures.",
      d: "Use a good recipe.",
    },
  },
  {
    id: 5,
    text: "A group of tourists want to learn about parks or wildlife reserves in your area. You would:",
    options: {
      a: "Talk about, or arrange a talk about, parks or wildlife reserves.",
      b: "Show them maps and internet pictures.",
      c: "Take them to a park or wildlife reserve and walk with them.",
      d: "Give them a book or pamphlets about the parks or wildlife reserves.",
    },
  },
  {
    id: 6,
    text: "You are about to purchase a digital camera or mobile phone. Other than price, what would most influence your decision?",
    options: {
      a: "Trying or testing it.",
      b: "Reading the details or checking its features online.",
      c: "It is a modern design and looks good.",
      d: "The salesperson telling me about its features.",
    },
  },
  {
    id: 7,
    text: "Remember a time when you learned how to do something new, avoiding a physical skill. You learned best by:",
    options: {
      a: "Watching a demonstration.",
      b: "Listening to somebody explaining it and asking questions.",
      c: "Diagrams, maps and charts.",
      d: "Written instructions, such as a manual or book.",
    },
  },
  {
    id: 8,
    text: "You have a problem with your heart. You would prefer that the doctor:",
    options: {
      a: "Gave you something to read to explain what was wrong.",
      b: "Used a plastic model to show what was wrong.",
      c: "Described what was wrong.",
      d: "Showed you a diagram of what was wrong.",
    },
  },
  {
    id: 9,
    text: "You want to learn a new program, skill or game on a computer. You would:",
    options: {
      a: "Read the written instructions that came with the program.",
      b: "Talk with people who know about the program.",
      c: "Use the controls or keyboard.",
      d: "Follow the diagrams in the book that came with it.",
    },
  },
  {
    id: 10,
    text: "I like websites that have:",
    options: {
      a: "Things I can click on, shift or try.",
      b: "Interesting design and visual features.",
      c: "Interesting written descriptions, lists and explanations.",
      d: "Audio channels where I can hear music, radio programs or interviews.",
    },
  },
  {
    id: 11,
    text: "Other than price, what would most influence your decision to buy a new non-fiction book?",
    options: {
      a: "The way it looks is appealing.",
      b: "Quickly reading parts of it.",
      c: "A friend talks about it and recommends it.",
      d: "It has real-life stories, experiences and examples.",
    },
  },
  {
    id: 12,
    text: "You are using a book, CD or website to learn how to take photos with your new digital camera. You would like to have:",
    options: {
      a: "A chance to ask questions and talk about the camera and its features.",
      b: "Clear written instructions with lists and bullet points.",
      c: "Diagrams showing the camera and what each part does.",
      d: "Many examples of good and poor photos and how to improve them.",
    },
  },
  {
    id: 13,
    text: "Do you prefer a teacher or presenter who uses:",
    options: {
      a: "Demonstrations, models or practical sessions.",
      b: "Question and answer, talk, group discussion or guest speakers.",
      c: "Handouts, books or readings.",
      d: "Diagrams, charts or graphs.",
    },
  },
  {
    id: 14,
    text: "You have finished a competition or test and would like feedback. You would like feedback:",
    options: {
      a: "Using examples from what you have done.",
      b: "Using a written description of your results.",
      c: "From somebody who talks it through with you.",
      d: "Using graphs showing what you had achieved.",
    },
  },
  {
    id: 15,
    text: "You are going to choose food at a restaurant or cafe. You would:",
    options: {
      a: "Choose something that you have had there before.",
      b: "Listen to the waiter or ask friends to recommend choices.",
      c: "Choose from the descriptions in the menu.",
      d: "Look at what others are eating or look at pictures of each dish.",
    },
  },
  {
    id: 16,
    text: "You have to make an important speech at a conference or special occasion. You would:",
    options: {
      a: "Make diagrams or get graphs to help explain things.",
      b: "Write a few key words and practice saying your speech over and over.",
      c: "Write out your speech and learn from reading it over several times.",
      d: "Gather examples and stories to make the talk real and practical.",
    },
  },
];

const varkScoring: Record<number, Record<"a" | "b" | "c" | "d", VarkMode>> = {
  1: { a: "K", b: "A", c: "R", d: "V" },
  2: { a: "V", b: "A", c: "R", d: "K" },
  3: { a: "K", b: "V", c: "R", d: "A" },
  4: { a: "K", b: "A", c: "V", d: "R" },
  5: { a: "A", b: "V", c: "K", d: "R" },
  6: { a: "K", b: "R", c: "V", d: "A" },
  7: { a: "K", b: "A", c: "V", d: "R" },
  8: { a: "R", b: "K", c: "A", d: "V" },
  9: { a: "R", b: "A", c: "K", d: "V" },
  10: { a: "K", b: "V", c: "R", d: "A" },
  11: { a: "V", b: "R", c: "A", d: "K" },
  12: { a: "A", b: "R", c: "V", d: "K" },
  13: { a: "K", b: "A", c: "R", d: "V" },
  14: { a: "K", b: "R", c: "A", d: "V" },
  15: { a: "K", b: "A", c: "R", d: "V" },
  16: { a: "V", b: "A", c: "R", d: "K" },
};

const spiRoles: SpiRole[] = ["IMP", "CO", "SH", "PL", "RI", "ME", "TW", "CF", "SP"];
const spiRoleNames: Record<SpiRole, string> = {
  IMP: "Implementer",
  CO: "Coordinator",
  SH: "Shaper",
  PL: "Plant",
  RI: "Resource Investigator",
  ME: "Monitor Evaluator",
  TW: "Team Worker",
  CF: "Completer Finisher",
  SP: "Specialist",
};
const spiSections: SpiSection[] = ["I", "II", "III", "IV", "V", "VI", "VII"];
const spiLetters: SpiLetter[] = ["a", "b", "c", "d", "e", "f", "g", "h", "i"];
const spiQuestionGroups: {
  section: SpiSection;
  title: string;
  statements: Record<SpiLetter, string>;
}[] = [
  {
    section: "I",
    title: "What I believe I can contribute to a team",
    statements: {
      a: "I think I can quickly see and take advantage of new opportunities.",
      b: "I can work well with a very wide range of people.",
      c: "Producing ideas is one of my natural assets.",
      d: "I can draw people out whenever I detect they have something of value to contribute.",
      e: "I can be relied upon to finish any task I undertake.",
      f: "My technical knowledge and experience are usually my major assets.",
      g: "I am prepared to be blunt and outspoken in the cause of making the right things happen.",
      h: "I can usually tell whether a plan or idea will fit a particular situation.",
      i: "I can offer a reasoned and unbiased case for alternative courses of action.",
    },
  },
  {
    section: "II",
    title: "If I have a possible shortcoming in teamwork, it could be that",
    statements: {
      a: "I am not at ease unless meetings are well structured, controlled and well conducted.",
      b: "I am inclined to be too generous towards others who have a valid viewpoint.",
      c: "I am reluctant to contribute unless the subject contains an area I know well.",
      d: "I have a tendency to talk a lot once the group gets on to a new topic.",
      e: "My objective outlook makes it difficult for me to join in readily with colleagues.",
      f: "I am sometimes seen as forceful and authoritarian when dealing with important issues.",
      g: "I find it difficult to lead from the front because I am responsive to group atmosphere.",
      h: "I get too caught up in ideas that occur to me and lose track of what is happening.",
      i: "I am reluctant to express opinions on proposals that are incomplete or insufficiently detailed.",
    },
  },
  {
    section: "III",
    title: "When involved in a project with other people",
    statements: {
      a: "I have an aptitude for influencing people without pressurising them.",
      b: "I am generally effective in preventing careless mistakes or omissions.",
      c: "I like to press for action so the meeting does not lose sight of the main objective.",
      d: "I can be counted on to contribute something original.",
      e: "I am always ready to back a good suggestion in the common interest.",
      f: "I am quick to see the possibilities in new ideas and developments.",
      g: "I try to maintain my sense of professionalism.",
      h: "My capacity for judgment can help to bring about the right decisions.",
      i: "I can be relied on to bring an organised approach to the demands of a job.",
    },
  },
  {
    section: "IV",
    title: "My characteristic approach to group work is that",
    statements: {
      a: "I maintain a quiet interest in getting to know colleagues better.",
      b: "I contribute where I know what I am talking about.",
      c: "I am not reluctant to challenge the view of others or hold a minority view.",
      d: "I can usually find an argument to refute unsound propositions.",
      e: "I have a talent for making things work once a plan has been put into operation.",
      f: "I prefer to avoid the obvious and open up lines that have not been explored.",
      g: "I bring a touch of perfectionism to any job I undertake.",
      h: "I like to be the one who makes contacts outside the group or firm.",
      i: "I listen to all views but have no hesitation making up my mind when a decision is needed.",
    },
  },
  {
    section: "V",
    title: "I gain satisfaction in a job because",
    statements: {
      a: "I enjoy analysing situations and weighing up all the possible choices.",
      b: "I am interested in finding practical solutions to problems.",
      c: "I like to feel I am fostering good working relationships.",
      d: "I can have a strong influence on decisions.",
      e: "I have a chance of meeting new people with different ideas.",
      f: "I can get people to agree on priorities.",
      g: "I feel in my element where I can give a task my full attention.",
      h: "I can find an opportunity to stretch my imagination.",
      i: "I feel that I am using my special qualifications and training to advantage.",
    },
  },
  {
    section: "VI",
    title: "If I am suddenly given a difficult task with limited time and unfamiliar people",
    statements: {
      a: "I like to read up as much as I conveniently can on a subject.",
      b: "I would devise a solution of my own and then try to sell it to the group.",
      c: "I would be ready to work with the person who showed the most positive approach.",
      d: "I would reduce the task by establishing how different individuals can contribute.",
      e: "My natural sense of urgency would help ensure we did not fall behind schedule.",
      f: "I would keep my cool and maintain my capacity to think straight.",
      g: "In spite of conflicting pressures I would press ahead with whatever needed to be done.",
      h: "I would take the lead if the group was making no progress.",
      i: "I would open up discussions to stimulate new thoughts and get something moving.",
    },
  },
  {
    section: "VII",
    title: "With reference to the problems I experience when working in groups",
    statements: {
      a: "I am apt to overreact when people hold up progress.",
      b: "Some people criticise me for being too analytical.",
      c: "My desire to check important details is not always welcome.",
      d: "I tend to show boredom unless I am actively engaged with stimulating people.",
      e: "I find it difficult to get started unless the goals are clear.",
      f: "I am sometimes poor at putting across complex points that occur to me.",
      g: "I am conscious of demanding from others the things I cannot do myself.",
      h: "I am inclined to feel I am wasting my time and would do better on my own.",
      i: "I hesitate to express my personal views in front of difficult or powerful people.",
    },
  },
];
const spiAnalysisChart: Record<SpiSection, Record<SpiRole, SpiLetter>> = {
  I: { IMP: "h", CO: "d", SH: "g", PL: "c", RI: "a", ME: "i", TW: "b", CF: "e", SP: "f" },
  II: { IMP: "a", CO: "b", SH: "f", PL: "h", RI: "d", ME: "e", TW: "g", CF: "i", SP: "c" },
  III: { IMP: "i", CO: "a", SH: "c", PL: "d", RI: "f", ME: "h", TW: "e", CF: "b", SP: "g" },
  IV: { IMP: "e", CO: "i", SH: "c", PL: "f", RI: "h", ME: "d", TW: "a", CF: "g", SP: "b" },
  V: { IMP: "b", CO: "f", SH: "d", PL: "h", RI: "e", ME: "a", TW: "c", CF: "g", SP: "i" },
  VI: { IMP: "g", CO: "d", SH: "h", PL: "b", RI: "i", ME: "f", TW: "c", CF: "e", SP: "a" },
  VII: { IMP: "e", CO: "g", SH: "a", PL: "f", RI: "d", ME: "b", TW: "i", CF: "c", SP: "h" },
};

function getPersonalityProfile(colour: Colour) {
  return personalityProfiles.find((profile) => profile.colour === colour)!;
}

type View = "intro" | "test" | "result" | "vark" | "spi";
type SpiPoints = Record<SpiSection, Record<SpiLetter, number>>;
type VarkChoice = "a" | "b" | "c" | "d";
type VarkAnswers = Record<number, VarkChoice[]>;

function readSavedAnswers(): Answers {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as Answers) : {};
  } catch {
    return {};
  }
}

function createEmptySpiPoints(): SpiPoints {
  return spiSections.reduce((sectionMap, section) => {
    sectionMap[section] = spiLetters.reduce((letterMap, letter) => {
      letterMap[letter] = 0;
      return letterMap;
    }, {} as Record<SpiLetter, number>);
    return sectionMap;
  }, {} as SpiPoints);
}

function readSavedSpiPoints(): SpiPoints {
  try {
    const saved = localStorage.getItem(SPI_STORAGE_KEY);
    if (!saved) {
      return createEmptySpiPoints();
    }

    const parsed = JSON.parse(saved) as Partial<SpiPoints>;
    const points = createEmptySpiPoints();
    spiSections.forEach((section) => {
      spiLetters.forEach((letter) => {
        const value = parsed[section]?.[letter];
        points[section][letter] =
          typeof value === "number" && Number.isFinite(value)
            ? Math.max(0, Math.min(10, value))
            : 0;
      });
    });
    return points;
  } catch {
    return createEmptySpiPoints();
  }
}

function readSavedSpiResultVisible() {
  try {
    return localStorage.getItem(SPI_RESULT_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function readSavedVarkAnswers(): VarkAnswers {
  try {
    const saved = localStorage.getItem(VARK_STORAGE_KEY);
    if (!saved) {
      return {};
    }

    const parsed = JSON.parse(saved) as Record<string, unknown>;
    const answers: VarkAnswers = {};
    varkQuestions.forEach((question) => {
      const selected = parsed[String(question.id)];
      if (Array.isArray(selected)) {
        answers[question.id] = selected.filter((choice): choice is VarkChoice =>
          ["a", "b", "c", "d"].includes(String(choice)),
        );
      }
    });
    return answers;
  } catch {
    return {};
  }
}

function App() {
  const [view, setView] = useState<View>("intro");
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState<Answers>(readSavedAnswers);
  const [message, setMessage] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  }, [answers]);

  useEffect(() => {
    const updateScrollButton = () => setShowScrollTop(window.scrollY > 420);
    updateScrollButton();
    window.addEventListener("scroll", updateScrollButton, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollButton);
  }, []);

  const answered = Object.keys(answers).length;
  const pageQuestions = questions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const pageComplete = pageQuestions.every(({ id }) => answers[id] !== undefined);
  const scores = useMemo(
    () => (view === "result" ? calculateScores(answers) : undefined),
    [answers, view],
  );

  function choose(questionId: number, value: Rating) {
    setAnswers((current) => ({ ...current, [questionId]: value }));
    setMessage("");
  }

  function advance() {
    if (!pageComplete) {
      setMessage("Choose a response for each statement on this page to continue.");
      return;
    }

    setMessage("");
    if (page === TOTAL_PAGES - 1) {
      setView("result");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setPage((current) => current + 1);
    setView("test");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function restart() {
    localStorage.removeItem(STORAGE_KEY);
    setAnswers({});
    setPage(0);
    setView("intro");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startFresh() {
    localStorage.removeItem(STORAGE_KEY);
    setAnswers({});
    setPage(0);
    setView("intro");
    setMessage("");
    scrollToQuestionnaire();
  }

  function scrollToQuestionnaire() {
    window.requestAnimationFrame(() => {
      document
        .getElementById("questionnaire-start")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function resume() {
    if (page === 0) {
      setView("intro");
      scrollToQuestionnaire();
      return;
    }
    setView("test");
  }

  function previousPage() {
    setMessage("");
    if (page === 1) {
      setPage(0);
      setView("intro");
      scrollToQuestionnaire();
      return;
    }
    setPage((current) => Math.max(0, current - 1));
  }

  function goHome() {
    setPage(0);
    setView("intro");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openTool(tool: "vark" | "spi") {
    setPage(0);
    setView(tool);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showResult() {
    setView("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="app-shell">
      <Header onHome={goHome} onOpenTool={openTool} />
      {view === "intro" && (
        <Intro
          answered={answered}
          answers={answers}
          message={message}
          onStart={startFresh}
          onResume={resume}
          onReset={restart}
          onChoose={choose}
          onNext={advance}
          onShowResult={showResult}
        />
      )}
      {view === "test" && (
        <TestForm
          page={page}
          questions={pageQuestions}
          answers={answers}
          answered={answered}
          message={message}
          onChoose={choose}
          onPrevious={previousPage}
          onNext={advance}
        />
      )}
      {view === "result" && scores && (
        <Results scores={scores} onRetake={restart} />
      )}
      {view === "vark" && <ToolPage title="VARK Questionnaire" tool={<VarkTool />} />}
      {view === "spi" && <ToolPage title="Self-Perception Inventory" tool={<SpiTool />} />}
      <Footer />
      <ScrollToTopButton visible={showScrollTop} />
    </div>
  );
}

function Header({
  onHome,
  onOpenTool,
}: {
  onHome: () => void;
  onOpenTool: (tool: "vark" | "spi") => void;
}) {
  return (
    <header className="site-header">
      <button className="brand" type="button" onClick={onHome}>
        <span className="brand-spectrum" />
        Rainbow Test
      </button>
      <div className="header-actions" aria-label="Additional tools">
        <button type="button" onClick={() => onOpenTool("vark")}>
          VARK
        </button>
        <button type="button" onClick={() => onOpenTool("spi")}>
          SPI
        </button>
      </div>
    </header>
  );
}

function Intro({
  answered,
  answers,
  message,
  onStart,
  onResume,
  onReset,
  onChoose,
  onNext,
  onShowResult,
}: {
  answered: number;
  answers: Answers;
  message: string;
  onStart: () => void;
  onResume: () => void;
  onReset: () => void;
  onChoose: (id: number, value: Rating) => void;
  onNext: () => void;
  onShowResult: () => void;
}) {
  const [flippedCard, setFlippedCard] = useState<Colour | null>(null);
  const [highlightedCard, setHighlightedCard] = useState<Colour | null>(null);
  const spectrumRef = useRef<HTMLDivElement>(null);
  const highlightTimerRef = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(highlightTimerRef.current);
    },
    [],
  );

  function resetBubbleMotion() {
    spectrumRef.current?.querySelectorAll<HTMLElement>(".colour-orb").forEach((orb) => {
      orb.style.setProperty("--pull-x", "0px");
      orb.style.setProperty("--pull-y", "0px");
      orb.style.setProperty("--glow-x", "50%");
      orb.style.setProperty("--glow-y", "35%");
      orb.style.setProperty("--proximity", "0");
    });
  }

  function moveBubbles(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") {
      return;
    }

    spectrumRef.current?.querySelectorAll<HTMLElement>(".colour-orb").forEach((orb) => {
      const bounds = orb.getBoundingClientRect();
      const centreX = bounds.left + bounds.width / 2;
      const centreY = bounds.top + bounds.height / 2;
      const offsetX = event.clientX - centreX;
      const offsetY = event.clientY - centreY;
      const distance = Math.hypot(offsetX, offsetY);
      const proximity = Math.max(0, 1 - distance / 245);
      const pull = 16 * proximity;
      const directionX = distance ? offsetX / distance : 0;
      const directionY = distance ? offsetY / distance : 0;
      const glowX = ((event.clientX - bounds.left) / bounds.width) * 100;
      const glowY = ((event.clientY - bounds.top) / bounds.height) * 100;

      orb.style.setProperty("--pull-x", `${directionX * pull}px`);
      orb.style.setProperty("--pull-y", `${directionY * pull}px`);
      orb.style.setProperty("--glow-x", `${Math.min(100, Math.max(0, glowX))}%`);
      orb.style.setProperty("--glow-y", `${Math.min(100, Math.max(0, glowY))}%`);
      orb.style.setProperty("--proximity", proximity.toFixed(3));
    });
  }

  function revealProfile(colour: Colour) {
    setHighlightedCard(colour);
    window.clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = window.setTimeout(() => {
      setHighlightedCard(null);
    }, 1350);
    document.getElementById(`profile-${colour.toLowerCase()}`)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "center",
    });
  }

  return (
    <main className="intro">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Personality reflection for teamwork</p>
          <h1>
            The Rainbow
            <br />
            Personality Test
          </h1>
          <p className="lead">
            Discover the team role tendencies behind your choices. Answer 40
            short statements and see your profile take shape in four colours.
          </p>
          <div className="actions">
            <button className="primary" type="button" onClick={onStart}>
              {answered > 0 ? "Start over" : "Start the test"}
            </button>
            {answered === questions.length && (
              <button className="secondary" type="button" onClick={onShowResult}>
                See result
              </button>
            )}
            {answered > 0 && (
              <>
                <button className="secondary" type="button" onClick={onResume}>
                  Resume ({answered}/40)
                </button>
                <button className="text-action" type="button" onClick={onReset}>
                  Clear saved answers
                </button>
              </>
            )}
          </div>
        </div>
        <div
          className="hero-spectrum"
          ref={spectrumRef}
          onPointerMove={moveBubbles}
          onPointerLeave={resetBubbleMotion}
        >
          {personalityProfiles.map((profile) => (
            <button
              className={`colour-orb ${colourDetails[profile.colour].cssClass}`}
              key={profile.colour}
              type="button"
              aria-label={`View ${profile.name}, ${profile.title}`}
              onClick={() => revealProfile(profile.colour)}
            >
              <span className="orb-drift">
                <span className="orb-surface">
                  <span className="orb-shine" aria-hidden="true" />
                  <span className="orb-label">
                    <b>{profile.name.split(" ")[0]}</b>
                    <span>{profile.colour}</span>
                  </span>
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>
      <section className="profiles" aria-labelledby="profiles-title">
        <div className="section-heading">
          <p className="eyebrow">Four team-role profiles</p>
          <h2 id="profiles-title">Which colour will lead your rainbow?</h2>
        </div>
        <div className="profile-cards">
          {personalityProfiles.map((profile) => (
            <button
              className={`profile-card ${colourDetails[profile.colour].cssClass} ${
                flippedCard === profile.colour ? "flipped" : ""
              } ${highlightedCard === profile.colour ? "spotlight" : ""}`}
              key={profile.colour}
              id={`profile-${profile.colour.toLowerCase()}`}
              type="button"
              aria-pressed={flippedCard === profile.colour}
              aria-label={
                flippedCard === profile.colour
                  ? `Return to ${profile.colour} personality card`
                  : `Show details for ${profile.colour} personality`
              }
              onClick={() =>
                setFlippedCard((current) =>
                  current === profile.colour ? null : profile.colour,
                )
              }
            >
              <div className="profile-flipper">
                <div className="profile-face profile-front">
                  <img
                    src={`${import.meta.env.BASE_URL}${profile.image}`}
                    alt={`${profile.name} personality avatar`}
                  />
                  <div className="profile-copy">
                    <span>{profile.name}</span>
                    <h3>{profile.title}</h3>
                    <p>{profile.description}</p>
                    <small>Click to explore</small>
                  </div>
                </div>
                <div className="profile-face profile-back">
                  <img
                    src={`${import.meta.env.BASE_URL}${profile.detailImage}`}
                    alt=""
                    aria-hidden="true"
                  />
                  <div className="profile-copy">
                    <span>{profile.name}</span>
                    <p className="interpretation">{profile.interpretation}</p>
                    <small>Click to return</small>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
      <section className="intro-cards" aria-label="How the test works">
        <InfoCard title="40 statements" body="Rate each statement from hardly ever true to almost always true." />
        <InfoCard title="Four dimensions" body="Your responses produce A, B, C and D scores for team tendencies." />
        <InfoCard title="A visual result" body="Four connected colour areas reveal your dominant rainbow profile." />
      </section>
      <aside className="privacy-callout" aria-label="Privacy note">
        <span className="privacy-line" aria-hidden="true" />
        <div className="privacy-card">
          <span className="privacy-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M12 3.5 19 6v5.3c0 4.1-2.7 7.5-7 9.2-4.3-1.7-7-5.1-7-9.2V6l7-2.5Z" />
              <path d="m9.2 11.8 1.9 2 3.9-4.3" />
            </svg>
          </span>
          <div>
            <p>Your responses are processed on your device and never sent to a server.</p>
          </div>
        </div>
        <span className="privacy-line" aria-hidden="true" />
      </aside>
      <FirstQuestionSection
        answers={answers}
        answered={answered}
        message={message}
        onChoose={onChoose}
        onNext={onNext}
      />
    </main>
  );
}

function ToolPage({ title, tool }: { title: string; tool: ReactNode }) {
  return (
    <main className="tool-page">
      <div className="section-heading">
        <h1>{title}</h1>
      </div>
      {tool}
    </main>
  );
}

function VarkTool() {
  const [answers, setAnswers] = useState<VarkAnswers>(readSavedVarkAnswers);
  useEffect(() => {
    localStorage.setItem(VARK_STORAGE_KEY, JSON.stringify(answers));
  }, [answers]);

  const scores = useMemo(() => {
    const totals: Record<VarkMode, number> = { V: 0, A: 0, R: 0, K: 0 };
    Object.entries(answers).forEach(([questionId, selected]) => {
      selected.forEach((choice) => {
        totals[varkScoring[Number(questionId)][choice]] += 1;
      });
    });
    return totals;
  }, [answers]);
  const highest = Math.max(...Object.values(scores));
  const preferred = (Object.keys(scores) as VarkMode[]).filter(
    (mode) => highest > 0 && scores[mode] === highest,
  );

  function toggle(question: number, choice: VarkChoice) {
    setAnswers((current) => {
      const selected = current[question] ?? [];
      const next = selected.includes(choice)
        ? selected.filter((item) => item !== choice)
        : [...selected, choice];
      return { ...current, [question]: next };
    });
  }

  function clear() {
    localStorage.removeItem(VARK_STORAGE_KEY);
    setAnswers({});
  }

  return (
    <article className="tool-card vark-tool" id="vark-tool">
      <div className="tool-heading">
        <div>
          <p className="eyebrow">VARK Questionnaire</p>
          <h2>Learning style score</h2>
        </div>
        <button className="text-action" type="button" onClick={clear}>
          Clear
        </button>
      </div>
      <p className="tool-copy">
        Tick the answer letters you chose in the questionnaire. More than one answer per question is allowed.
      </p>
      <div className="vark-question-list" aria-label="VARK questionnaire">
        {varkQuestions.map((question) => (
          <fieldset className="vark-question" key={question.id}>
            <legend>
              <span>Q{question.id}</span>
              {question.text}
            </legend>
            {(["a", "b", "c", "d"] as const).map((choice) => (
              <label key={choice}>
                <input
                  type="checkbox"
                  checked={(answers[question.id] ?? []).includes(choice)}
                  onChange={() => toggle(question.id, choice)}
                />
                <b>{choice}</b>
                <span>{question.options[choice]}</span>
              </label>
            ))}
          </fieldset>
        ))}
      </div>
      <div className="tool-results four">
        {(Object.keys(scores) as VarkMode[]).map((mode) => (
          <span className={preferred.includes(mode) ? "top-score" : undefined} key={mode}>
            <b>{mode}</b>
            <strong>{scores[mode]}</strong>
            <small>{varkLabels[mode]}</small>
          </span>
        ))}
      </div>
    </article>
  );
}

function SpiTool() {
  const [points, setPoints] = useState<SpiPoints>(readSavedSpiPoints);
  const [showSpiResult, setShowSpiResult] = useState(readSavedSpiResultVisible);
  const [attemptedSpiResult, setAttemptedSpiResult] = useState(false);

  useEffect(() => {
    localStorage.setItem(SPI_STORAGE_KEY, JSON.stringify(points));
  }, [points]);
  const rowTotals = useMemo(
    () =>
      spiSections.reduce((totals, section) => {
        totals[section] = spiLetters.reduce((sum, letter) => sum + points[section][letter], 0);
        return totals;
      }, {} as Record<SpiSection, number>),
    [points],
  );
  const invalidSections = spiSections.filter((section) => rowTotals[section] !== 10);
  const hasInvalidSection = invalidSections.length > 0;
  const startedSections = spiSections.filter((section) => rowTotals[section] > 0);

  useEffect(() => {
    if (hasInvalidSection && showSpiResult) {
      setShowSpiResult(false);
      localStorage.removeItem(SPI_RESULT_STORAGE_KEY);
    }
  }, [hasInvalidSection, showSpiResult]);

  useEffect(() => {
    if (showSpiResult) {
      localStorage.setItem(SPI_RESULT_STORAGE_KEY, "true");
      return;
    }
    localStorage.removeItem(SPI_RESULT_STORAGE_KEY);
  }, [showSpiResult]);
  const roleTotals = useMemo(
    () =>
      spiRoles.reduce((totals, role) => {
        totals[role] = spiSections.reduce(
          (sum, section) => sum + points[section][spiAnalysisChart[section][role]],
          0,
        );
        return totals;
      }, {} as Record<SpiRole, number>),
    [points],
  );
  const rankedSpiValues = Array.from(new Set(Object.values(roleTotals))).sort((a, b) => b - a);
  const highSpiValues = showSpiResult && !hasInvalidSection ? rankedSpiValues.slice(0, 2) : [];
  const lowSpiValues = showSpiResult && !hasInvalidSection
    ? [...rankedSpiValues].reverse().slice(0, 2)
    : [];

  function spiResultClass(role: SpiRole) {
    const score = roleTotals[role];
    if (highSpiValues.includes(score)) {
      return "high-score";
    }
    if (lowSpiValues.includes(score)) {
      return "low-score";
    }
    return undefined;
  }

  function setPoint(section: SpiSection, letter: SpiLetter, value: string) {
    const numeric = Math.max(0, Math.min(10, Number(value) || 0));
    setShowSpiResult(false);
    localStorage.removeItem(SPI_RESULT_STORAGE_KEY);
    setPoints((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [letter]: numeric,
      },
    }));
  }

  function stopNumberWheel(event: WheelEvent<HTMLInputElement>) {
    event.currentTarget.blur();
  }

  function clear() {
    setShowSpiResult(false);
    setAttemptedSpiResult(false);
    localStorage.removeItem(SPI_STORAGE_KEY);
    localStorage.removeItem(SPI_RESULT_STORAGE_KEY);
    setPoints(createEmptySpiPoints());
  }

  function showResult() {
    setAttemptedSpiResult(true);
    setShowSpiResult(!hasInvalidSection);
  }

  return (
    <article className="tool-card spi-tool" id="spi-tool">
      <div className="tool-heading">
        <div>
          <p className="eyebrow">Self-Perception Inventory</p>
          <h2>SPI analysis chart</h2>
        </div>
        <button className="text-action" type="button" onClick={clear}>
          Clear
        </button>
      </div>
      <p className="tool-copy">
        For each SPI section, distribute 10 points across letters a-i. The role totals are calculated from the analysis chart.
      </p>
      <div className="spi-question-list" aria-label="SPI questionnaire">
        {spiQuestionGroups.map((group) => (
          <section className="spi-question-group" key={group.section}>
            <div className="spi-group-heading">
              <div>
                <span>Section {group.section}</span>
                <h3>{group.title}</h3>
              </div>
              <strong className={rowTotals[group.section] === 10 ? "complete" : undefined}>
                {rowTotals[group.section]} / 10
              </strong>
            </div>
            <div className="spi-statement-list">
              {spiLetters.map((letter) => (
                <label key={letter}>
                  <span className="statement-letter">{letter}</span>
                  <span>{group.statements[letter]}</span>
                  <input
                    aria-label={`SPI section ${group.section} letter ${letter}`}
                    min="0"
                    max="10"
                    type="number"
                    value={points[group.section][letter]}
                    onWheel={stopNumberWheel}
                    onChange={(event) => setPoint(group.section, letter, event.target.value)}
                  />
                </label>
              ))}
            </div>
            {rowTotals[group.section] > 0 && rowTotals[group.section] !== 10 && (
              <p className="spi-warning" role="alert">
                Section {group.section} must total exactly 10 points.
              </p>
            )}
          </section>
        ))}
      </div>
      <div className="spi-result-action">
        <button className="primary" type="button" onClick={showResult}>
          Show result
        </button>
      </div>
      {attemptedSpiResult && hasInvalidSection && (
        <p className="spi-result-warning" role="alert">
          SPI result unavailable: every section must total exactly 10 points.
          {startedSections.length > 0 && ` Check section ${invalidSections.join(", ")}.`}
        </p>
      )}
      {showSpiResult && !hasInvalidSection && (
        <div className="spi-analysis-table" aria-label="SPI role totals">
          {spiRoles.map((role) => (
            <div
              className={spiResultClass(role)}
              key={role}
            >
              <span>{role}</span>
              <strong>{roleTotals[role]}</strong>
              <small>{spiRoleNames[role]}</small>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="info-card">
      <h2>{title}</h2>
      <p>{body}</p>
    </article>
  );
}

function FirstQuestionSection({
  answers,
  answered,
  message,
  onChoose,
  onNext,
}: {
  answers: Answers;
  answered: number;
  message: string;
  onChoose: (id: number, value: Rating) => void;
  onNext: () => void;
}) {
  return (
    <section className="embedded-test" id="questionnaire-start">
      <div className="test-heading">
        <div>
          <p className="eyebrow">Begin the questionnaire</p>
          <h2>How well does each statement fit you?</h2>
        </div>
        <div className="progress-copy">
          <strong>{answered}</strong> / 40 answered
        </div>
      </div>
      <div className="progress-track" aria-label={`${answered} of 40 answered`}>
        <div style={{ width: `${(answered / questions.length) * 100}%` }} />
      </div>
      <div className="scale-key" aria-label="Response scale">
        {ratings.map(({ value, label }) => (
          <span key={value}>
            <b>{value}</b> {label}
          </span>
        ))}
      </div>
      <div className="question-list" aria-label="Statements 1 to 5">
        {questions.slice(0, PAGE_SIZE).map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            selected={answers[question.id]}
            onChoose={onChoose}
          />
        ))}
      </div>
      {message && (
        <p className="form-message" role="alert">
          {message}
        </p>
      )}
      <div className="embedded-navigation">
        <span>Page 1 of {TOTAL_PAGES}</span>
        <button className="primary" type="button" onClick={onNext}>
          Next
        </button>
      </div>
    </section>
  );
}

function TestForm({
  page,
  questions: displayedQuestions,
  answers,
  answered,
  message,
  onChoose,
  onPrevious,
  onNext,
}: {
  page: number;
  questions: Question[];
  answers: Answers;
  answered: number;
  message: string;
  onChoose: (id: number, value: Rating) => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <main className="test-page">
      <div className="test-heading">
        <div>
          <p className="eyebrow">The questionnaire</p>
          <h1>How well does each statement fit you?</h1>
        </div>
        <div className="progress-copy">
          <strong>{answered}</strong> / 40 answered
        </div>
      </div>
      <div className="progress-track" aria-label={`${answered} of 40 answered`}>
        <div style={{ width: `${(answered / questions.length) * 100}%` }} />
      </div>
      <div className="scale-key" aria-label="Response scale">
        {ratings.map(({ value, label }) => (
          <span key={value}>
            <b>{value}</b> {label}
          </span>
        ))}
      </div>
      <section className="question-list" aria-label={`Statements ${page * 5 + 1} to ${page * 5 + 5}`}>
        {displayedQuestions.map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            selected={answers[question.id]}
            onChoose={onChoose}
          />
        ))}
      </section>
      {message && <p className="form-message" role="alert">{message}</p>}
      <div className="test-navigation">
        <button className="secondary" type="button" onClick={onPrevious} disabled={page === 0}>
          Previous
        </button>
        <span>
          Page {page + 1} of {TOTAL_PAGES}
        </span>
        <button className="primary" type="button" onClick={onNext}>
          {page === TOTAL_PAGES - 1 ? "See my result" : "Next"}
        </button>
      </div>
    </main>
  );
}

function QuestionCard({
  question,
  selected,
  onChoose,
}: {
  question: Question;
  selected?: Rating;
  onChoose: (id: number, value: Rating) => void;
}) {
  return (
    <fieldset className="question-card">
      <legend>
        <span className="question-number">{String(question.id).padStart(2, "0")}</span>
        {question.text}
      </legend>
      <div className="rating-options">
        {ratings.map(({ value, label }) => (
          <label
            key={value}
            className={selected === value ? "selected" : undefined}
            title={label}
          >
            <input
              type="radio"
              name={`question-${question.id}`}
              value={value}
              checked={selected === value}
              onChange={() => onChoose(question.id, value)}
            />
            <span>{value}</span>
            <small>{label}</small>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Results({ scores, onRetake }: { scores: Scores; onRetake: () => void }) {
  const tie = scores.dominant.length > 1;
  const primaryColour = scores.dominant[0];
  const primaryProfile = getPersonalityProfile(primaryColour);
  const rankedColours = (Object.keys(scores.colours) as Colour[]).sort(
    (first, second) => scores.colours[second] - scores.colours[first],
  );
  const resultsExportRef = useRef<HTMLDivElement | null>(null);

  async function downloadPdf() {
    if (!resultsExportRef.current) return;

    const margin = 12;
    const canvas = await html2canvas(resultsExportRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      windowWidth: resultsExportRef.current.scrollWidth,
      windowHeight: resultsExportRef.current.scrollHeight,
    });

    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - margin * 2;
    const printableHeight = pageHeight - margin * 2;
    const pxPerMm = canvas.width / imgWidth;
    const sliceHeightPx = Math.round(printableHeight * pxPerMm);
    const totalHeightPx = canvas.height;
    const exportNode = resultsExportRef.current;
    if (!exportNode) return;

    const exportRect = exportNode.getBoundingClientRect();
    const elementCandidates = exportNode.querySelectorAll(
      ".score-card, .dimension-summary, .panel, .result-hero, .palette-section",
    );
    const boundaries = [0, totalHeightPx];
    const scale = canvas.height / exportNode.scrollHeight;

    elementCandidates.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const relativeBottom = rect.bottom - exportRect.top;
      const boundaryPx = Math.round(relativeBottom * scale);
      if (boundaryPx > 0 && boundaryPx < totalHeightPx) {
        boundaries.push(boundaryPx);
      }
    });

    boundaries.sort((a, b) => a - b);

    let yOffset = 0;
    let pageIndex = 0;
    let lastPageImageHeightMm = 0;

    while (yOffset < totalHeightPx) {
      const idealEnd = yOffset + sliceHeightPx;
      let sliceEnd = boundaries
        .filter((pos) => pos > yOffset + Math.round(sliceHeightPx * 0.2) && pos <= idealEnd)
        .pop() ?? Math.min(idealEnd, totalHeightPx);

      if (sliceEnd <= yOffset) {
        sliceEnd = Math.min(idealEnd, totalHeightPx);
      }

      const sliceHeight = sliceEnd - yOffset;
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;
      const ctx = pageCanvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(canvas, 0, yOffset, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
      }

      const pageData = pageCanvas.toDataURL("image/png");
      const pageImageHeightMm = sliceHeight / pxPerMm;
      if (pageIndex > 0) {
        pdf.addPage();
      }
      pdf.addImage(pageData, "PNG", margin, margin, imgWidth, pageImageHeightMm);
      lastPageImageHeightMm = pageImageHeightMm;

      yOffset = sliceEnd;
      pageIndex += 1;
    }

    const buttonText = "Retake the test";
    const buttonWidth = 72;
    const buttonHeight = 15;
    const buttonX = (pageWidth - buttonWidth) / 2;
    let buttonY = margin + lastPageImageHeightMm + 6;

    if (buttonY + buttonHeight + margin > pageHeight) {
      pdf.addPage();
      buttonY = margin;
    }

    pdf.setFillColor(24, 34, 38);
    pdf.roundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 4, 4, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.text(buttonText, pageWidth / 2, buttonY + buttonHeight / 2 + 0.5, {
      align: "center",
      baseline: "middle",
    });
    pdf.link(buttonX, buttonY, buttonWidth, buttonHeight, {
      url: "https://rainbow-personality-test.netlify.app",
    });

    pdf.save("rainbow-personality-your-result.pdf");
  }

  return (
    <main className="results-page">
      <div className="results-export" ref={resultsExportRef}>
        <section
          className={`result-hero ${colourDetails[primaryColour].cssClass}`}
          aria-label="Dominant personality result"
        >
          <div className="result-hero-copy">
            <p className="eyebrow">{tie ? "Your blended result" : "Your result"}</p>
            <div className="dominant-tags">
              {scores.dominant.map((colour) => (
                <span className={colourDetails[colour].cssClass} key={colour}>
                  {getPersonalityProfile(colour).name}
                </span>
              ))}
            </div>
            <h1>
              {tie ? "A balanced colour blend" : primaryProfile.title}
            </h1>
            <p className="result-description">
              {tie
                ? "Two or more colour areas share the highest score. Your style draws equally on these team roles."
                : primaryProfile.interpretation}
            </p>
          </div>
          <div className="result-portrait">
            <img
              src={`${import.meta.env.BASE_URL}${primaryProfile.image}`}
              alt={`${primaryProfile.name} personality illustration`}
            />
            <span className={colourDetails[primaryColour].cssClass}>
              {primaryProfile.name.toUpperCase()}
            </span>
          </div>
        </section>
        <div className="result-layout">
        <section className="panel chart-panel">
          <div className="panel-header">
            <h2>Rainbow profile map</h2>
            <p>A, B, C and D form four coloured triangle areas.</p>
          </div>
          <QuadrantChart dimensions={scores.dimensions} />
        </section>
        <section className="panel comparison-panel">
          <div className="panel-header">
            <h2>Your colour balance</h2>
            <p>Compared areas, ranked from your strongest expression.</p>
          </div>
          <ColourBars
            colours={scores.colours}
            dominant={scores.dominant}
            order={rankedColours}
          />
          <div className="dimension-inline">
            <h3>Dimension totals</h3>
            <div>
              {(Object.keys(scores.dimensions) as Dimension[]).map((dimension) => (
                <span className="dimension-pill" key={dimension}>
                  <b>{dimension}</b>
                  {scores.dimensions[dimension]}
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>
      <section className="palette-section" aria-labelledby="palette-title">
        <div className="palette-heading">
          <p className="eyebrow">Full spectrum</p>
          <h2 id="palette-title">Your four personality colours</h2>
          <p>Every colour contributes to how you work with others.</p>
        </div>
        <div className="score-grid" aria-label="Detailed colour profiles">
        {personalityProfiles.map((profile) => (
          <article
            key={profile.colour}
            className={`score-card ${colourDetails[profile.colour].cssClass} ${
              scores.dominant.includes(profile.colour) ? "dominant" : ""
            }`}
          >
            <img
              src={`${import.meta.env.BASE_URL}${profile.detailImage}`}
              alt=""
              aria-hidden="true"
            />
            <div className="score-card-body">
              <div className="score-title">
                <div>
                  <span>{profile.name}</span>
                  <h3>{profile.title}</h3>
                </div>
                <strong>{scores.colours[profile.colour]}</strong>
              </div>
              <code>{colourDetails[profile.colour].formula}</code>
              <p>{profile.interpretation}</p>
            </div>
          </article>
        ))}
        </div>
      </section>
      <section className="dimension-summary panel">
        <div>
          <h2>How the result is formed</h2>
          <p>
            Each dimension totals ten responses. Adjacent dimension pairs form
            the four coloured triangle areas in your profile map.
          </p>
        </div>
        {(Object.keys(scores.dimensions) as Dimension[]).map((dimension) => (
          <div className="dimension-chip" key={dimension}>
            <span>{dimension}</span>
            <strong>{scores.dimensions[dimension]}</strong>
            <small>/ 50</small>
          </div>
        ))}
      </section>
      </div>
      <div className="result-action">
        <button className="secondary" type="button" onClick={downloadPdf}>
          Download Result PDF
        </button>
        <button className="primary" type="button" onClick={onRetake}>
          Retake the test
        </button>
      </div>
    </main>
  );
}

function QuadrantChart({
  dimensions,
}: {
  dimensions: Record<Dimension, number>;
}) {
  const centre = 260;
  const radius = 184;
  const length = (dimension: Dimension) =>
    (dimensions[dimension] / 50) * radius;
  const a = `${centre - length("A")},${centre}`;
  const b = `${centre},${centre - length("B")}`;
  const c = `${centre + length("C")},${centre}`;
  const d = `${centre},${centre + length("D")}`;

  return (
    <svg
      className="quadrant-chart"
      viewBox="0 0 520 520"
      role="img"
      aria-label="Four quadrant chart showing red, yellow, blue and green score areas"
    >
      {[10, 20, 30, 40, 50].map((tick) => {
        const size = (tick / 50) * radius;
        return (
          <path
            key={tick}
            className="chart-grid"
            d={`M ${centre} ${centre - size} L ${centre + size} ${centre} L ${centre} ${centre + size} L ${centre - size} ${centre} Z`}
          />
        );
      })}
      <path className="chart-axis" d={`M ${centre} 48 V 472 M 48 ${centre} H 472`} />
      <polygon className="area red" points={`${centre},${centre} ${a} ${b}`} />
      <polygon className="area yellow" points={`${centre},${centre} ${b} ${c}`} />
      <polygon className="area blue" points={`${centre},${centre} ${c} ${d}`} />
      <polygon className="area green" points={`${centre},${centre} ${d} ${a}`} />
      <g className="axis-label">
        <text x="25" y="256">A</text>
        <text x="25" y="276">{dimensions.A}</text>
        <text x="260" y="29">B</text>
        <text x="260" y="48">{dimensions.B}</text>
        <text x="495" y="256">C</text>
        <text x="495" y="276">{dimensions.C}</text>
        <text x="260" y="493">D</text>
        <text x="260" y="512">{dimensions.D}</text>
      </g>
      <g className="quadrant-label">
        <text className="red" x="176" y="166">RED</text>
        <text className="yellow" x="337" y="166">YELLOW</text>
        <text className="blue" x="336" y="363">BLUE</text>
        <text className="green" x="176" y="363">GREEN</text>
      </g>
    </svg>
  );
}

function ColourBars({
  colours,
  dominant,
  order,
}: {
  colours: Record<Colour, number>;
  dominant: Colour[];
  order?: Colour[];
}) {
  const displayedColours = order ?? (Object.keys(colours) as Colour[]);

  return (
    <div className="bar-list">
      {displayedColours.map((colour, index) => (
        <div className="bar-row" key={colour}>
          <div className="bar-name">
            <span>
              <small>{String(index + 1).padStart(2, "0")}</small>
              {getPersonalityProfile(colour).name}
            </span>
            <strong>{colours[colour]}</strong>
          </div>
          <div className="bar-track">
            <div
              className={`bar-fill ${colourDetails[colour].cssClass} ${
                dominant.includes(colour) ? "dominant" : ""
              }`}
              style={{ width: `${(colours[colour] / 1250) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-disclaimer">
        <h2>Disclaimer</h2>
        <p>
          This is an unofficial educational prototype for calculating and visualising
          Rainbow Personality Test results. It is intended for personal reflection
          and team-building discussion only, not as a clinical, psychological, or
          professional assessment.
        </p>
        <p>
          No login is required, and no personal data is collected or stored.
          Original test materials belong to their respective authors or programme
          providers.
        </p>
      </div>
      <div className="footer-meta">
        <div className="developer-credit">
          <strong>Developed by Ahmed Estiak</strong>
          <span>MSc Data Science Student, Tampere University</span>
        </div>
        <details className="footer-info">
          <summary aria-label="About this platform">
            <span className="footer-info-icon" aria-hidden="true">i</span>
            Info
          </summary>
          <p>
            This platform was developed by Ahmed Estiak during the Let's CHAOS
            Programme organized by Lodz University of Technology (Politechnika
            Łódzka) to support the completion and interpretation of Rainbow
            Personality, VARK, and SPI assessments used in educational and
            team-building activities. The original assessment frameworks,
            methodologies, and related intellectual property remain the property
            of their respective authors and organizations.
          </p>
        </details>
      </div>
    </footer>
  );
}

function ScrollToTopButton({ visible }: { visible: boolean }) {
  return (
    <button
      className={`scroll-top ${visible ? "visible" : ""}`}
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" />
      </svg>
    </button>
  );
}

export default App;
