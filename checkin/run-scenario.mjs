import {execSync} from "node:child_process";
const BASE = "http://localhost:3116";
const CODE = "E0042";
const jar = [];

async function call(method, path, body) {
  const r = await fetch(BASE + path, {
    method, headers: {"Content-Type": "application/json", cookie: jar.join("; ")},
    body: body ? JSON.stringify(body) : undefined,
  });
  for (const c of (r.headers.getSetCookie?.() ?? [])) jar.push(c.split(";")[0]);
  return r.json();
}
const psql = (sql) => execSync(
  `docker exec -i checkin-db psql -U postgres -d checkin -t -A -c ${JSON.stringify(sql.replace(/\s+/g, " "))}`
).toString().trim();

const plant = (h) => {
  psql("DELETE FROM attendance_sessions;");
  psql(`INSERT INTO attendance_sessions (id, member_id, work_date, check_in_at, kind, updated_at) SELECT gen_random_uuid()::text, id, ((now() - interval '${h} hours') + interval '2 hours')::date, now() - interval '${h} hours', 'DAY', now() FROM members WHERE employee_code = '${CODE}';`);
};

async function look(label) {
  const board = (await call("GET", "/api/attendance/today")).data;
  let me = null;
  for (const t of board.teams) for (const m of t.members) if (m.employeeCode === CODE) me = m;
  const tile = me.state === "WORKING" ? "Đang làm (viền xanh)"
             : me.state === "DONE" ? "Đã về (mờ)"
             : "Chưa vào ca hôm nay";
  const tap = me.state === "WORKING" ? "CHECK-OUT"
            : me.state === "OUT" ? "CHECK-IN"
            : me.canCheckInOvernight ? "vào ca đêm" : "không làm gì";
  console.log(`\n=== ${label}`);
  console.log(`   kiosk hiển thị : ${tile}`);
  console.log(`   giờ ghi nhận   : ${me.workedMinutes} phút (OT ${me.otMinutes})`);
  console.log(`   statuses       : ${JSON.stringify(me.statuses)}`);
  console.log(`   chạm ô sẽ      : ${tap}`);
  console.log(`   admin đếm      : đang làm ${board.totals.working}, thiếu check-out ${board.teams.flatMap(t=>t.members).filter(m=>m.statuses.includes("MISSING_CHECKOUT")).length}`);
  return me;
}

plant(6);  await look("6 giờ sau khi vào ca");
plant(14); await look("14 giờ sau — chưa quá ngưỡng 16h");
plant(20); await look("20 giờ sau — ĐÃ quá maxSessionHours = 16");
const me = await look("30 giờ sau — sang hẳn ngày hôm sau" && (plant(30), "30 giờ sau — sang ngày hôm sau"));

console.log("\n=== nhân viên chạm ô của mình lúc 30 giờ");
const r = await call("POST", "/api/attendance/checkin", {memberId: me.id});
console.log("   bấm vào ô ->", r.success ? "TẠO PHIÊN MỚI (check-in)" : "bị chặn: " + r.error);
console.log("   số phiên còn mở :", psql("SELECT count(*) FROM attendance_sessions WHERE check_out_at IS NULL;"));
console.log("   phiên 30h cũ    :", psql("SELECT to_char(check_in_at,'DD/MM HH24:MI') || ' -> ' || coalesce(to_char(check_out_at,'HH24:MI'),'VẪN CHƯA RA') FROM attendance_sessions ORDER BY check_in_at LIMIT 1;"));
