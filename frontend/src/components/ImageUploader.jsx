import React, { useRef, useState } from "react";
import { Upload, Link2, X, Loader } from "lucide-react";
import api from "../api";

/**
 * ImageUploader — lets the user pick a file from disk OR paste a URL.
 * Props:
 *   value    {string}   current image URL
 *   onChange {fn}       called with the new URL string
 *   label    {string}   field label
 */
export default function ImageUploader({ value, onChange, label = "Image" }) {
  const inputRef = useRef(null);
  const [mode, setMode] = useState("url"); // "url" | "file"
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post("/admin/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      onChange(res.data.url);
    } catch (err) {
      setError("Erreur lors de l'envoi. Réessayez ou utilisez une URL.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="bs-input-group">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <label style={{ margin: 0 }}>{label}</label>
        <div style={{ display: "flex", gap: 4 }}>
          <button type="button" onClick={() => setMode("file")} style={{
            padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, border: "1.5px solid",
            borderColor: mode === "file" ? "var(--forest)" : "var(--line)",
            background: mode === "file" ? "var(--forest-light)" : "transparent",
            color: mode === "file" ? "var(--forest-dark)" : "var(--muted)", cursor: "pointer"
          }}>
            <Upload size={11} style={{ verticalAlign: "-1px", marginRight: 4 }} />Depuis l'appareil
          </button>
          <button type="button" onClick={() => setMode("url")} style={{
            padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, border: "1.5px solid",
            borderColor: mode === "url" ? "var(--forest)" : "var(--line)",
            background: mode === "url" ? "var(--forest-light)" : "transparent",
            color: mode === "url" ? "var(--forest-dark)" : "var(--muted)", cursor: "pointer"
          }}>
            <Link2 size={11} style={{ verticalAlign: "-1px", marginRight: 4 }} />Par URL
          </button>
        </div>
      </div>

      {mode === "url" ? (
        <input
          className="bs-input"
          placeholder="https://images.unsplash.com/..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          style={{
            border: "2px dashed var(--line)", borderRadius: 10, padding: "20px 16px",
            textAlign: "center", cursor: "pointer", background: "var(--paper)",
            transition: "all 0.2s"
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--forest)"; e.currentTarget.style.background = "var(--forest-light)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.background = "var(--paper)"; }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          {uploading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--forest)" }}>
              <Loader size={18} style={{ animation: "spin 0.8s linear infinite" }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Envoi en cours...</span>
            </div>
          ) : (
            <>
              <Upload size={24} color="var(--sage)" style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>Cliquez pour choisir une image</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>JPG, PNG, WEBP — max 8 Mo</div>
            </>
          )}
        </div>
      )}

      {error && <div style={{ fontSize: 12, color: "#B4483A", marginTop: 6 }}>{error}</div>}

      {/* Preview */}
      {value && (
        <div style={{ position: "relative", display: "inline-block", marginTop: 10 }}>
          <img
            src={value}
            alt="Aperçu"
            style={{ width: 120, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid var(--line)" }}
          />
          <button
            type="button"
            onClick={() => onChange("")}
            style={{
              position: "absolute", top: -6, right: -6, width: 20, height: 20,
              borderRadius: "50%", border: "none", background: "#B4483A", color: "#fff",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0
            }}
          >
            <X size={11} />
          </button>
        </div>
      )}
    </div>
  );
}
