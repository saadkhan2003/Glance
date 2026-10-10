import type { WidgetSpec } from "@/lib/widgets/definitions";
import type { ViewModel } from "@/lib/widgets/model";

function componentName(label: string) {
  const name = label.replace(/[^a-zA-Z0-9]+/g, " ").trim().split(/\s+/).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("");
  return /^[A-Z]/.test(name) ? name : `Glance${name || "Widget"}`;
}

function money(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function componentSnippet(spec: WidgetSpec, model: ViewModel): string {
  const name = componentName(spec.label);
  const title = spec.label.replaceAll("`", "");
  if (spec.kind === "stat" || spec.kind === "delta" || spec.kind === "progress" || spec.kind === "gauge") {
    const shown = model.unit === "$" ? `$${money(model.value)}` : model.unit === "%" ? `${money(model.value)}%` : money(model.value);
    return `export function ${name}() {
  return (
    <section aria-label="${title}">
      <h2>${title}</h2>
      <p>${shown}</p>
      ${spec.kind === "delta" ? `<p>Previous: ${money(model.previous)}</p>` : ""}
    </section>
  );
}
`;
  }
  if (spec.kind === "line" || spec.kind === "bar" || spec.kind === "area" || spec.kind === "stacked" || spec.kind === "pie") {
    const points = model.labels.map((label, index) => ({ label, value: model.values[index] ?? 0 }));
    return `const points = ${JSON.stringify(points, null, 2)};

export function ${name}() {
  return (
    <section aria-label="${title}">
      <h2>${title}</h2>
      <ul>
        {points.map((point) => (
          <li key={point.label}>{point.label}: {point.value}</li>
        ))}
      </ul>
    </section>
  );
}
`;
  }
  if (model.rows.length) {
    const columns = Object.keys(model.rows[0]);
    return `const rows = ${JSON.stringify(model.rows, null, 2)};

export function ${name}() {
  return (
    <section aria-label="${title}">
      <h2>${title}</h2>
      <table>
        <thead>
          <tr>${columns.map((column) => `<th>${column}</th>`).join("")}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              ${columns.map((column) => `<td>{String(row[${JSON.stringify(column)}])}</td>`).join("\n              ")}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
`;
  }
  const records = model.people.length ? model.people : model.items.length ? model.items : model.columns;
  return `const records = ${JSON.stringify(records, null, 2)};

export function ${name}() {
  return (
    <section aria-label="${title}">
      <h2>${title}</h2>
      <pre>{JSON.stringify(records, null, 2)}</pre>
    </section>
  );
}
`;
}
