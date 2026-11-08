import { runUseCaseQuery } from "@RealEstateProject/db";

type Row = Record<string, any>;
const id = (value: bigint | number | string | null) => value == null ? null : String(value);
const decimal = (value: unknown) => value == null ? null : String(value);
const iso = (value: Date | string | null) => value == null ? null : new Date(value).toISOString();

export async function listProperties(userId: string, status?: string | null) {
  // Q3.1 supplies the initial UC3 owned-property list; the full status listing uses Q7.
  await runUseCaseQuery<Row>("Q3.1", [BigInt(userId)]);
  // Q4.1 is the publication checklist's owned-property index; Q7.3 supplies its full display fields.
  await runUseCaseQuery<Row>("Q4.1", [BigInt(userId)]);
  const ids = await runUseCaseQuery<Row>(status ? "Q7.2" : "Q7.1", status ? [BigInt(userId), status] : [BigInt(userId)]);
  const allowed = new Set(ids.map((row) => String(row.property_id)));
  const rows = await runUseCaseQuery<Row>(status ? "Q7.4" : "Q7.3", status ? [BigInt(userId), status] : [BigInt(userId)]);
  const filtered = rows.filter((row) => allowed.has(String(row.property_id)));
  return Promise.all(filtered.map(async (r) => ({ propertyId: id(r.property_id)!, name:r.name, type:r.type,
    address:r.address, area:decimal(r.area)!, price:decimal(r.price)!, status:r.status,
    description:r.description ?? null, ownerName:r.owner_name,
    publicationChecks:(await runUseCaseQuery<Row>("Q4.4",[BigInt(userId),BigInt(String(r.property_id))])).map((p)=>({
      publicationCheckId:id(p.publication_check_id)!,websiteName:p.website_name,isPublished:p.is_published,publishedAt:iso(p.published_at)})) })));
}

export async function listStatusProperties(userId: string) {
  const rows=await runUseCaseQuery<Row>("Q8.1",[BigInt(userId)]);
  return rows.map((r)=>({propertyId:id(r.property_id)!,name:r.name,status:r.status}));
}

export async function listPropertiesByStatus(userId: string, status?: string | null) {
  const rows = await runUseCaseQuery<Row>(status ? "Q7.2" : "Q7.1", status ? [BigInt(userId), status] : [BigInt(userId)]);
  return rows.map((r) => ({ propertyId:id(r.property_id)!, name:r.name, type:r.type,
    address:r.address, price:decimal(r.price)!, status:r.status }));
}

export async function getPropertyDetail(userId: string, propertyId: string) {
  const ownedRows=await runUseCaseQuery<Row>("Q3.1",[BigInt(userId)]);
  if(!ownedRows.some((row)=>String(row.property_id)===propertyId)) return null;
  const [propertyRows, tasks, publicationChecks] = await Promise.all([
    runUseCaseQuery<Row>("Q7.3", [BigInt(userId)]).then((rows) => rows.filter((r) => String(r.property_id) === propertyId)),
    runUseCaseQuery<Row>("Q4.2", [BigInt(userId), BigInt(propertyId)]),
    runUseCaseQuery<Row>("Q4.4", [BigInt(userId), BigInt(propertyId)]),
  ]);
  const r = propertyRows[0];
  if (!r) return null;
  return { property:{propertyId:id(r.property_id)!, name:r.name, type:r.type, address:r.address,
    area:decimal(r.area)!, price:decimal(r.price)!, status:r.status, description:r.description ?? null,
    ownerName:r.owner_name},
    tasks:tasks.map((t) => ({taskId:id(t.task_id)!,stepName:t.step_name,stepOrder:t.step_order})),
    publicationChecks:publicationChecks.map((p) => ({publicationCheckId:id(p.publication_check_id)!,
      websiteName:p.website_name,isPublished:p.is_published,publishedAt:iso(p.published_at)})) };
}

export async function listAppointments(userId: string, range: {from?: Date; to?: Date} = {}) {
  const from = range.from ?? new Date(0);
  const to = range.to ?? new Date("9999-12-31T23:59:59.999Z");
  const rows = await runUseCaseQuery<Row>("Q5.1", [BigInt(userId), from, to]);
  return rows.map((r) => ({appointmentId:id(r.appointment_id)!,ownerId:id(r.owner_id),buyerId:id(r.buyer_id),
    propertyId:id(r.property_id),appointmentType:r.appointment_type,appointmentAt:iso(r.appointment_at)!,
    endAt:iso(r.end_at)!,status:r.status,details:r.details ?? null}));
}

export async function getAppointmentChoices(userId: string) {
  const [owners,buyers,properties] = await Promise.all([
    runUseCaseQuery<Row>("Q5.4",[BigInt(userId)]), runUseCaseQuery<Row>("Q5.5",[BigInt(userId)]),
    runUseCaseQuery<Row>("Q5.6",[BigInt(userId)]),
  ]);
  return {owners:owners.map((r)=>({ownerId:id(r.owner_id)!,name:r.name,phone:r.phone})),
    buyers:buyers.map((r)=>({buyerId:id(r.buyer_id)!,name:r.name,phone:r.phone})),
    properties:properties.map((r)=>({propertyId:id(r.property_id)!,ownerId:id(r.owner_id)!,name:r.name,status:r.status}))};
}

export async function listCustomers(userId: string, phone?: string | null) {
  const rows = await runUseCaseQuery<Row>("Q6.1",[BigInt(userId),phone || null]);
  return rows.map((r)=>({buyerId:id(r.buyer_id)!,name:r.name,phone:r.phone,requirements:r.requirements ?? "",
    budget:decimal(r.budget),income:decimal(r.income)}));
}

export async function getDashboardData(userId: string) {
  const [properties,appointments]=await Promise.all([listProperties(userId),listAppointments(userId)]);
  return {properties,appointments};
}
