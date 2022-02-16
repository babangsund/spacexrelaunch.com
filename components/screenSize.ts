type ScreenSize = "xl" | "l" | "m" | "s" | "xs";

function getScreenSize(): ScreenSize {
  const screenWidth = window.innerWidth;

  if (screenWidth >= 1400) {
    return "xl";
  }

  if (screenWidth >= 1200) {
    return "l";
  }

  // If smaller than 1200
  if (screenWidth >= 992) {
    return "m";
  }

  // If smaller than 992
  if (screenWidth >= 768) {
    return "s";
  }

  // if smaller than 768
  return "xs";
}

interface ByScreenSize<T> {
  xs: T;
  s?: T;
  m?: T;
  l?: T;
  xl?: T;
}

export function byScreenSize<T>({
  xs,
  s = xs,
  m = s || xs,
  l = m || s || xs,
  xl = l || m || s || xs,
}: ByScreenSize<T>) {
  const screenSize = getScreenSize();
  const isXS = screenSize === "xs";
  const isSmall = screenSize === "s";
  const isMedium = screenSize === "m";
  const isLarge = screenSize === "l";

  if (isXS) return xs;
  if (isXS || isSmall) return s;
  if (isMedium) return m;
  if (isLarge) return l;
  return xl;
}
