export default async function run(page) {
  await page.setViewportSize({ width: 390, height: 844 });
  const pages = ["/", "/catalog", "/checkout?product=note-1000&qty=1", "/faq"];
  const report = [];

  for (const path of pages) {
    await page.goto(`https://icash.exchange${path}`, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(800);
    const metrics = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      const overflowX = Math.max(doc.scrollWidth, body.scrollWidth) - window.innerWidth;
      const issues = [];
      if (overflowX > 2) issues.push(`overflow-x:${overflowX}px`);
      document.querySelectorAll("h1,h2,.display").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > window.innerWidth - 8) issues.push(`wide-text:${el.textContent?.slice(0, 24)}`);
      });
      const card = document.querySelector(".voucher-card");
      if (card) {
        const footer = card.querySelector(".voucher-card-footer");
        const cr = card.getBoundingClientRect();
        if (footer) {
          const fr = footer.getBoundingClientRect();
          if (fr.bottom > cr.bottom + 1) issues.push("voucher-footer-clipped");
        }
        const text = card.innerText || "";
        if (!text.includes("SECURE") || !text.includes("VOUCHER")) issues.push("voucher-footer-missing-text");
      }
      return {
        title: document.title,
        overflowX,
        issues,
        scrollHeight: Math.max(doc.scrollHeight, body.scrollHeight),
      };
    });
    const shot = `C:/projects/icash-agent/.data/qa-${path.replace(/[/?=&]/g, "_") || "home"}.png`;
    await page.screenshot({ path: shot, fullPage: false });
    report.push({ path, ...metrics, shot });
  }
  return report;
}
