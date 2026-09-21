"use client";
import a from "@/messages/admin.json";
type Value = string | number | boolean | null | Value[] | { [key: string]: Value | undefined };
export function StructuredFields({
  value,
  onChange,
  path = "",
  depth = 0,
}: {
  value: Value;
  onChange: (v: Value) => void;
  path?: string;
  depth?: number;
}) {
  if (Array.isArray(value))
    return (
      <fieldset style={{ border: "1px solid var(--line)", padding: 20, borderRadius: 12 }}>
        <legend>{label(path)}</legend>
        <div className="stack">
          {value.map((item, i) => (
            <div key={i} className="stack">
              <StructuredFields
                value={item}
                path={`${path}.${i + 1}`}
                depth={depth + 1}
                onChange={(v) => onChange(value.map((x, j) => (i === j ? v : x)))}
              />
              <button
                type="button"
                className="btn secondary"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
              >
                {a.remove}
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn secondary"
            onClick={() => {
              const example = value[0];
              if (example && typeof example === "object" && !Array.isArray(example)) {
                const copy = { ...example };
                delete copy.id;
                if ("sku" in copy) copy.sku = "";
                onChange([...value, copy]);
              } else if (path.endsWith("images"))
                onChange([...value, { src: "household", alt: { en: "", sq: "" } }]);
              else if (path.endsWith("priceTiers"))
                onChange([...value, { minQty: 10, discountPct: 5 }]);
              else onChange([...value, ""]);
            }}
          >
            {a.add}
          </button>
        </div>
      </fieldset>
    );
  if (value !== null && typeof value === "object")
    return (
      <div className={depth < 2 ? "stack" : "form-grid"}>
        {Object.entries(value)
          .filter(([key]) => !["id", "createdAt", "updatedAt", "oldSlugs"].includes(key))
          .map(([key, v]) => (
            <div
              key={key}
              style={{ gridColumn: v !== null && typeof v === "object" ? "1 / -1" : undefined }}
            >
              {key === "translations" || key === "en" || key === "sq" ? (
                <fieldset
                  style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 20 }}
                >
                  <legend>{label(key)}</legend>
                  <StructuredFields
                    value={v ?? ""}
                    path={key}
                    depth={depth + 1}
                    onChange={(next) => onChange({ ...value, [key]: next })}
                  />
                </fieldset>
              ) : (
                <StructuredFields
                  value={v ?? ""}
                  path={key}
                  depth={depth + 1}
                  onChange={(next) => onChange({ ...value, [key]: next })}
                />
              )}
            </div>
          ))}
      </div>
    );
  const key = path.split(".").pop() || path;
  if (typeof value === "boolean")
    return (
      <label className="check">
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
        {label(key)}
      </label>
    );
  if (key === "status")
    return (
      <label>
        {label(key)}
        <select value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
          {(String(value).match(/^(NEW|CONTACTED|QUOTED|WON|LOST)$/)
            ? ["NEW", "CONTACTED", "QUOTED", "WON", "LOST"]
            : String(value).match(/^(READ|RESOLVED)$/)
              ? ["NEW", "READ", "RESOLVED"]
              : ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]
          ).map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </label>
    );
  if (key === "paymentStatus")
    return (
      <label>
        {label(key)}
        <select value={String(value)} onChange={(e) => onChange(e.target.value)}>
          {["UNPAID", "PAID", "REFUNDED"].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </label>
    );
  return (
    <label>
      {label(key)}
      {["description", "body", "note"].includes(key) ? (
        <textarea
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          rows={key === "body" ? 12 : 3}
        />
      ) : (
        <input
          type={typeof value === "number" ? "number" : "text"}
          step="any"
          value={value === null ? "" : String(value)}
          onChange={(e) =>
            onChange(typeof value === "number" ? Number(e.target.value) : e.target.value)
          }
        />
      )}
    </label>
  );
}
function label(key: string) {
  return (
    (a.fields as Record<string, string>)[key] ??
    key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())
  );
}
