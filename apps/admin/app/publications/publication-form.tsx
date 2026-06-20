"use client";

import {
  ArrowLeft,
  Bold,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode, RefObject } from "react";
import { ChangeEvent, FormEvent, useRef, useState } from "react";

type Status = "DRAFT" | "PUBLISHED" | "ARCHIVED";
type Category = "BERITA_KEGIATAN" | "ARTIKEL_RENUNGAN" | "PUBLIKASI_RESMI";

export type Publication = {
  id: string;
  slug: string;
  title: string;
  category: Category;
  excerpt: string;
  content: string[];
  author: string;
  publishedAt: string | null;
  thumbnailUrl: string | null;
  thumbnailTone: string | null;
  readTime: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  status: Status;
};

type FormState = {
  slug: string;
  title: string;
  category: Category;
  contentHtml: string;
  author: string;
  publishedAt: string;
  thumbnailUrl: string;
  thumbnailTone: string;
  status: Status;
};

const categories: { value: Category; label: string }[] = [
  { value: "BERITA_KEGIATAN", label: "Berita Kegiatan" },
  { value: "ARTIKEL_RENUNGAN", label: "Artikel dan Renungan" },
  { value: "PUBLIKASI_RESMI", label: "Publikasi Resmi" },
];
const statuses: Status[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const SLUG_MAX_LENGTH = 80;

const emptyForm: FormState = {
  slug: "",
  title: "",
  category: "BERITA_KEGIATAN",
  contentHtml: "",
  author: "",
  publishedAt: new Date().toISOString().slice(0, 10),
  thumbnailUrl: "",
  thumbnailTone: "",
  status: "DRAFT",
};

const limitSlugLength = (value: string) => {
  if (value.length <= SLUG_MAX_LENGTH) return value;

  const words = value.split("-");
  const selectedWords: string[] = [];
  let currentLength = 0;

  for (const word of words) {
    const nextLength =
      currentLength + word.length + (selectedWords.length ? 1 : 0);
    if (nextLength > SLUG_MAX_LENGTH) break;
    selectedWords.push(word);
    currentLength = nextLength;
  }

  return (
    selectedWords.length
      ? selectedWords.join("-")
      : value.slice(0, SLUG_MAX_LENGTH)
  ).replace(/-+$/g, "");
};

const toSlug = (value: string) => {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return limitSlugLength(normalized);
};

const stripHtml = (value: string) =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

const makeExcerpt = (value: string) => {
  const words = stripHtml(value).split(" ").filter(Boolean);
  return words.slice(0, 28).join(" ");
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const contentToHtml = (content: string[]) => {
  if (content.some((item) => /<\/?[a-z][\s\S]*>/i.test(item)))
    return content.join("");
  return content.map((item) => `<p>${escapeHtml(item)}</p>`).join("");
};

const toForm = (item: Publication): FormState => ({
  slug: toSlug(item.slug),
  title: item.title,
  category: item.category,
  contentHtml: contentToHtml(item.content),
  author: item.author,
  publishedAt: item.publishedAt ? item.publishedAt.slice(0, 10) : "",
  thumbnailUrl: item.thumbnailUrl ?? "",
  thumbnailTone: item.thumbnailTone ?? "",
  status: item.status,
});

export function PublicationForm({
  initialItem,
  currentUserName,
}: {
  initialItem?: Publication;
  currentUserName: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<FormState>({
    ...(initialItem ? toForm(initialItem) : emptyForm),
    author: currentUserName,
  });
  const initialContentHtml = useRef(form.contentHtml);
  const latestContentHtml = useRef(form.contentHtml);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const isEdit = Boolean(initialItem);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateTitle(value: string) {
    setForm((current) => ({
      ...current,
      title: value,
      slug: toSlug(value),
    }));
  }

  function runEditorCommand(command: string) {
    editorRef.current?.focus();
    document.execCommand(command);
    latestContentHtml.current = editorRef.current?.innerHTML ?? "";
  }

  async function uploadThumbnail(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setNotice("");
    setError("");

    const data = new FormData();
    data.set("image", file);

    try {
      const response = await fetch("/api/admin/publications/upload", {
        method: "POST",
        body: data,
      });
      const result = await response.json();
      if (!response.ok || !result.success)
        throw new Error(result.message ?? "Gagal upload thumbnail");
      update("thumbnailUrl", result.data.url);
      setNotice(result.message);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Gagal upload thumbnail",
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    setError("");

    const contentHtml = (
      editorRef.current?.innerHTML ?? latestContentHtml.current
    ).trim();
    const excerpt = makeExcerpt(contentHtml);
    const slug = toSlug(form.slug || form.title);
    const payload = {
      ...form,
      slug,
      author: currentUserName,
      excerpt,
      readTime: null,
      seoTitle: form.title,
      seoDescription: excerpt,
      publishedAt: form.publishedAt
        ? new Date(form.publishedAt).toISOString()
        : null,
      thumbnailUrl: form.thumbnailUrl || null,
      content: contentHtml ? [contentHtml] : [],
    };

    try {
      const response = await fetch(
        isEdit
          ? `/api/admin/publications/${initialItem?.id}`
          : "/api/admin/publications",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = await response.json();
      if (!response.ok || !result.success)
        throw new Error(result.message ?? "Gagal menyimpan publikasi");
      setNotice(result.message);
      router.replace("/publications");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Gagal menyimpan publikasi",
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!initialItem || !confirm(`Hapus publikasi "${initialItem.title}"?`))
      return;

    setSaving(true);
    try {
      const response = await fetch(
        `/api/admin/publications/${initialItem.id}`,
        { method: "DELETE" },
      );
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message);
      router.replace("/publications");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Gagal menghapus publikasi",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="py-6" onSubmit={save}>
      <section className="rounded-md border border-slate-200 bg-white shadow-sm">
        <Header
          title={isEdit ? "Read / Update Publikasi" : "Create Publikasi"}
          saving={saving}
          remove={isEdit ? remove : undefined}
        />
        <div className="grid gap-4 p-4">
          {notice ? <Alert tone="good" text={notice} /> : null}
          {error ? <Alert tone="bad" text={error} /> : null}

          {form.thumbnailUrl ? (
            <div className="aspect-[16/7] max-h-72 overflow-hidden rounded-md bg-slate-100">
              <img
                src={form.thumbnailUrl}
                alt={form.title || "Thumbnail publikasi"}
                className="h-full w-full object-cover"
              />
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Title"
              value={form.title}
              onChange={updateTitle}
              required
            />
            <Select
              label="Kategori"
              value={form.category}
              onChange={(value) => update("category", value as Category)}
              options={categories}
            />
            <Select
              label="Status"
              value={form.status}
              onChange={(value) => update("status", value as Status)}
              options={statuses.map((status) => ({
                value: status,
                label: status,
              }))}
            />
            <Field
              label="Author"
              value={currentUserName}
              onChange={() => undefined}
              required
              readOnly
            />
            <Field
              label="Tanggal Publish"
              type="date"
              value={form.publishedAt}
              onChange={(value) => update("publishedAt", value)}
            />
            <div className="grid gap-2 text-sm font-semibold text-slate-700">
              Thumbnail URL
              <input
                ref={fileInputRef}
                className="sr-only"
                type="file"
                accept="image/*"
                onChange={uploadThumbnail}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-bold disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Upload size={16} />
                )}
                Browse
              </button>
              {form.thumbnailUrl ? (
                <p className="truncate text-xs font-normal text-slate-500">
                  {form.thumbnailUrl}
                </p>
              ) : null}
            </div>
          </div>

          <RichTextEditor
            editorRef={editorRef}
            initialValue={initialContentHtml.current}
            onChange={(value) => {
              latestContentHtml.current = value;
            }}
            onCommand={runEditorCommand}
          />
        </div>
      </section>
    </form>
  );
}

function Header({
  title,
  saving,
  remove,
}: {
  title: string;
  saving: boolean;
  remove?: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 p-4">
      <div>
        <Link
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600"
          href="/publications"
        >
          <ArrowLeft size={16} />
          Kembali ke daftar
        </Link>
        <h3 className="mt-3 font-bold">{title}</h3>
      </div>
      <div className="flex gap-2">
        {remove ? (
          <button
            type="button"
            onClick={remove}
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-red-200 px-3 text-sm font-bold text-red-700"
          >
            <Trash2 size={16} />
            Hapus
          </button>
        ) : null}
        <button
          disabled={saving}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-bold text-white"
        >
          {saving ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Save size={16} />
          )}
          Simpan
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  readOnly,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  readOnly?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      <input
        className="h-10 rounded-md border border-slate-300 px-3 text-sm read-only:bg-slate-100 read-only:text-slate-600"
        type={type}
        value={value}
        required={required}
        readOnly={readOnly}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function RichTextEditor({
  editorRef,
  initialValue,
  onChange,
  onCommand,
}: {
  editorRef: RefObject<HTMLDivElement | null>;
  initialValue: string;
  onChange: (value: string) => void;
  onCommand: (command: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      Content
      <div className="overflow-hidden rounded-md border border-slate-300">
        <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 p-2">
          <ToolbarButton label="Bold" onClick={() => onCommand("bold")}>
            <Bold size={16} />
          </ToolbarButton>
          <ToolbarButton label="Italic" onClick={() => onCommand("italic")}>
            <Italic size={16} />
          </ToolbarButton>
          <ToolbarButton
            label="Bullet list"
            onClick={() => onCommand("insertUnorderedList")}
          >
            <List size={16} />
          </ToolbarButton>
          <ToolbarButton
            label="Numbered list"
            onClick={() => onCommand("insertOrderedList")}
          >
            <ListOrdered size={16} />
          </ToolbarButton>
        </div>
        <div
          ref={editorRef}
          className="min-h-72 px-3 py-2 text-sm font-normal leading-6 outline-none focus:ring-2 focus:ring-sky-100"
          contentEditable
          suppressContentEditableWarning
          dangerouslySetInnerHTML={{ __html: initialValue }}
          onInput={(event) => onChange(event.currentTarget.innerHTML)}
        />
      </div>
    </label>
  );
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
    >
      {children}
    </button>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      <select
        className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Alert({ tone, text }: { tone: "good" | "bad"; text: string }) {
  return (
    <div
      className={`rounded-md border px-3 py-2 text-sm ${tone === "good" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}
    >
      {text}
    </div>
  );
}
