import React from "react";

export type ScreenSize = "xl" | "l" | "m" | "s" | "xs";

function getScreenSize(screenWidth = window.innerWidth): ScreenSize {
  if (screenWidth > 1399.98) {
    return "xl";
  }

  if (screenWidth > 1199.98) {
    return "l";
  }

  if (screenWidth > 991.98) {
    return "m";
  }

  if (screenWidth > 767.98) {
    return "s";
  }

  return "xs";
}

interface ByScreenSize<T> {
  xs: T;
  s?: T;
  m?: T;
  l?: T;
  xl?: T;
  screenSize?: ScreenSize;
}

export function byScreenSize<T>({
  //screenSize = getScreenSize(window.innerWidth),
  screenSize = getScreenSize(1200),
  xs,
  s = xs,
  m = s || xs,
  l = m || s || xs,
  xl = l || m || s || xs,
}: ByScreenSize<T>) {
  switch (screenSize) {
    case "xs":
      return xs;
    case "s":
      return s;
    case "m":
      return m;
    case "l":
      return l;
    default:
      return xl;
  }
}

export function useResizeObserver<TElement extends HTMLElement>(): [
  React.MutableRefObject<TElement | null>,
  number
] {
  const ref = React.useRef<TElement>(null);
  const [width, setWidth] = React.useState(0);

  React.useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentBoxSize) {
          // Firefox implements `contentBoxSize` as a single content rect, rather than an array
          const contentBoxSize: ResizeObserverSize = Array.isArray(entry.contentBoxSize)
            ? entry.contentBoxSize[0]
            : entry.contentBoxSize;

          setWidth(contentBoxSize.inlineSize);
        } else {
          setWidth(entry.contentRect.width);
        }
      }
    });

    if (ref.current) {
      resizeObserver.observe(ref.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return [ref, width];
}

export function useScreenSize<TElement extends HTMLElement>(): [
  React.MutableRefObject<TElement | null>,
  ScreenSize
] {
  const [ref, width] = useResizeObserver<TElement>();
  const [screenSize, setScreenSize] = React.useState<ScreenSize>("xl");

  React.useEffect(() => {
    setScreenSize(getScreenSize(width));
  }, [width]);

  return [ref, screenSize];
}
