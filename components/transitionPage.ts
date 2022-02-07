export async function startPageTransition() {
  return new Promise<void>((resolve) => {
    document.body.classList.add("transition");
    // Add classes in separate event loops to trigger a transition
    setTimeout(() => {
      requestAnimationFrame(() => {
        document.body.classList.add("start");
      });
    }, 0);

    setTimeout(() => {
      resolve();
    }, 300);
  });
}

export async function endPageTransition() {
  return new Promise<void>((resolve) => {
    // Start fading out
    document.body.classList.add("end");
    // Remove the overlay
    setTimeout(() => {
      requestAnimationFrame(() => {
        document.body.classList.remove("transition", "start", "end");
      });
    }, 300);

    resolve();
  });
}
