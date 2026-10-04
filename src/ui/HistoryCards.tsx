/**
 * The real Max Wilms, beside the 3D likeness of him at his desk: one photograph with its credit.
 * In the 3D exhibit it hangs in the study next to him; without 3D it is shown over the still
 * picture. (His dates and the word parts of nephroblastoma are the key facts of their stops.)
 */
export function Portrait() {
  return (
    <figure className="wilms-photo" aria-label="Portrait of Max Wilms">
      <img
        src="/archive/wilms-portrait.webp"
        width={560}
        height={821}
        alt="Black-and-white portrait photograph of Max Wilms in a dark suit and bow tie, seated with an open book."
      />
      <figcaption>
        <b>Max Wilms</b> Photo: Wellcome Collection, CC BY 4.0
      </figcaption>
    </figure>
  );
}
