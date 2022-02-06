export async function startPageTransition() {
  return new Promise<void>((resolve) => {
    document.body.classList.add("transition");
    // Add classes in separate event loops to trigger a transition
    setTimeout(() => {
      document.body.classList.add("start");
    }, 0);

    setTimeout(() => {
      resolve();
    }, 300);
  });
}

export async function endPageTransition() {
  return new Promise<void>((resolve) => {
    document.body.classList.add("end");

    setTimeout(() => {
      document.body.classList.remove("transition", "start", "end");
    }, 300);

    resolve();
  });
}