import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
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

function getPersonalityProfile(colour: Colour) {
  return personalityProfiles.find((profile) => profile.colour === colour)!;
}

type View = "intro" | "test" | "result";

function readSavedAnswers(): Answers {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as Answers) : {};
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

  function showResult() {
    setView("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="app-shell">
      <Header onHome={goHome} />
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
      <Disclaimer />
      <Footer />
      <ScrollToTopButton visible={showScrollTop} />
    </div>
  );
}

function Header({ onHome }: { onHome: () => void }) {
  return (
    <header className="site-header">
      <button className="brand" type="button" onClick={onHome}>
        <span className="brand-spectrum" />
        Rainbow Test
      </button>
      <span className="header-note">Common roles in teams</span>
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

function Disclaimer() {
  return (
    <section className="disclaimer" aria-labelledby="disclaimer-title">
      <div>
        <p className="eyebrow">Important note</p>
        <h2 id="disclaimer-title">Disclaimer</h2>
      </div>
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
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <p>© 2026 Rainbow Personality Test. Unofficial educational prototype.</p>
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
