"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import styles from "./properties.module.css";

type Posting = { website: string; status: string; postedAt: string | null };
type Property = {
	id: string;
	name: string;
	type: string;
	address: string;
	area: number;
	price: number;
	description: string;
	status: string;
	owner: { name: string; phone: string };
	postings: Posting[];
};
type FormState = { message?: string; error?: string; fields?: string[] };
const statuses = ["ว่าง", "กำลังดำเนินการ", "ขายแล้ว"];
const websites = ["DDproperty", "LivingInsider", "Facebook"];
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
	const [filter, setFilter] = useState("ทั้งหมด");
	const [form, setForm] = useState(initialForm);
	const [feedback, setFeedback] = useState<FormState>({});
	const [selectedId, setSelectedId] = useState("");
	const [newStatus, setNewStatus] = useState("");
	const [checklistId, setChecklistId] = useState("");
	const [busy, setBusy] = useState(false);
	const selected = properties.find((p) => p.id === selectedId);

	const filteredProperties = useMemo(
		() =>
			filter === "ทั้งหมด"
				? properties
				: properties.filter((p) => p.status === filter),
		[properties, filter],
	);

	async function refresh(nextFilter = filter) {
		const response = await fetch(
			`/api/properties?status=${encodeURIComponent(nextFilter)}`,
		);
		if (response.ok) setProperties(await response.json());
		router.refresh();
	}

	async function saveProperty(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setBusy(true);
		setFeedback({});
		try {
			const response = await fetch("/api/properties", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(form),
			});
			const result = await response.json();
			if (!response.ok) {
				setFeedback({ error: result.error, fields: result.fields });
				return;
			}
			setProperties((current) => [result.property, ...current]);
			setForm(initialForm);
			setFeedback({ message: result.message });
		} catch {
			setFeedback({ error: "บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง" });
		} finally {
			setBusy(false);
		}
	}

	async function savePosting(propertyId: string, website: string) {
		setBusy(true);
		setFeedback({});
		try {
			const response = await fetch(`/api/properties/${propertyId}/postings`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ website }),
			});
			const result = await response.json();
			if (!response.ok) {
				setFeedback({ error: result.error });
				return;
			}
			setFeedback({ message: result.message });
			await refresh();
		} catch {
			setFeedback({ error: "บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง" });
		} finally {
			setBusy(false);
		}
	}

	async function saveStatus(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setFeedback({});
		if (!selectedId || !statuses.includes(newStatus)) {
			setFeedback({ error: "กรุณาเลือกสถานะเป็น ว่าง กำลังดำเนินการ หรือขายแล้ว." });
			return;
		}
		setBusy(true);
		try {
			const response = await fetch(`/api/properties/${selectedId}/status`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: newStatus }),
			});
			const result = await response.json();
			if (!response.ok) {
				setFeedback({ error: result.error });
				return;
			}
			setFeedback({ message: result.message });
			setNewStatus("");
			await refresh();
		} catch {
			setFeedback({ error: "บันทึกสถานะไม่สำเร็จ กรุณาลองอีกครั้ง" });
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
				<span className={styles.count}>{properties.length} รายการ</span>
			</header>
			{feedback.message && (
				<p className={styles.success} role="status">
					{feedback.message}
				</p>
			)}
			{feedback.error && (
				<p className={styles.error} role="alert">
					{feedback.error}{" "}
					<button
						type="button"
						className={styles.linkButton}
						onClick={() => setFeedback({})}
					>
						กลับไปแก้ไข
					</button>
				</p>
			)}

			<section className={styles.panel}>
				<h2>เพิ่มอสังหา</h2>
				<p className={styles.help}>กรอกข้อมูลเจ้าของและอสังหาที่ตัดสินใจรับฝากแล้ว</p>
				<form onSubmit={saveProperty} className={styles.form}>
					<label
						className={
							feedback.fields?.includes("ownerName") ? styles.invalid : ""
						}
					>
						ชื่อเจ้าของ
						<input
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
							onChange={(e) => setForm({ ...form, ownerPhone: e.target.value })}
							placeholder="ตัวเลข 10 หลัก"
						/>
					</label>
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
						<input
							value={form.type}
							onChange={(e) => setForm({ ...form, type: e.target.value })}
							placeholder="บ้าน คอนโด ที่ดิน"
						/>
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
							step="any"
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
							step="any"
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
					<div className={styles.wide}>
						<button disabled={busy} className={styles.primary}>
							{busy ? "กำลังบันทึก…" : "บันทึก"}
						</button>
					</div>
				</form>
			</section>

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
							<option>ทั้งหมด</option>
							{statuses.map((s) => (
								<option key={s}>{s}</option>
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
								className={styles.secondary}
								onClick={() => changeFilter("ทั้งหมด")}
							>
								แสดงทั้งหมด
							</button>
						)}
					</div>
				) : (
					<div className={styles.cards}>
						{filteredProperties.map((property) => (
							<article className={styles.card} key={property.id}>
								<div className={styles.cardTop}>
									<div>
										<h3>{property.name}</h3>
										<span>
											{property.type} · เจ้าของ {property.owner.name}
										</span>
									</div>
									<span className={styles.badge}>{property.status}</span>
								</div>
								<p>{property.address}</p>
								<p className={styles.meta}>
									{property.area.toLocaleString("th-TH")} ตร.ม. ·{" "}
									{property.price.toLocaleString("th-TH")} บาท
								</p>
								{property.description && <p>{property.description}</p>}
								<div className={styles.actions}>
									<button
										className={styles.secondary}
										onClick={() => {
											setSelectedId(property.id);
											setNewStatus(property.status);
											setFeedback({});
										}}
									>
										เปลี่ยนสถานะ
									</button>
									<button
										className={styles.secondary}
										onClick={() => {
											setChecklistId(
												checklistId === property.id ? "" : property.id,
											);
											setFeedback({});
										}}
									>
										เว็บที่ลงประกาศ
									</button>
								</div>
								{checklistId === property.id && (
									<div className={styles.checklist}>
										<h4>รายการเว็บไซต์</h4>
										<p className={styles.help}>
											ลงประกาศด้วยตนเอง แล้วทำเครื่องหมายเมื่อสำเร็จ
										</p>
										{websites.map((website) => {
											const posting = property.postings.find(
												(entry) => entry.website === website,
											);
											return (
												<div className={styles.website} key={website}>
													<span>
														{posting?.status === "ลงแล้ว" ? "✓" : "○"} {website}
														{posting?.postedAt && (
															<small>
																{" "}
																· {posting.status}{" "}
																{new Date(posting.postedAt).toLocaleDateString(
																	"th-TH",
																)}
															</small>
														)}
													</span>
													<button
														disabled={busy}
														className={styles.linkButton}
														onClick={() => savePosting(property.id, website)}
													>
														{posting ? "บันทึกวันที่อีกครั้ง" : "ทำเครื่องหมายว่าลงแล้ว"}
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
							className={styles.close}
							onClick={() => setSelectedId("")}
							aria-label="ปิด"
						>
							×
						</button>
						<p className={styles.eyebrow}>สถานะปัจจุบัน: {selected.status}</p>
						<h2 id="status-title">เปลี่ยนสถานะ — {selected.name}</h2>
						<dl className={styles.propertyDetails}>
							<div>
								<dt>ประเภทอสังหา</dt>
								<dd>{selected.type}</dd>
							</div>
							<div>
								<dt>เจ้าของ</dt>
								<dd>{selected.owner.name}</dd>
							</div>
							<div>
								<dt>ที่อยู่</dt>
								<dd>{selected.address}</dd>
							</div>
							<div>
								<dt>พื้นที่</dt>
								<dd>{selected.area.toLocaleString("th-TH")} ตร.ม.</dd>
							</div>
							<div>
								<dt>ราคา</dt>
								<dd>{selected.price.toLocaleString("th-TH")} บาท</dd>
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
										<option key={s}>{s}</option>
									))}
								</select>
							</label>
							<div className={styles.actions}>
								<button disabled={busy} className={styles.primary}>
									บันทึกสถานะ
								</button>
								<button
									type="button"
									className={styles.secondary}
									onClick={() => setSelectedId("")}
								>
									กลับไปแก้ไข
								</button>
							</div>
						</form>
					</section>
				</div>
			)}
		</main>
	);
}
