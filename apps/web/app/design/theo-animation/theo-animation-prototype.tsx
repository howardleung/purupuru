"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  createFreshQuizAnswers,
  getNextQuizStep,
  getPreviousQuizStep,
  getQuizProgress,
  MAX_CONCERNS,
  toggleLimitedChoice,
  type QuizAnswers,
  type QuizStepId,
} from "./quiz-model";
import styles from "./theo-animation.module.css";

type Screen = "welcome" | "quiz" | "retrieving" | "results";
type Choice = { label: string; value: string; detail?: string };

const CATEGORIES: Choice[] = [
  { label: "Cleanser", value: "Cleanser", detail: "A fresh start" },
  { label: "Toner or essence", value: "Toner", detail: "Hydrate and prep" },
  { label: "Serum", value: "Serum", detail: "Target a concern" },
  { label: "Moisturizer", value: "Moisturizer", detail: "Comfort and seal" },
  { label: "Sunscreen", value: "Sunscreen", detail: "Daily protection" },
];
const SKIN_TYPES: Choice[] = [
  { label: "Dry", value: "Dry" }, { label: "Oily", value: "Oily" },
  { label: "Combination", value: "Combination" }, { label: "Normal", value: "Normal" },
];
const CONCERNS = ["Dryness", "Breakouts", "Redness", "Dark spots", "Dullness", "Fine lines", "Texture", "Oiliness"];
const TEXTURES: Choice[] = [
  { label: "Light and watery", value: "Light" }, { label: "Gel-like", value: "Gel" },
  { label: "Creamy and comforting", value: "Creamy" },
];
const ROUTINE_ITEMS = ["Cleanser", "Toner / essence", "Serum", "Moisturizer", "Sunscreen"];

const STEP_COPY: Record<QuizStepId, { eyebrow: string; title: string; dialogue: string }> = {
  account: { eyebrow: "Before we begin", title: "Would you like to save this consultation?", dialogue: "You can browse as my guest. Signing in is completely optional in this prototype." },
  goal: { eyebrow: "Your visit", title: "What can I help you find today?", dialogue: "We can pick one lovely product or sketch a simple morning and evening routine." },
  category: { eyebrow: "Product type", title: "What kind of product are you shopping for?", dialogue: "Choose a shelf, or use Skip if you’d rather not choose yet. There are no wrong answers here." },
  skinType: { eyebrow: "About your skin", title: "How does your skin usually feel?", dialogue: "This is just your own description—not a diagnosis. Pick what feels closest." },
  concerns: { eyebrow: "Your priorities", title: "What would you most like to support?", dialogue: "Choose up to three. I’ll keep the final explanations easy to understand." },
  sensitivity: { eyebrow: "Comfort first", title: "Would you describe your skin as sensitive?", dialogue: "This helps me keep gentler-looking options prominent. You can always skip this question." },
  texture: { eyebrow: "The feel", title: "Which texture sounds nicest?", dialogue: "A product you enjoy using is much easier to keep in your routine." },
  currentRoutine: { eyebrow: "What you already use", title: "Which steps are already in your routine?", dialogue: "Select anything you use most days. We’ll avoid making the example routine needlessly busy." },
  routineLength: { eyebrow: "Keep it comfortable", title: "How many steps feel realistic?", dialogue: "Simple is excellent. A routine should fit your life, not take it over." },
};

const SINGLE_RESULTS = [
  { id: "dew-drop", role: "Best Match", brand: "Mizu House", name: "Dew Drop Hydrating Serum", size: "50 mL", price: "CA$18–24", reason: "An illustrative closest fit for the preferences you selected.", tone: "sage" },
  { id: "cloud-milk", role: "Budget Pick", brand: "Haru Studio", name: "Cloud Milk Barrier Cream", size: "60 mL", price: "CA$16–20", reason: "An illustrative lower-priced option based only on its mock listed price.", tone: "peach" },
  { id: "calm-water", role: "Alternative", brand: "Sora Skin", name: "Calm Water Essence", size: "100 mL", price: "CA$20–25", reason: "An illustrative different texture or format worth comparing.", tone: "blue" },
];
const ROUTINE_RESULTS = {
  morning: [
    { id: "am-cleanse", step: "1", brand: "Mizu House", name: "Soft Morning Cleanser", size: "120 mL", price: "CA$15", reason: "A gentle illustrative start." },
    { id: "am-moisture", step: "2", brand: "Sora Skin", name: "Daily Dew Gel Cream", size: "50 mL", price: "CA$21", reason: "Light hydration without a heavy finish." },
    { id: "am-spf", step: "3", brand: "Haru Studio", name: "Cloud Veil SPF 50+", size: "50 mL", price: "CA$19", reason: "A comfortable example sunscreen for the final morning step." },
  ],
  evening: [
    { id: "pm-cleanse", step: "1", brand: "Mizu House", name: "Soft Evening Cleanser", size: "120 mL", price: "CA$15", reason: "The same gentle cleanser keeps the mock routine simple." },
    { id: "pm-serum", step: "2", brand: "Sora Skin", name: "Calm Water Serum", size: "40 mL", price: "CA$23", reason: "An illustrative support step based on your stated concerns." },
    { id: "pm-cream", step: "3", brand: "Haru Studio", name: "Cloud Milk Barrier Cream", size: "60 mL", price: "CA$26", reason: "A cushioning finish for the night routine." },
  ],
};

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduced;
}

function ChoiceGrid({ choices, selected, onSelect, disabled = false }: { choices: Choice[]; selected: string | null; onSelect: (value: string) => void; disabled?: boolean }) {
  return <div className={styles.choiceGrid}>{choices.map((choice) => (
    <button aria-pressed={selected === choice.value} className={`${styles.choiceCard} ${selected === choice.value ? styles.choiceSelected : ""}`} disabled={disabled} key={choice.value} onClick={() => onSelect(choice.value)} type="button">
      <strong>{choice.label}</strong>{choice.detail ? <span>{choice.detail}</span> : null}
    </button>
  ))}</div>;
}

export function TheoAnimationPrototype() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [step, setStep] = useState<QuizStepId>("account");
  const [answers, setAnswers] = useState<QuizAnswers>(() => createFreshQuizAnswers());
  const [motionKey, setMotionKey] = useState(0);
  const [favourites, setFavourites] = useState<string[]>([]);
  const [cartItems, setCartItems] = useState<string[]>([]);
  const [swaps, setSwaps] = useState<string[]>([]);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const advancingRef = useRef(false);
  const transitionTimerRef = useRef<number | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const progress = getQuizProgress(step, answers);
  const stepCopy = STEP_COPY[step];

  useEffect(() => {
    if (screen !== "retrieving") return undefined;
    const timer = window.setTimeout(() => setScreen("results"), prefersReducedMotion ? 150 : 2600);
    return () => window.clearTimeout(timer);
  }, [prefersReducedMotion, screen]);

  useEffect(() => () => {
    if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current);
  }, []);

  const dialogue = useMemo(() => {
    if (screen === "welcome") return "Welcome to PuruPuru! Tell me what you’re looking for, and we’ll explore together.";
    if (screen === "retrieving") return "I have a few ideas—let me fetch them from the shelves!";
    if (screen === "results") return "Here are some illustrative ideas based on what you told me.";
    return stepCopy.dialogue;
  }, [screen, stepCopy.dialogue]);

  function unlockAfterTransition() {
    transitionTimerRef.current = window.setTimeout(() => {
      advancingRef.current = false;
      setIsAdvancing(false);
      transitionTimerRef.current = null;
    }, prefersReducedMotion ? 0 : 180);
  }

  function commitAdvance(answerState: QuizAnswers) {
    const next = getNextQuizStep(step, answerState);
    if (next) {
      setStep(next);
      setMotionKey((current) => current + 1);
    } else {
      setScreen("retrieving");
    }
    unlockAfterTransition();
  }

  function goNext(answerState = answers, delay = 0) {
    if (advancingRef.current) return;
    advancingRef.current = true;
    setIsAdvancing(true);
    if (delay > 0) {
      transitionTimerRef.current = window.setTimeout(() => commitAdvance(answerState), delay);
    } else {
      commitAdvance(answerState);
    }
  }

  function selectAndAdvance(patch: Partial<QuizAnswers>) {
    if (advancingRef.current) return;
    const updated = { ...answers, ...patch };
    setAnswers(updated);
    goNext(updated, prefersReducedMotion ? 0 : 120);
  }

  function goBack() {
    if (advancingRef.current) return;
    advancingRef.current = true;
    setIsAdvancing(true);
    const previous = getPreviousQuizStep(step, answers);
    if (previous) setStep(previous);
    else setScreen("welcome");
    unlockAfterTransition();
  }

  function restart() {
    if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = null;
    advancingRef.current = false;
    setIsAdvancing(false);
    setAnswers(createFreshQuizAnswers());
    setStep("account");
    setScreen("welcome");
    setFavourites([]);
    setCartItems([]);
    setSwaps([]);
    setMotionKey((current) => current + 1);
  }

  function toggleList(field: "concerns" | "currentRoutine", value: string) {
    setAnswers((current) => ({
      ...current,
      [field]: field === "concerns"
        ? toggleLimitedChoice(current.concerns, value)
        : current.currentRoutine.includes(value)
          ? current.currentRoutine.filter((item) => item !== value)
          : [...current.currentRoutine, value],
    }));
  }

  function togglePrototypeState(setter: React.Dispatch<React.SetStateAction<string[]>>, id: string) {
    setter((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function renderQuestion() {
    if (step === "account") {
      return <div className={styles.accountChoices}>
        <ChoiceGrid choices={[
          { label: "Continue as guest", value: "guest", detail: "No account needed" },
          { label: "Sign in", value: "sign-in", detail: "Simulated for this prototype" },
          { label: "Create an account", value: "sign-up", detail: "Simulated for this prototype" },
        ]} disabled={isAdvancing} onSelect={(value) => selectAndAdvance({ accountChoice: value as QuizAnswers["accountChoice"] })} selected={answers.accountChoice} />
        <p className={styles.prototypeNotice}>Prototype only: sign-in and saving are not connected.</p>
      </div>;
    }
    if (step === "goal") return <ChoiceGrid choices={[
      { label: "Find one product", value: "single", detail: "A focused shortlist" },
      { label: "Build an AM/PM routine", value: "routine", detail: "A simple routine outline" },
    ]} disabled={isAdvancing} onSelect={(value) => selectAndAdvance({ path: value as QuizAnswers["path"] })} selected={answers.path} />;
    if (step === "category") return <ChoiceGrid choices={CATEGORIES} disabled={isAdvancing} onSelect={(category) => selectAndAdvance({ category })} selected={answers.category} />;
    if (step === "skinType") return <ChoiceGrid choices={SKIN_TYPES} disabled={isAdvancing} onSelect={(skinType) => selectAndAdvance({ skinType })} selected={answers.skinType} />;
    if (step === "concerns") return <>
      <div className={styles.chipGrid}>{CONCERNS.map((concern) => {
        const selected = answers.concerns.includes(concern);
        const disabled = !selected && answers.concerns.length >= MAX_CONCERNS;
        return <button aria-pressed={selected} className={`${styles.chip} ${selected ? styles.chipSelected : ""}`} disabled={disabled} key={concern} onClick={() => toggleList("concerns", concern)} type="button">{concern}</button>;
      })}</div>
      <p aria-live="polite" className={styles.selectionCount}>{answers.concerns.length} of {MAX_CONCERNS} selected</p>
    </>;
    if (step === "sensitivity") return <ChoiceGrid choices={[
      { label: "Yes", value: "Yes" }, { label: "Sometimes", value: "Sometimes" },
      { label: "No", value: "No" },
    ]} disabled={isAdvancing} onSelect={(sensitivity) => selectAndAdvance({ sensitivity })} selected={answers.sensitivity} />;
    if (step === "texture") return <ChoiceGrid choices={TEXTURES} disabled={isAdvancing} onSelect={(texture) => selectAndAdvance({ texture })} selected={answers.texture} />;
    if (step === "currentRoutine") return <div className={styles.checkList}>{ROUTINE_ITEMS.map((item) => <label className={styles.checkRow} key={item}><input checked={answers.currentRoutine.includes(item)} onChange={() => toggleList("currentRoutine", item)} type="checkbox" /><span>{item}</span></label>)}</div>;
    if (step === "routineLength") return <ChoiceGrid choices={[
      { label: "Keep it to 3 steps", value: "3", detail: "The essentials" },
      { label: "4–5 steps is comfortable", value: "5", detail: "A little room to layer" },
      { label: "I’m flexible", value: "Flexible", detail: "Show a balanced example" },
    ]} disabled={isAdvancing} onSelect={(routineLength) => selectAndAdvance({ routineLength })} selected={answers.routineLength} />;
    return null;
  }

  const isMultiSelect = step === "concerns" || step === "currentRoutine";

  return (
    <main className={styles.page}>
      <header className={styles.prototypeHeader}>
        <div>
          <p className={styles.eyebrow}>Help Me Choose · experience study</p>
          <h1>A skincare consultation with Theo</h1>
        </div>
        <span className={styles.prototypeBadge}>Interactive prototype</span>
      </header>

      <div className={styles.experience}>
        <section className={styles.scene} aria-label="Theo's illustrated skincare shop">
          <div className={styles.shopWall} aria-hidden="true">
            <div className={`${styles.shelf} ${styles.shelfOne}`}><span className={`${styles.bottle} ${styles.pump}`} /><span className={`${styles.bottle} ${styles.jar}`} /><span className={`${styles.bottle} ${styles.tube}`} /></div>
            <div className={`${styles.shelf} ${styles.shelfTwo}`}><span className={`${styles.bottle} ${styles.tube}`} /><span className={`${styles.bottle} ${styles.pump}`} /><span className={`${styles.bottle} ${styles.jar}`} /></div>
            <div className={styles.shopSign}>PuruPuru skincare</div>
          </div>
          <div className={`${styles.stage} ${screen === "retrieving" ? styles.retrievingStage : ""}`}>
            <div aria-label="Theo, a fluffy cream and orange cat shopkeeper" className={`${styles.theo} ${screen === "retrieving" ? styles.retrieving : screen === "welcome" ? styles.animated : styles.idle}`} key={motionKey} role="img">
              <div className={`${styles.pose} ${styles.idlePose}`} />
              <div className={`${styles.pose} ${styles.wavePose}`} />
              <div aria-hidden="true" className={styles.blinkMask}><span /><span /></div>
            </div>
            <div aria-live="polite" className={styles.speechBubble} role="status">{dialogue}</div>
          </div>
          <div className={styles.counter} aria-hidden="true"><div className={styles.counterTop} /><div className={styles.counterFront}><span className={styles.counterMark}>P</span></div></div>
        </section>

        <section className={styles.consultationPanel} aria-label="Help Me Choose consultation">
          {screen === "welcome" ? <div className={styles.welcomePanel}>
            <p className={styles.panelEyebrow}>Welcome to Theo’s shop</p>
            <h2>Let’s find something that feels right for you.</h2>
            <p>Answer a few optional questions and Theo will present a small, illustrative shortlist. No account is required.</p>
            <ul className={styles.promiseList}><li>About 2 minutes</li><li>Easy to revise</li><li>No medical diagnosis</li></ul>
            <button className={styles.primaryButton} onClick={() => { setScreen("quiz"); setStep("account"); }} type="button">Start consultation <span aria-hidden="true">→</span></button>
          </div> : null}

          {screen === "quiz" ? <form className={styles.quizPanel} onSubmit={(event) => { event.preventDefault(); if (isMultiSelect) goNext(); }}>
            <div className={styles.progressHeader}><span>Question {progress.current} of {progress.total}</span><button className={styles.restartLink} onClick={restart} type="button">Restart</button></div>
            <div aria-label={`Question ${progress.current} of ${progress.total}`} aria-valuemax={progress.total} aria-valuemin={1} aria-valuenow={progress.current} className={styles.progressTrack} role="progressbar"><span style={{ width: `${progress.percent}%` }} /></div>
            <div className={styles.questionHeading}><p className={styles.panelEyebrow}>{stepCopy.eyebrow}</p><h2>{stepCopy.title}</h2></div>
            <div className={styles.questionBody}>{renderQuestion()}</div>
            <div className={styles.quizActions}>
              <button className={styles.secondaryButton} disabled={isAdvancing} onClick={goBack} type="button">← Back</button>
              <div className={styles.forwardActions}>
                {step !== "goal" ? <button className={styles.textButton} disabled={isAdvancing} onClick={() => goNext()} type="button">Skip</button> : null}
                {isMultiSelect ? <button className={styles.primaryButton} disabled={isAdvancing} type="submit">Next <span aria-hidden="true">→</span></button> : <span className={styles.autoAdvanceHint}>Choose an answer to continue</span>}
              </div>
            </div>
          </form> : null}

          {screen === "retrieving" ? <div className={styles.retrievingPanel}>
            <p className={styles.panelEyebrow}>Theo is checking the shelves</p><h2>Gathering a few gentle ideas…</h2>
            <div aria-hidden="true" className={styles.loadingDots}><span /><span /><span /></div>
            <p>This short scene is decorative and can always be skipped.</p>
            <button className={styles.secondaryButton} onClick={() => setScreen("results")} type="button">Skip to results</button>
          </div> : null}

          {screen === "results" ? <Results answers={answers} cartItems={cartItems} favourites={favourites} onAdjust={() => { setScreen("quiz"); setStep("goal"); }} onRestart={restart} onSwap={(id) => togglePrototypeState(setSwaps, id)} onToggleCart={(id) => togglePrototypeState(setCartItems, id)} onToggleFavourite={(id) => togglePrototypeState(setFavourites, id)} swaps={swaps} /> : null}
        </section>
      </div>
      <p className={styles.note}>Experience prototype only · Answers and mock actions exist only while this prototype is open and are not saved to an account.</p>
    </main>
  );
}

function Results({ answers, favourites, cartItems, swaps, onToggleFavourite, onToggleCart, onSwap, onAdjust, onRestart }: {
  answers: QuizAnswers;
  favourites: string[];
  cartItems: string[];
  swaps: string[];
  onToggleFavourite: (id: string) => void;
  onToggleCart: (id: string) => void;
  onSwap: (id: string) => void;
  onAdjust: () => void;
  onRestart: () => void;
}) {
  function renderCard(product: { id: string; brand: string; name: string; size: string; price: string; reason: string; role?: string; step?: string; tone?: string }) {
    const swapped = swaps.includes(product.id);
    return <article className={styles.resultCard} key={product.id}>
      <div className={`${styles.mockProduct} ${styles[`tone${product.tone ?? "sage"}`]}`} aria-hidden="true"><span /></div>
      <div className={styles.resultCopy}>
        {product.step ? <span className={styles.stepBadge}>Step {product.step}</span> : null}
        {product.role ? <span className={styles.resultRole}>{product.role}</span> : null}
        <p className={styles.productBrand}>{product.brand}</p>
        <h4>{swapped ? `${product.name} · alternate` : product.name}</h4>
        <p className={styles.productMeta}>{product.size} · {product.price}</p>
        <p className={styles.reason}>{swapped ? "A visually swapped prototype alternative with the same example role." : product.reason}</p>
      </div>
      <div className={styles.cardActions}>
        <button aria-pressed={favourites.includes(product.id)} onClick={() => onToggleFavourite(product.id)} type="button">{favourites.includes(product.id) ? "♥ Saved" : "♡ Favourite"}</button>
        <button onClick={() => onSwap(product.id)} type="button">↻ {swapped ? "Undo swap" : "Swap"}</button>
        <button aria-pressed={cartItems.includes(product.id)} onClick={() => onToggleCart(product.id)} type="button">{cartItems.includes(product.id) ? "✓ In mock cart" : "+ Mock cart"}</button>
      </div>
    </article>;
  }

  return <div className={styles.resultsPanel}>
    <div className={styles.resultsHeading}><div><p className={styles.panelEyebrow}>Illustrative results</p><h2>{answers.path === "routine" ? "A simple routine to explore" : "Theo’s example shortlist"}</h2></div><span className={styles.prototypeOnly}>Prototype only</span></div>
    <p className={styles.resultsIntro}>These mock products demonstrate the future experience. They are not real personalized recommendations or medical advice.</p>
    {answers.path === "routine" ? <div className={styles.routineResults}>
      <section><h3><span aria-hidden="true">☀</span> Morning</h3><div className={styles.resultList}>{ROUTINE_RESULTS.morning.map(renderCard)}</div></section>
      <section><h3><span aria-hidden="true">☾</span> Evening</h3><div className={styles.resultList}>{ROUTINE_RESULTS.evening.map(renderCard)}</div></section>
    </div> : <div className={styles.resultList}>{SINGLE_RESULTS.map(renderCard)}</div>}
    <div aria-live="polite" className={styles.mockSummary}>{favourites.length} favourited · {cartItems.length} in mock cart</div>
    <div className={styles.resultFooter}><button className={styles.secondaryButton} onClick={onAdjust} type="button">Adjust answers</button><button className={styles.primaryButton} onClick={onRestart} type="button">Start fresh</button></div>
  </div>;
}
