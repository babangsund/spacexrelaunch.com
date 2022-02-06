import { useRouter } from "next/router";

import styles from "./Header.module.css";
import { startPageTransition } from "../transitionPage";

export default function Header() {
  const router = useRouter();
  const isHome = router.pathname === "/";
  return (
    <header className={styles.header}>
      <img
        className={styles.logo}
        alt="SpaceX"
        src="/images/x.svg"
        onClick={async () => {
          if (!isHome) {
            await startPageTransition();
            router.push("/");
          }
        }}
      />
    </header>
  );
}
