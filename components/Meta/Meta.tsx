const title = "Not SpaceX Launches";
const description = "Launch SpaceX missions on-demand.";

export default function Meta() {
  return (
    <>
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content="https://notspacexlaunches.com/images/og-image.png" />

      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content="https://notspacexlaunches.com/images/og-image.png" />
      <meta name="twitter:site" content="@babangsund" />
      <meta name="twitter:creator" content="@babangsund" />
      <meta name="twitter:card" content="summary" />
    </>
  );
}
