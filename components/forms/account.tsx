"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { SimpleForm, errorMessage } from "./simple-form";
import { Modal } from "@/components/ui/primitives";
type Address = {
  id: string;
  name: string;
  phone: string;
  line1: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};
export function Addresses({ addresses }: { addresses: Address[] }) {
  const t = useTranslations();
  const router = useRouter();
  const [editing, setEditing] = useState<Address | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  async function remove(id: string) {
    setBusy(id);
    setError("");
    try {
      const r = await fetch("/api/delete-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      router.refresh();
    } catch (e) {
      setError(errorMessage(e instanceof Error ? e.message : "", t));
    } finally {
      setBusy("");
    }
  }
  return (
    <>
      <button
        className="btn"
        onClick={() => {
          setEditing(null);
          setOpen(true);
        }}
      >
        {t("addAddress")}
      </button>
      {!addresses.length && (
        <p style={{ marginTop: 24 }} className="muted">
          {t("empty")}
        </p>
      )}
      <div className="grid2" style={{ marginTop: 24 }}>
        {addresses.map((a) => (
          <article className="panel" key={a.id}>
            <h3>{a.name}</h3>
            <p>
              {a.line1}
              <br />
              {a.city}, {a.postalCode}
              <br />
              {a.phone}
            </p>
            {a.isDefault && <p className="badge">{t("defaultAddress")}</p>}
            <div className="row">
              <button
                className="btn secondary"
                onClick={() => {
                  setEditing(a);
                  setOpen(true);
                }}
              >
                {t("edit")}
              </button>
              <button
                className="btn secondary"
                disabled={busy === a.id}
                onClick={() => remove(a.id)}
              >
                {busy === a.id ? t("loading") : t("delete")}
              </button>
            </div>
          </article>
        ))}
      </div>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      <Modal title={t(editing ? "edit" : "addAddress")} open={open} onOpenChange={setOpen}>
        <SimpleForm
          key={editing?.id ?? "new"}
          kind="address"
          initial={editing ?? {}}
          extra={editing ? { id: editing.id } : {}}
          onDone={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}
export function Logout({ locale }: { locale: string }) {
  const t = useTranslations();
  return (
    <button className="btn secondary" onClick={() => signOut({ callbackUrl: `/${locale}` })}>
      {t("logout")}
    </button>
  );
}
