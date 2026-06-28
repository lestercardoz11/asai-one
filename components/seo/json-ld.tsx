/**
 * Renders a JSON-LD <script> for structured data (SEO / rich results).
 * `data` is server-controlled catalogue content (not user input); we still
 * escape `<` to `<` so a value containing `</script>` can't break out.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
