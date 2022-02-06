import React from "react";

interface NumberProps {
  value: number;
  padNumber?: number;
}

interface StringProps {
  value: string;
}

interface TransitionValueProps {
  value: string;
  padNumber?: number;
}

const letters = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

function LetterWithTransition({ value }: StringProps) {
  const oldValue = React.useRef(0);
  const [letter, setLetter] = React.useState("A");

  React.useEffect(() => {
    const startIndex = oldValue.current;
    const endIndex = letters.indexOf(value);
    const timeMs = 300;

    const endIsGreater = endIndex > startIndex;
    const delta = endIndex - startIndex;
    const step = delta / (timeMs / 20);

    let runningIndex = startIndex;

    const interval = setInterval(() => {
      runningIndex = runningIndex + step;
      // Break
      if (endIsGreater ? runningIndex >= endIndex : runningIndex <= endIndex) {
        oldValue.current = endIndex;
        runningIndex = endIndex;
        clearInterval(interval);
      }

      requestAnimationFrame(() => {
        setLetter(letters[Number(runningIndex.toFixed(0))]);
      });
    }, 20);
  }, [value]);

  return <>{letter}</>;
}

function LettersWithTransition({ value }: StringProps) {
  return (
    <>
      {value.split("").map((letter, index) => (
        <LetterWithTransition key={index} value={letter} />
      ))}
    </>
  );
}

function NumberWithTransition({ value, padNumber = 0 }: NumberProps) {
  const oldValue = React.useRef(0);
  const [number, setNumber] = React.useState("0");

  React.useEffect(() => {
    const startNumber = oldValue.current || 0;
    const endNumber = value;
    const timeMs = 300;

    const endIsGreater = endNumber > startNumber;
    const delta = endNumber - startNumber;
    const step = delta / (timeMs / 20);

    let runningValue = startNumber;

    const interval = setInterval(() => {
      runningValue = runningValue + step;
      // Break
      if (
        endIsGreater ? runningValue >= endNumber : runningValue <= endNumber
      ) {
        oldValue.current = endNumber;
        runningValue = endNumber;
        clearInterval(interval);
      }

      requestAnimationFrame(() => {
        setNumber(runningValue.toFixed(0).padStart(padNumber, "0"));
      });
    }, 20);
  }, [value, padNumber]);

  return <>{number}</>;
}

const regexp = new RegExp("([0-9]+)|([a-zA-Z]+)|([-/: ]+)", "g");
export function TransitionValue({ value, padNumber }: TransitionValueProps) {
  const sections = value.match(regexp);
  return (
    <>
      {sections?.flatMap((c, i) => {
        if (!isNaN(c as any) && c !== " ") {
          return (
            <NumberWithTransition
              key={i}
              value={Number(c)}
              padNumber={padNumber}
            />
          );
        } else if (c.toLowerCase() !== c.toUpperCase()) {
          return <LettersWithTransition key={i} value={c} />;
        } else {
          return c;
        }
      })}
    </>
  );
}
