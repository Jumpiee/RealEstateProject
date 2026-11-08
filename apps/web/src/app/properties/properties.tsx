"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./properties.module.css";

type Posting = {
  publicationCheckId: string;
  websiteName: string;
  isPublished: boolean;
  publishedAt: string | null;
};
type Property = {
  propertyId: string;
  name: string;
  type: string;
  address: string;
  area: string;
  price: string;
  description: string | null;
  status: string;
  ownerName: string;
  publicationChecks: Posting[];
  tasks?: Array<{ taskId: string; stepName: string; stepOrder: number }>;
};
type FormState = { message?: string; error?: string; fields?: string[] };
type OwnerMatch = { id: string; name: string; phone: string };
const statuses = ["available", "in_progress", "sold"];
const statusLabels: Record<string, string> = { available: "\u0e27\u0e48\u0e32\u0e07", in_progress: "\u0e01\u0e33\u0e25\u0e31\u0e07\u0e14\u0e33\u0e40\u0e19\u0e34\u0e19\u0e01\u0e32\u0e23", sold: "\u0e02\u0e32\u0e22\u0e41\u0e25\u0e49\u0e27" };
const websites = ["DDproperty", "LivingInsider", "Facebook"];
const allLabel = "\u0e17\u0e31\u0e49\u0e07\u0e2b\u0e21\u0e14";
const formatDecimal = (value: string) => {
  const [whole = "0", fraction] = value.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return fraction ? `${grouped}.${fraction}` : grouped;
};
const initialForm = {
  ownerName: "",
  ownerPhone: "",
  name: "",
  type: "",
  address: "",
  area: "",
  price: "",
  description: "",
};

export default function Properties({
  initialProperties,
}: {
  initialProperties: Property[];
}) {
  const router = useRouter();
  const [properties, setProperties] = useState(initialProperties);
  const [filter, setFilter] = useState(allLabel);
  const [form, setForm] = useState(initialForm);
  const [feedback, setFeedback] = useState<FormState>({});
  const [ownerMatches, setOwnerMatches] = useState<OwnerMatch[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const addDialogRef = useRef<HTMLDialogElement>(null);
  const ownerNameRef = useRef<HTMLInputElement>(null);
  const [selectedId, setSelectedId] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [checklistId, setChecklistId] = useState("");
  const [tasksLoading, setTasksLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const selected = properties.find((p) => p.propertyId === selectedId);

  useEffect(() => {
    if (!checklistId) return;
    let active = true;
    setTasksLoading(true);
    void fetch(`/api/properties/${checklistId}`)
      .then((response) => response.ok ? response.json() : null)
      .then((detail) => {
        if (!active || !detail) return;
        setProperties((current) => current.map((property) => property.propertyId === checklistId
          ? { ...property, tasks: detail.tasks ?? [], publicationChecks: detail.publicationChecks ?? property.publicationChecks }
          : property));
      })
      .finally(() => { if (active) setTasksLoading(false); });
    return () => { active = false; };
  }, [checklistId]);

  useEffect(() => {
    if (!addOpen) return;
    const dialog = addDialogRef.current;
    if (!dialog?.open) dialog?.showModal();
    ownerNameRef.current?.focus();
  }, [addOpen]);

  useEffect(() => {
    if (!addOpen || !feedback.fields?.length) return;
    addDialogRef.current
      ?.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        `.${styles.invalid} input, .${styles.invalid} textarea`,
      )
      ?.focus();
  }, [addOpen, feedback.fields]);

  const filteredProperties = useMemo(
    () =>
      filter === allLabel
        ? properties
        : properties.filter((p) => p.status === filter),
    [properties, filter],
  );

  async function refresh(nextFilter = filter) {
    const response = await fetch(
      `/api/properties?status=${encodeURIComponent(nextFilter === allLabel ? "all" : nextFilter)}`,
    );
    if (!response.ok) throw new Error("Could not refresh properties");
    setProperties(await response.json());
    router.refresh();
  }

  async function saveProperty(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (ownerMatches.length > 0 && !selectedOwnerId) {
      setFeedback({ error: "กรุณาเลือกเจ้าของที่ตรงกับเบอร์โทรศัพท์" });
      return;
    }
    setBusy(true);
    setFeedback({});
    try {
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ...(selectedOwnerId ? { ownerId: selectedOwnerId } : {}) }),
      });
      const result = await response.json();
      if (response.status === 409 && Array.isArray(result.ownerMatches)) {
        setOwnerMatches(result.ownerMatches);
        setSelectedOwnerId("");
        return;
      }
      if (!response.ok) {
        setFeedback({ error: result.error, fields: result.fields });
        return;
      }
      setForm(initialForm);
      setOwnerMatches([]);
      setSelectedOwnerId("");
      addDialogRef.current?.close();
      setAddOpen(false);
      setFilter(allLabel);
      try {
        await refresh(allLabel);
        setFeedback({ message: result.message });
      } catch {
        router.refresh();
        setFeedback({ message: "บันทึกอสังหาสำเร็จ แต่โหลดรายการล่าสุดไม่สำเร็จ กรุณารีเฟรชหน้า" });
      }
    } catch {
      router.refresh();
      setFeedback({ error: "ไม่สามารถยืนยันผลการบันทึกได้ กรุณารีเฟรชและตรวจสอบรายการก่อนดำเนินการซ้ำ" });
    } finally {
      setBusy(false);
    }
  }

  async function savePosting(propertyId: string, website: string, isPublished: boolean) {
    setBusy(true);
    setFeedback({});
    try {
      const posting = properties.find((property) => property.propertyId === propertyId)
        ?.publicationChecks.find((check) => check.websiteName === website);
      if (!posting) {
        setFeedback({ error: "ไม่พบรายการเว็บไซต์ที่เลือก" });
        return;
      }
      const response = await fetch(`/api/properties/${propertyId}/postings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicationCheckId: posting.publicationCheckId, isPublished, publishedAt: isPublished ? new Date().toISOString() : null }),
      });
      const result = await response.json();
      if (!response.ok) {
        setFeedback({ error: result.error });
        return;
      }
      try {
        await refresh();
        setFeedback({ message: result.message });
      } catch {
        router.refresh();
        setFeedback({ message: "บันทึกผลการลงประกาศแล้ว แต่โหลดข้อมูลล่าสุดไม่สำเร็จ กรุณารีเฟรชหน้า" });
      }
    } catch {
      router.refresh();
      setFeedback({ error: "ไม่สามารถยืนยันผลการบันทึกประกาศได้ กรุณารีเฟรชและตรวจสอบรายการก่อนดำเนินการซ้ำ" });
    } finally {
      setBusy(false);
    }
  }

  async function saveStatus(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback({});
    if (!selectedId || !statuses.includes(newStatus) || !confirmed) {
      setFeedback({ error: "กรุณาเลือกสถานะเป็น ว่าง กำลังดำเนินการ หรือขายแล้ว." });
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/properties/${selectedId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, confirmed }),
      });
      const result = await response.json();
      if (!response.ok) {
        setFeedback({ error: result.error });
        return;
      }
      setNewStatus("");
      setConfirmed(false);
      setSelectedId("");
      try {
        await refresh();
        setFeedback({ message: result.message });
      } catch {
        router.refresh();
        setFeedback({ message: "บันทึกสถานะแล้ว แต่โหลดสถานะล่าสุดไม่สำเร็จ กรุณารีเฟรชหน้า" });
      }
    } catch {
      router.refresh();
      setFeedback({ error: "ไม่สามารถยืนยันผลการเปลี่ยนสถานะได้ กรุณารีเฟรชและตรวจสอบสถานะกับประวัติก่อนดำเนินการซ้ำ" });
    } finally {
      setBusy(false);
    }
  }

  function changeFilter(value: string) {
    setFilter(value);
    setFeedback({});
    void refresh(value);
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>จัดการรายการและความคืบหน้า</p>
          <h1>อสังหาริมทรัพย์</h1>
          <p>บันทึกทรัพย์ที่รับฝาก ติดตามการประกาศ และจัดการสถานะ</p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.count}>{properties.length} รายการ</span>
          <button
            type="button"
            className={styles.primary}
            aria-haspopup="dialog"
            onClick={() => {
              setFeedback({});
              setAddOpen(true);
            }}
          >
            <span aria-hidden="true">＋</span> เพิ่มอสังหา
          </button>
        </div>
      </header>
      {feedback.message && (
        <p className={styles.success} role="status">
          {feedback.message}
        </p>
      )}
      {feedback.error && !addOpen && (
        <p className={styles.error} role="alert">
          {feedback.error}
        </p>
      )}

      {addOpen && <dialog
        id="add-property-dialog"
        ref={addDialogRef}
        className={`${styles.dialog} ${styles.addDialog}`}
        aria-labelledby="add-property-title"
        onClose={() => {
          setAddOpen(false);
          setFeedback((current) => current.error ? {} : current);
        }}
      >
        <button
          type="button"
          className={styles.close}
          onClick={() => addDialogRef.current?.close()}
          aria-label="ปิด"
        >
          ×
        </button>
        <h2 id="add-property-title">เพิ่มอสังหา</h2>
        <p className={styles.help}>กรอกข้อมูลเจ้าของและอสังหาที่ตัดสินใจรับฝากแล้ว</p>
        {feedback.error && (
          <p className={styles.error} role="alert">{feedback.error}</p>
        )}
        <form onSubmit={saveProperty} className={styles.form}>
          <label
            className={
              feedback.fields?.includes("ownerName") ? styles.invalid : ""
            }
          >
            ชื่อเจ้าของ
            <input
              ref={ownerNameRef}
              value={form.ownerName}
              onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
            />
          </label>
          <label
            className={
              feedback.fields?.includes("ownerPhone") ? styles.invalid : ""
            }
          >
            เบอร์ติดต่อ
          <input
              inputMode="numeric"
              value={form.ownerPhone}
              onChange={(e) => {
                setForm({ ...form, ownerPhone: e.target.value });
                setOwnerMatches([]);
                setSelectedOwnerId("");
              }}
              placeholder="ตัวเลข 10 หลัก"
            />
          </label>
          {ownerMatches.length > 0 && (
            <fieldset className={`${styles.wide} ${styles.panel}`}>
              <legend>พบเจ้าของที่ตรงกับเบอร์โทรศัพท์ กรุณาเลือกเจ้าของที่ต้องการใช้</legend>
              {ownerMatches.map((owner) => (
                <label key={owner.id}>
                  <input
                    type="radio"
                    name="owner-match"
                    value={owner.id}
                    checked={selectedOwnerId === owner.id}
                    onChange={() => setSelectedOwnerId(owner.id)}
                  />
                  {owner.name} · {owner.phone}
                </label>
              ))}
            </fieldset>
          )}
          <label
            className={feedback.fields?.includes("name") ? styles.invalid : ""}
          >
            ชื่ออสังหา
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label
            className={feedback.fields?.includes("type") ? styles.invalid : ""}
          >
            ประเภทอสังหา
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="">เลือกประเภท</option>
              <option value="house">บ้าน</option>
              <option value="condo">คอนโดมิเนียม</option>
              <option value="townhouse">ทาวน์เฮาส์</option>
              <option value="land">ที่ดิน</option>
            </select>
          </label>
          <label
            className={`${styles.wide} ${feedback.fields?.includes("address") ? styles.invalid : ""}`}
          >
            ที่อยู่
            <textarea
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </label>
          <label
            className={feedback.fields?.includes("area") ? styles.invalid : ""}
          >
            พื้นที่ (ตร.ม.)
            <input
              type="number"
              step="0.01"
              value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
            />
          </label>
          <label
            className={feedback.fields?.includes("price") ? styles.invalid : ""}
          >
            ราคา (บาท)
            <input
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </label>
          <label
            className={`${styles.wide} ${feedback.fields?.includes("description") ? styles.invalid : ""}`}
          >
            รายละเอียด
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </label>
          <div className={`${styles.wide} ${styles.actions}`}>
            <button type="submit" disabled={busy} className={styles.primary}>
              {busy ? "กำลังบันทึก…" : "บันทึก"}
            </button>
            <button
              type="button"
              disabled={busy}
              className={styles.secondary}
              onClick={() => addDialogRef.current?.close()}
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </dialog>}

      <section className={styles.panel}>
        <div className={styles.sectionTitle}>
          <div>
            <h2>รายการอสังหา</h2>
            <p className={styles.help}>ดูสถานะปัจจุบันและเลือกทำรายการ</p>
          </div>
          <label className={styles.filter}>
            กรองสถานะ
            <select
              value={filter}
              onChange={(e) => changeFilter(e.target.value)}
            >
              <option value={allLabel}>{allLabel}</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{statusLabels[s]}</option>
              ))}
            </select>
          </label>
        </div>
        {filteredProperties.length === 0 ? (
          <div className={styles.empty}>
            <strong>
              {properties.length
                ? "ไม่พบข้อมูลอสังหาตามสถานะที่เลือก"
                : "ยังไม่มีข้อมูลอสังหา"}
            </strong>
            {properties.length > 0 && (
              <button
                type="button"
                className={styles.secondary}
                onClick={() => changeFilter(allLabel)}
              >
                แสดงทั้งหมด
              </button>
            )}
          </div>
        ) : (
          <div className={styles.cards}>
            {filteredProperties.map((property) => (
              <article className={styles.card} key={property.propertyId}>
                <div className={styles.cardTop}>
                  <div>
                    <h3>{property.name}</h3>
                    <span>
                      {property.type} · เจ้าของ {property.ownerName}
                    </span>
                  </div>
                  <span className={styles.badge}>{statusLabels[property.status] ?? property.status}</span>
                </div>
                <p>{property.address}</p>
                <p className={styles.meta}>
                  {formatDecimal(property.area)} ตร.ม. · {formatDecimal(property.price)} บาท
                </p>
                {property.description && <p>{property.description}</p>}
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.secondary}
                    onClick={() => {
                      setSelectedId(property.propertyId);
                      setNewStatus(property.status);
                      setConfirmed(false);
                      setFeedback({});
                    }}
                  >
                    เปลี่ยนสถานะ
                  </button>
                  <button
                    type="button"
                    className={styles.secondary}
                    onClick={() => {
                      setChecklistId(checklistId === property.propertyId ? "" : property.propertyId);
                      setFeedback({});
                    }}
                  >
                    เว็บที่ลงประกาศ
                  </button>
                </div>
                {checklistId === property.propertyId && (
                  <div className={styles.checklist}>
                    <h5>ขั้นตอนติดตามงาน</h5>
                    {tasksLoading && <p>กำลังโหลดข้อมูล…</p>}
                    {!tasksLoading && property.tasks?.map((task) => (
                      <p key={task.taskId}>{task.stepOrder}. {task.stepName}</p>
                    ))}
                    <h4>รายการเว็บไซต์</h4>
                    <p className={styles.help}>
                      ลงประกาศด้วยตนเอง แล้วทำเครื่องหมายเมื่อสำเร็จ
                    </p>
                    {websites.map((website) => {
                      const posting = property.publicationChecks.find(
                        (entry) => entry.websiteName === website,
                      );
                      return (
                        <div className={styles.website} key={website}>
                          <span>
                            {posting?.isPublished ? "✓" : "○"} {website}
                            {posting?.publishedAt && (
                              <small>
                                {" "}
                                · ลงแล้ว{" "}
                                {new Date(posting.publishedAt).toLocaleDateString(
                                  "th-TH",
                                )}
                              </small>
                            )}
                          </span>
                          <button
                            type="button"
                            disabled={busy}
                            className={styles.linkButton}
                            onClick={() => savePosting(property.propertyId, website, !posting?.isPublished)}
                          >
                            {posting?.isPublished ? "ยกเลิกเครื่องหมาย" : "ทำเครื่องหมายว่าลงแล้ว"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {selected && (
        // biome-ignore lint/a11y/noStaticElementInteractions: Closing by backdrop is optional; the dialog has a keyboard-accessible close button.
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedId("");
          }}
        >
          <section
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="status-title"
          >
            <button
              type="button"
              className={styles.close}
              onClick={() => setSelectedId("")}
              aria-label="ปิด"
            >
              ×
            </button>
            <p className={styles.eyebrow}>สถานะปัจจุบัน: {statusLabels[selected.status] ?? selected.status}</p>
            <h2 id="status-title">เปลี่ยนสถานะ — {selected.name}</h2>
            <dl className={styles.propertyDetails}>
              <div>
                <dt>ประเภทอสังหา</dt>
                <dd>{selected.type}</dd>
              </div>
              <div>
                <dt>เจ้าของ</dt>
                <dd>{selected.ownerName}</dd>
              </div>
              <div>
                <dt>ที่อยู่</dt>
                <dd>{selected.address}</dd>
              </div>
              <div>
                <dt>พื้นที่</dt>
                <dd>{formatDecimal(selected.area)} ตร.ม.</dd>
              </div>
              <div>
                <dt>ราคา</dt>
                <dd>{formatDecimal(selected.price)} บาท</dd>
              </div>
              <div>
                <dt>รายละเอียด</dt>
                <dd>{selected.description || "—"}</dd>
              </div>
            </dl>
            <form onSubmit={saveStatus}>
              <label>
                สถานะใหม่
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="">เลือกสถานะ</option>
                  {statuses.map((s) => (
                    <option key={s} value={s}>{statusLabels[s]}</option>
                  ))}
                </select>
              </label>
              <label className={styles.wide}>
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(event) => setConfirmed(event.target.checked)}
                />{" "}
                {selected.status === "available" && newStatus === "in_progress"
                  ? "ยืนยันว่าทุกฝ่ายลงนามในสัญญาแล้ว"
                  : selected.status === "in_progress" && newStatus === "available"
                    ? "ยืนยันว่าการซื้อขายสิ้นสุด แต่เจ้าของยังฝากขายต่อ"
                    : selected.status === "in_progress" && newStatus === "sold"
                      ? "ยืนยันว่าโอนกรรมสิทธิ์สำเร็จแล้ว"
                      : "ยืนยันการเปลี่ยนสถานะ"}
              </label>
              <div className={styles.actions}>
                <button
                  type="submit"
                  disabled={busy}
                  className={styles.primary}
                >
                  บันทึกสถานะ
                </button>

              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
