"use client";

import {Panel, PanelHead, Tag} from "@/components/admin/Ui";
import {formatDuration} from "@/lib/attendance/time";
import type {AttendancePolicy} from "@/lib/attendance/compute";

/**
 * Explains the rules in the admin's own words, using their live values.
 *
 * Every number below is read from the form above it, so the guide can never
 * drift from the configuration it describes — change a threshold and the
 * explanation changes with it.
 */
export function PolicyGuide({policy}: { policy: AttendancePolicy }) {
    const {
        shiftStartTime, otStartTime, overnightStartTime,
        standardShiftMinutes, breakMinutes, breakStartTime, otMinMinutes,
        dayCutoffHour, maxSessionHours,
    } = policy;

    const cutoff = `${String(dayCutoffHour).padStart(2, "0")}:00`;

    const minutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3));
    const clockSpan = minutes(otStartTime) - minutes(shiftStartTime);
    // An example of overtime too short to count, derived rather than assumed.
    const belowThreshold = minutes(otStartTime) + Math.max(1, Math.floor(otMinMinutes / 2));
    const belowThresholdLabel =
        `${String(Math.floor(belowThreshold / 60) % 24).padStart(2, "0")}:${String(belowThreshold % 60).padStart(2, "0")}`;

    return (
        <div className="flex flex-col gap-4">
            <Panel>
                <PanelHead>Hệ thống tính công thế nào</PanelHead>
                <div className="p-5 flex flex-col gap-5 text-sm leading-relaxed text-zinc-700">

                    <Section
                        n="1"
                        title="Một ngày công là một hoặc nhiều phiên"
                    >
                        Mỗi lần check-in mở một <em>phiên</em>, check-out đóng phiên đó lại. Một người có thể có
                        nhiều phiên trong cùng một ngày công — ví dụ về lúc {otStartTime} rồi quay lại làm ca đêm.
                        Giờ công của ngày là tổng các phiên, không phải hiệu giữa lần vào đầu tiên và lần ra cuối cùng.
                    </Section>

                    <Section
                        n="2"
                        title={`Ngày công đổi lúc ${cutoff}, không phải nửa đêm`}
                    >
                        Đây là mốc quan trọng nhất và cũng dễ hiểu nhầm nhất. Ca đêm bắt đầu 22:00 ngày 19 và kết thúc
                        02:00 ngày 20 vẫn thuộc trọn <strong>ngày công 19</strong>, vì {cutoff} chưa tới.
                        Nhờ vậy cả hai chặng của một đêm làm việc nằm chung một dòng trong báo cáo,
                        thay vì bị cắt đôi qua hai ngày.
                    </Section>

                    <Section
                        n="3"
                        title={`OT tính theo đồng hồ, từ ${otStartTime}`}
                    >
                        Mọi phút làm sau {otStartTime} là OT, bất kể người đó đến sớm hay muộn. Đây là lý do
                        ca {shiftStartTime}–22:00 cho đúng <strong>4 giờ OT</strong>.
                        <br/>
                        Cách khác — tính OT là phần vượt quá {formatDuration(standardShiftMinutes)} — sẽ ra 5 giờ,
                        và thưởng cho người đến sớm. Hệ thống <em>không</em> dùng cách đó.
                        <br/>
                        OT ngắn hơn <strong>{otMinMinutes} phút</strong> bị bỏ qua, nên về lúc{" "}
                        <strong>{belowThresholdLabel}</strong> không thành một khoản OT.
                    </Section>

                    <Section
                        n="4"
                        title={`Ca đêm là ca bắt đầu từ ${overnightStartTime}`}
                    >
                        Phân biệt <strong>làm muộn</strong> với <strong>ca đêm</strong>: người ở lại tới 23:00 vẫn là
                        ca ngày có OT; người check-in <em>sau</em> {overnightStartTime} được ghi là ca đêm và giờ OT
                        của họ hiện ở cột riêng. Cột này để trả phụ cấp đêm khác mức OT thường.
                    </Section>

                    <Section
                        n="5"
                        title={`Giờ thường tối đa ${formatDuration(standardShiftMinutes)}, đã trừ ${breakMinutes} phút nghỉ trưa`}
                    >
                        Nghỉ trưa được trừ khi ca làm đi qua mốc {breakStartTime}.{" "}
                        Ca {shiftStartTime}–{otStartTime} là {formatDuration(clockSpan)} đồng hồ,
                        trừ {breakMinutes} phút còn {formatDuration(clockSpan - breakMinutes)},
                        và bị chặn ở {formatDuration(standardShiftMinutes)} — nên hiện đúng một ngày công tiêu chuẩn.
                    </Section>

                    <Section
                        n="6"
                        title="Quên check-out: hệ thống tự đóng ca, không tự đoán bừa"
                    >
                        Phiên còn mở sau khi ngày công của nó đã kết thúc (quá {cutoff}) được coi là bị bỏ quên.
                        Hệ thống đóng lại và ghi giờ ra theo quy tắc cố định:
                        <ul className="mt-2 flex flex-col gap-1.5 pl-4">
                            <li className="list-disc">
                                ca ngày → ghi giờ ra là <strong>{otStartTime}</strong>, tức một ngày công bình thường
                                và <strong>không có OT</strong>;
                            </li>
                            <li className="list-disc">
                                ca bắt đầu sau {otStartTime} → ghi giờ ra là <strong>{cutoff}</strong>, giữ lại
                                phần OT thực sự đã làm.
                            </li>
                        </ul>
                        <p className="mt-2">
                            Cách này cố tình <em>không</em> lấy thời điểm đóng làm giờ ra — làm vậy thì người quên
                            check-out lúc 08:00 sẽ được cộng hơn 20 tiếng, phần lớn là OT. Ngược lại, để nguyên 0 giờ
                            thì nhân viên mất trắng một ngày. Quy tắc trên là mức ở giữa: không ai mất công,
                            cũng không ai được lợi vì quên.
                        </p>
                        <p className="mt-2">
                            Những phiên này được đánh dấu <Tag tone="ot">Chờ duyệt</Tag> ở màn hình
                            <strong> Hôm nay</strong> và <strong>Chấm công</strong>. Giờ công vẫn được tính ngay;
                            việc duyệt chỉ để xác nhận, hoặc sửa nếu bạn biết giờ về thực tế.
                        </p>
                    </Section>

                    <Section
                        n="7"
                        title={`Phiên quá ${maxSessionHours} giờ bị coi là quên check-out`}
                    >
                        Trong ngày, một phiên mở quá {maxSessionHours} giờ không còn được tính là “đang làm”.
                        Nếu ca làm thật của công ty có thể dài hơn thế, hãy tăng con số này —
                        nếu không hệ thống sẽ báo nhầm cho những ca dài hợp lệ.
                    </Section>

                </div>
            </Panel>

        </div>
    );
}

function Section({n, title, children}: { n: string; title: string; children: React.ReactNode }) {
    return (
        <section className="flex gap-3.5">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-zinc-100 text-xs font-bold text-zinc-600">
                {n}
            </span>
            <div className="flex flex-col gap-1.5 min-w-0">
                <h3 className="font-semibold text-zinc-900">{title}</h3>
                <div>{children}</div>
            </div>
        </section>
    );
}
