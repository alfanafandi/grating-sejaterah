"use client";

import { startTransition, useActionState, useState } from "react";

export function AdminForm({ action, children, submit, className = "", confirmText }) {
  const [state, formAction, pending] = useActionState(action, {});
  const [uploadError, setUploadError] = useState("");
  return <form action={formAction} className={className} onSubmit={(event) => {
    event.preventDefault();
    if (pending || (confirmText && !window.confirm(confirmText))) return;
    const data = new FormData(event.currentTarget);
    if (data.get("image")?.size > 2 * 1024 * 1024) {
      setUploadError("Ukuran foto maksimal 2 MB.");
      return;
    }
    setUploadError("");
    startTransition(() => formAction(data));
  }}>
    {children}
    {(uploadError || state?.error) && <p className="form-error" role="alert">{uploadError || state.error}</p>}
    {!uploadError && state?.message && <p className="notice" role="status">{state.message}</p>}
    <button className={"button " + (confirmText ? "secondary" : "primary")} disabled={pending}>
      {pending ? "Memproses…" : submit}
    </button>
  </form>;
}
