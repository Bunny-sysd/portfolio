const PROMPT_LINE_RE = /^(<span class="cmd-prompt">.*?<\/span>)(.*)$/;

// Comment lines pop in; each `$ command` types out, then pauses before the next.
// Returns a stop function so a reopened dialog never gets a second, interleaved reveal.
export function revealCommandBlocks(root) {
  const timeouts = [];
  const later = (fn, ms) => timeouts.push(setTimeout(fn, ms));
  root.querySelectorAll('.command-block-code').forEach((block) => {
    if (!block.dataset.rawHtml) block.dataset.rawHtml = block.innerHTML;
    const lines = block.dataset.rawHtml.split('\n');
    block.innerHTML = '';
    let delay = 0;
    lines.forEach((lineHtml) => {
      const lineWrap = document.createElement('span');
      lineWrap.className = 'command-line-reveal';
      const promptMatch = lineHtml.match(PROMPT_LINE_RE);
      if (promptMatch) {
        const [, promptHtml, commandText] = promptMatch;
        later(() => { lineWrap.innerHTML = promptHtml; block.appendChild(lineWrap); }, delay);
        for (let ci = 1; ci <= commandText.length; ci++) {
          later(() => { lineWrap.innerHTML = promptHtml + commandText.slice(0, ci); }, delay + 60 + ci * 18);
        }
        delay += 60 + commandText.length * 18 + 450;
      } else {
        later(() => { lineWrap.innerHTML = lineHtml; block.appendChild(lineWrap); }, delay);
        delay += lineHtml.trim() ? 150 : 80;
      }
    });
  });
  return () => timeouts.forEach(clearTimeout);
}
