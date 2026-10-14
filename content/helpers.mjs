export const s = (id, title, body) => ({ id, title, body });
export const n = (text, tone = '') => `<div class="callout ${tone}"><p>${text}</p></div>`;
export const t = (headings, rows) => `<div class="table-wrap"><table><thead><tr>${headings.map(heading => `<th scope="col">${heading}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
export const q = (question, answer) => `<details><summary>${question}</summary><p>${answer}</p></details>`;
