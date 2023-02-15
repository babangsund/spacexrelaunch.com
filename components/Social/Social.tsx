import styles from "./Social.module.css";

interface ExternalLinkProps {
  children: React.ReactNode;
  href: string;
}

function ExternalLink({ children, href }: ExternalLinkProps) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={styles.link}>
      {children}
    </a>
  );
}

export default function Aside() {
  return (
    <aside className={styles.social}>
      <ExternalLink href="https://github.com/babangsund/spacexrelaunch.com">
        <img src="/images/github.svg" alt="Github" />
      </ExternalLink>
      <ExternalLink href="https://twitter.com/babangsund">
        <img src="/images/twitter.svg" alt="Twitter" />
      </ExternalLink>
      <ExternalLink href="https://linkedin.com/in/babangsund">
        <img src="/images/linkedin.svg" alt="Linkedin" />
      </ExternalLink>
    </aside>
  );
}
