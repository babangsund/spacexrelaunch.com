import { useRouter } from "next/router";

import styles from "./Header.module.css";
import { startPageTransition } from "../transitionPage";

export default function Header() {
  const router = useRouter();
  const isHome = router.pathname === "/";
  return (
    <header className={styles.header}>
      <img
        alt="SpaceX"
        src="/images/x.svg"
        className={styles.logo}
        onClick={async () => {
          if (!isHome) {
            await startPageTransition();
            router.push("/");
          }
        }}
      />
      <p className={styles.affiliation}>
        This site is <strong>not</strong> affiliated with SpaceX
      </p>
    </header>
  );
}
